// Booking service — creation, validation, status changes.
// Re-checks availability immediately before saving to prevent double booking.
import * as repo from "./dataService";
import { base44 } from "@/api/base44Client";
import { isSlotAvailable, timeToMinutes, minutesToTime, budapestNow } from "./availability";

export async function logOperation(action, description, entityType, entityId) {
  try {
    await repo.operationLogs.create({
      action,
      description,
      entity_type: entityType || "",
      entity_id: entityId || "",
    });
  } catch (e) {
    // best-effort logging
  }
}

export function generateBookingCode() {
  const now = budapestNow();
  const date = now.dateStr.replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEMO-${date}-${rand}`;
}

export function formatPrice(huf) {
  return new Intl.NumberFormat("hu-HU").format(huf) + " Ft";
}

export function formatDuration(min) {
  if (min % 60 === 0) return `${min / 60} óra`;
  if (min < 60) return `${min} perc`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h} óra ${m} perc`;
}

export async function createBooking(data) {
  const service = await repo.services.get(data.service_id);
  const available = await isSlotAvailable(data.provider_id, data.dateStr, data.timeStr, service);
  if (!available) {
    throw new Error("A kiválasztott időpont sajnos már nem elérhető. Kérjük, válasszon másik időpontot.");
  }
  const startMin = timeToMinutes(data.timeStr);
  const endMin = startMin + service.duration_minutes;
  const start = `${data.dateStr}T${data.timeStr}:00`;
  const end = `${data.dateStr}T${minutesToTime(endMin)}:00`;

  const booking = await repo.bookings.create({
    booking_code: generateBookingCode(),
    provider_id: data.provider_id,
    service_id: data.service_id,
    customer_name: data.customer_name.trim(),
    customer_email: data.customer_email.trim(),
    customer_phone: data.customer_phone.trim(),
    customer_note: (data.customer_note || "").trim(),
    start_datetime: start,
    end_datetime: end,
    status: "confirmed",
  });

  // Send confirmation email automatically (best-effort, non-blocking)
  try {
    const provider = await repo.providers.get(data.provider_id);
    await base44.functions.invoke("sendBookingConfirmation", {
      booking,
      serviceName: service.name,
      providerName: provider?.name || "",
      duration: formatDuration(service.duration_minutes),
      price: formatPrice(service.price_huf),
    });
  } catch (e) {
    // best-effort — don't fail the booking if email fails
  }

  return booking;
}

export async function listBookings() {
  return repo.bookings.list();
}

export async function updateBookingStatus(id, status) {
  await repo.bookings.update(id, { status });
  await logOperation("status_change", `Státusz: ${status}`, "booking", id);
}

export async function updateBooking(id, data) {
  const result = await repo.bookings.update(id, data);
  await logOperation("edit", "Foglalás adatai szerkesztve", "booking", id);
  return result;
}

export async function deleteBooking(id) {
  await repo.bookings.remove(id);
  await logOperation("delete", "Foglalás törölve", "booking", id);
}

// Manual booking from admin — same overlap rules, auto-confirmed.
export async function createManualBooking(data) {
  const service = await repo.services.get(data.service_id);
  const available = await isSlotAvailable(data.provider_id, data.dateStr, data.timeStr, service);
  if (!available) {
    throw new Error("A kiválasztott időpont sajnos már nem elérhető. Kérjük, válasszon másik időpontot.");
  }
  const startMin = timeToMinutes(data.timeStr);
  const endMin = startMin + service.duration_minutes;
  const start = `${data.dateStr}T${data.timeStr}:00`;
  const end = `${data.dateStr}T${minutesToTime(endMin)}:00`;

  const result = await repo.bookings.create({
    booking_code: generateBookingCode(),
    provider_id: data.provider_id,
    service_id: data.service_id,
    customer_name: data.customer_name.trim(),
    customer_email: data.customer_email.trim(),
    customer_phone: data.customer_phone.trim(),
    customer_note: (data.customer_note || "").trim(),
    start_datetime: start,
    end_datetime: end,
    status: "confirmed",
  });
  await logOperation("manual_create", "Foglalás manuálisan rögzítve", "booking", result.id);
  return result;
}
