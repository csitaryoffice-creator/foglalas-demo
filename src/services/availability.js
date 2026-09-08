// Availability engine — pure, portable slot logic + data access via repository.
// All times are Europe/Budapest local. Stored as naive "YYYY-MM-DDTHH:MM:00".
import * as repo from "./dataService";
import { getSettings } from "./settings";

// ---- Pure helpers (no framework dependency) ----

export function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function budapestNow() {
  const d = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Budapest",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).formatToParts(d);
    const g = (t) => parts.find((p) => p.type === t)?.value || "00";
    let hour = g("hour");
    if (hour === "24") hour = "00";
    return {
      dateStr: `${g("year")}-${g("month")}-${g("day")}`,
      timeStr: `${hour}:${g("minute")}`,
      minutes: parseInt(hour) * 60 + parseInt(g("minute")),
    };
  } catch {
    const pad = (n) => String(n).padStart(2, "0");
    return {
      dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      timeStr: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      minutes: d.getHours() * 60 + d.getMinutes(),
    };
  }
}

export function weekdayFromDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun … 6=Sat
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const pad = (x) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

// Subtract blocked intervals from working windows (interval arithmetic).
function subtractBlocked(windows, blocked) {
  let result = windows.map((w) => ({ start: w.start, end: w.end }));
  for (const b of blocked) {
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    if (bEnd <= bStart) continue;
    const next = [];
    for (const w of result) {
      const wStart = timeToMinutes(w.start);
      const wEnd = timeToMinutes(w.end);
      if (wEnd <= wStart) continue;
      // No overlap
      if (bEnd <= wStart || bStart >= wEnd) {
        next.push(w);
      } else if (bStart <= wStart && bEnd >= wEnd) {
        // Blocked covers entire window — drop it
      } else if (bStart <= wStart && bEnd < wEnd) {
        next.push({ start: minutesToTime(bEnd), end: w.end });
      } else if (bStart > wStart && bEnd >= wEnd) {
        next.push({ start: w.start, end: minutesToTime(bStart) });
      } else {
        // Blocked in the middle — split
        next.push({ start: w.start, end: minutesToTime(bStart) });
        next.push({ start: minutesToTime(bEnd), end: w.end });
      }
    }
    result = next;
  }
  return result;
}

// ---- Data-backed operations ----

export async function getWorkingWindows(providerId, dateStr) {
  const exceptions = await repo.availabilityExceptions.list();
  const dayExc = exceptions.filter((e) => e.provider_id === providerId && e.date === dateStr);

  // Full-day closure
  if (dayExc.some((e) => e.type === "closed")) return [];

  // Custom hours override weekly schedule
  const custom = dayExc.find((e) => e.type === "custom_hours" && e.start_time && e.end_time);
  let windows;
  if (custom) {
    windows = [{ start: custom.start_time, end: custom.end_time }];
  } else {
    const wd = weekdayFromDate(dateStr);
    const rules = await repo.availabilityRules.list();
    windows = rules
      .filter((r) => r.provider_id === providerId && r.weekday === wd && r.active)
      .map((r) => ({ start: r.start_time, end: r.end_time }));
  }

  // Subtract blocked periods (supports multiple per day)
  const blocked = dayExc.filter((e) => e.type === "blocked" && e.start_time && e.end_time);
  if (blocked.length === 0) return windows;
  return subtractBlocked(windows, blocked);
}

export async function getAvailableSlots(providerId, dateStr, service) {
  const settings = await getSettings();
  const provider = await repo.providers.get(providerId);
  const isKata = (provider?.name || "").toLowerCase().includes("kata");
  const slotInterval = isKata ? 5 : (parseInt(settings.slot_interval) || 30);
  const leadMinutes = parseInt(settings.booking_lead_minutes) || 120;

  const windows = await getWorkingWindows(providerId, dateStr);
  if (!windows.length) return [];

  const now = budapestNow();
  const isToday = dateStr === now.dateStr;
  const minStart = isToday ? now.minutes + leadMinutes : 0;

  const allBookings = await repo.bookings.list();
  const dayBookings = allBookings.filter(
    (b) =>
      b.provider_id === providerId &&
      b.status !== "cancelled" &&
      b.start_datetime &&
      b.start_datetime.startsWith(dateStr)
  );

  const duration = service.duration_minutes;
  const bufBefore = service.buffer_before_minutes || 0;
  const bufAfter = service.buffer_after_minutes || 0;

  const slots = [];
  for (const w of windows) {
    const wStart = timeToMinutes(w.start);
    const wEnd = timeToMinutes(w.end);
    let cur = wStart;
    while (cur + duration <= wEnd) {
      if (cur >= minStart) {
        const resStart = cur - bufBefore;
        const resEnd = cur + duration + bufAfter;
        const overlap = dayBookings.some((b) => {
          const bStart = timeToMinutes(b.start_datetime.substring(11, 16));
          const bEnd = timeToMinutes(b.end_datetime.substring(11, 16));
          return resStart < bEnd && resEnd > bStart;
        });
        if (!overlap) slots.push(minutesToTime(cur));
      }
      cur += slotInterval;
    }
  }
  return slots;
}

// Returns all time slots in working windows with status: available | booked | pending | unavailable
export async function getDaySchedule(providerId, dateStr, service) {
  const settings = await getSettings();
  const provider = await repo.providers.get(providerId);
  const isKata = (provider?.name || "").toLowerCase().includes("kata");
  const slotInterval = isKata ? 5 : (parseInt(settings.slot_interval) || 30);
  const leadMinutes = parseInt(settings.booking_lead_minutes) || 120;

  const windows = await getWorkingWindows(providerId, dateStr);
  if (!windows.length) return [];

  const now = budapestNow();
  const isToday = dateStr === now.dateStr;
  const minStart = isToday ? now.minutes + leadMinutes : 0;

  const allBookings = await repo.bookings.list();
  const dayBookings = allBookings.filter(
    (b) =>
      b.provider_id === providerId &&
      b.status !== "cancelled" &&
      b.start_datetime &&
      b.start_datetime.startsWith(dateStr)
  );

  const duration = service.duration_minutes;
  const bufBefore = service.buffer_before_minutes || 0;
  const bufAfter = service.buffer_after_minutes || 0;

  const slots = [];
  for (const w of windows) {
    const wStart = timeToMinutes(w.start);
    const wEnd = timeToMinutes(w.end);
    let cur = wStart;
    while (cur + duration <= wEnd) {
      const timeStr = minutesToTime(cur);
      const resStart = cur - bufBefore;
      const resEnd = cur + duration + bufAfter;

      const overlapping = dayBookings.find((b) => {
        const bStart = timeToMinutes(b.start_datetime.substring(11, 16));
        const bEnd = timeToMinutes(b.end_datetime.substring(11, 16));
        return resStart < bEnd && resEnd > bStart;
      });

      let status;
      if (overlapping) {
        status = overlapping.status === "pending" ? "pending" : "booked";
      } else if (cur < minStart) {
        status = "unavailable";
      } else {
        status = "available";
      }

      slots.push({ time: timeStr, status });
      cur += slotInterval;
    }
  }
  return slots;
}

// Per-day status for a month: "closed" | "available" | "full"
export async function getMonthSlotStatus(providerId, service, year, month) {
  const [exceptions, rules, allBookings] = await Promise.all([
    repo.availabilityExceptions.list(),
    repo.availabilityRules.list(),
    repo.bookings.list(),
  ]);
  const providerExc = exceptions.filter((e) => e.provider_id === providerId);
  const providerRules = rules.filter((r) => r.provider_id === providerId && r.active);
  const providerBookings = allBookings.filter(
    (b) => b.provider_id === providerId && b.status !== "cancelled" && b.start_datetime
  );

  const settings = await getSettings();
  const provider = await repo.providers.get(providerId);
  const isKata = (provider?.name || "").toLowerCase().includes("kata");
  const slotInterval = isKata ? 5 : (parseInt(settings.slot_interval) || 30);
  const leadMinutes = parseInt(settings.booking_lead_minutes) || 120;
  const now = budapestNow();
  const duration = service.duration_minutes;
  const bufBefore = service.buffer_before_minutes || 0;
  const bufAfter = service.buffer_after_minutes || 0;

  const result = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayExc = providerExc.filter((e) => e.date === dateStr);

    if (dayExc.some((e) => e.type === "closed")) {
      result[dateStr] = "closed";
      continue;
    }

    // Build windows
    let windows;
    const custom = dayExc.find((e) => e.type === "custom_hours" && e.start_time && e.end_time);
    if (custom) {
      windows = [{ start: custom.start_time, end: custom.end_time }];
    } else {
      const wd = weekdayFromDate(dateStr);
      windows = providerRules
        .filter((r) => r.weekday === wd)
        .map((r) => ({ start: r.start_time, end: r.end_time }));
    }

    // Subtract blocked
    const blocked = dayExc.filter((e) => e.type === "blocked" && e.start_time && e.end_time);
    const hasBlocked = blocked.length > 0;
    if (hasBlocked) windows = subtractBlocked(windows, blocked);

    if (!windows.length) {
      result[dateStr] = "closed";
      continue;
    }

    // Check if any available slot exists
    const isToday = dateStr === now.dateStr;
    const minStart = isToday ? now.minutes + leadMinutes : 0;
    const dayBookings = providerBookings.filter((b) => b.start_datetime.startsWith(dateStr));

    let hasAvailable = false;
    for (const w of windows) {
      if (hasAvailable) break;
      const wStart = timeToMinutes(w.start);
      const wEnd = timeToMinutes(w.end);
      let cur = wStart;
      while (cur + duration <= wEnd) {
        if (cur >= minStart) {
          const resStart = cur - bufBefore;
          const resEnd = cur + duration + bufAfter;
          const overlap = dayBookings.some((b) => {
            const bStart = timeToMinutes(b.start_datetime.substring(11, 16));
            const bEnd = timeToMinutes(b.end_datetime.substring(11, 16));
            return resStart < bEnd && resEnd > bStart;
          });
          if (!overlap) {
            hasAvailable = true;
            break;
          }
        }
        cur += slotInterval;
      }
    }

    result[dateStr] = hasAvailable ? (hasBlocked ? "blocked" : "available") : "full";
  }
  return result;
}

export async function isSlotAvailable(providerId, dateStr, timeStr, service) {
  const slots = await getAvailableSlots(providerId, dateStr, service);
  return slots.includes(timeStr);
}

export async function getMaxBookableDate() {
  const settings = await getSettings();
  const days = parseInt(settings.booking_window_days) || 60;
  return addDays(budapestNow().dateStr, days);
}

// Batch check: which dates in a month have working windows (for calendar disabling).
// Loads exceptions + rules once, then checks locally. Much cheaper than per-day calls.
export async function getMonthAvailability(providerId, year, month) {
  const [exceptions, rules] = await Promise.all([
    repo.availabilityExceptions.list(),
    repo.availabilityRules.list(),
  ]);
  const providerExc = exceptions.filter((e) => e.provider_id === providerId);
  const providerRules = rules.filter((r) => r.provider_id === providerId && r.active);

  const result = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayExc = providerExc.filter((e) => e.date === dateStr);
    if (dayExc.some((e) => e.type === "closed")) {
      result[dateStr] = false;
      continue;
    }
    const custom = dayExc.find((e) => e.type === "custom_hours" && e.start_time && e.end_time);
    if (custom) {
      result[dateStr] = true;
      continue;
    }
    const wd = weekdayFromDate(dateStr);
    const hasRule = providerRules.some((r) => r.weekday === wd);
    result[dateStr] = hasRule;
  }
  return result;
}