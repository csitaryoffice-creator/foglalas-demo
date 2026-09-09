import { useState, useEffect } from "react";
import * as repo from "@/services/dataService";
import { budapestNow, addDays, weekdayFromDate, timeToMinutes } from "@/services/availability";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BookingCreateDialog from "@/components/admin/BookingCreateDialog";
import { useDemo } from "@/demo/DemoContext";

const STATUS_PALETTE = {
  pending: { background: "#e7f2fb", border: "#79a8cd", text: "#244f70" },
  confirmed: { background: "#edf1e3", border: "#8e9b68", text: "#48532f" },
  completed: { background: "#fff2bd", border: "#d4ad39", text: "#705817" },
  cancelled: { background: "#fbe5e3", border: "#d47b75", text: "#7f3732" },
  no_show: { background: "#fbe5e3", border: "#d47b75", text: "#7f3732" },
};

const STATUS = {
  pending: "Függőben",
  confirmed: "Megerősítve",
  completed: "Lezárt",
  cancelled: "Lemondva",
  no_show: "Nem jelent meg",
};

const MONTH_NAMES = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const DAY_LABELS_SHORT = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function withAlpha(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const value = parseInt(clean, 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function bookingCalendarStyle(booking, providers) {
  const provider = providers.find((p) => p.id === booking.provider_id);
  const providerColor = provider?.calendar_color || "#527a73";
  const status = STATUS_PALETTE[booking.status] || STATUS_PALETTE.pending;
  return {
    backgroundColor: status.background,
    borderColor: status.border,
    borderLeftColor: providerColor,
    boxShadow: `inset 3px 0 0 ${providerColor}`,
    color: status.text,
    textDecoration: booking.status === "cancelled" ? "line-through" : "none",
  };
}

function statusBadgeStyle(statusKey) {
  const status = STATUS_PALETTE[statusKey] || STATUS_PALETTE.pending;
  return { backgroundColor: status.background, borderColor: status.border, color: status.text };
}

export default function AdminCalendar({ providers, services, bookings: propBookings, onSelectBooking, onReload }) {
  const { terminology } = useDemo();
  const [view, setView] = useState("day");
  const [refDate, setRefDate] = useState(budapestNow().dateStr);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (propBookings) {
      setBookings(propBookings);
      setLoading(false);
    } else {
      repo.bookings.list().then((b) => { setBookings(b); setLoading(false); });
    }
  }, [propBookings]);

  const provName = (id) => providers.find((p) => p.id === id)?.name || "—";
  const svcName = (id) => services.find((s) => s.id === id)?.name || "—";

  function navigate(direction) {
    if (view === "day") setRefDate(addDays(refDate, direction));
    else if (view === "week") setRefDate(addDays(refDate, direction * 7));
    else {
      const [y, m, d] = refDate.split("-").map(Number);
      const dt = new Date(y, m - 1 + direction, d);
      const pad = (x) => String(x).padStart(2, "0");
      setRefDate(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
    }
  }

  const filteredBookings = providerFilter
    ? bookings.filter((b) => b.provider_id === providerFilter)
    : bookings;

  function bookingsForDate(dateStr) {
    return filteredBookings
      .filter((b) => b.start_datetime?.startsWith(dateStr))
      .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  }

  const headerLabel = (() => {
    const [y, m, d] = refDate.split("-").map(Number);
    if (view === "day") return `${y}. ${m}. ${d}.`;
    if (view === "week") {
      const weekStart = getWeekStart(refDate);
      const weekEnd = addDays(weekStart, 6);
      return `${weekStart} – ${weekEnd}`;
    }
    return `${MONTH_NAMES[m - 1]} ${y}`;
  })();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border">
            {["day", "week", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === v ? "bg-forest text-ivory" : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {v === "day" ? "Napi" : v === "week" ? "Heti" : "Havi"}
              </button>
            ))}
          </div>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="border px-3 py-1.5 text-sm bg-card"
          >
            <option value="">Összes {terminology.provider.toLowerCase()}</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center px-3 py-1.5 bg-forest text-ivory text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4 mr-1" /> Új {terminology.customer.toLowerCase()}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="p-2 border border-border hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-heading text-base text-foreground">{headerLabel}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefDate(budapestNow().dateStr)} className="px-3 py-1.5 text-sm border border-border hover:bg-muted">
            Ma
          </button>
          <button onClick={() => navigate(1)} className="p-2 border border-border hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Foglalási állapotok színei">
        {[
          ["confirmed", "Megerősítve"],
          ["cancelled", "Lemondva"],
          ["completed", "Lezárt"],
          ["pending", "Függőben"],
        ].map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 border" style={statusBadgeStyle(key)} /> {label}
          </span>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Betöltés…</p>
      ) : view === "day" ? (
        <DayView dateStr={refDate} bookings={bookingsForDate(refDate)} onSelect={onSelectBooking} provName={provName} svcName={svcName} providers={providers} />
      ) : view === "week" ? (
        <WeekView weekStart={getWeekStart(refDate)} bookings={filteredBookings} onSelect={onSelectBooking} provName={provName} svcName={svcName} providers={providers} />
      ) : (
        <MonthView refDate={refDate} bookings={filteredBookings} onSelect={onSelectBooking} providers={providers} />
      )}

      {showCreate && (
        <BookingCreateDialog
          providers={providers}
          services={services}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); onReload?.(); }}
        />
      )}
    </div>
  );
}

function getWeekStart(dateStr) {
  const wd = weekdayFromDate(dateStr);
  const offset = (wd + 6) % 7;
  return addDays(dateStr, -offset);
}

function DayView({ dateStr, bookings, onSelect, provName, svcName, providers }) {
  if (bookings.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Erre a napra nincs foglalás.</p>;
  }
  return (
    <div className="space-y-2">
      {bookings.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect?.(b)}
          className="w-full text-left border p-3 transition-colors hover:opacity-80"
          style={bookingCalendarStyle(b, providers)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">
                {b.start_datetime.substring(11, 16)} – {b.end_datetime?.substring(11, 16)}
              </p>
              <p className="text-sm mt-0.5">{b.customer_name}</p>
              <p className="text-xs mt-0.5 opacity-80">
                {provName(b.provider_id)} · {svcName(b.service_id)}
              </p>
            </div>
            <span className="border px-2 py-0.5 text-xs whitespace-nowrap" style={statusBadgeStyle(b.status)}>
              {STATUS[b.status]}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function layoutConcurrentBookings(dayBookings) {
  const sorted = [...dayBookings].sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  const layout = {};
  const groups = [];
  let currentGroup = [];
  let groupEnd = 0;

  for (const b of sorted) {
    const start = timeToMinutes(b.start_datetime.substring(11, 16));
    if (start >= groupEnd && currentGroup.length > 0) {
      groups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(b);
    const end = timeToMinutes((b.end_datetime || b.start_datetime).substring(11, 16));
    groupEnd = Math.max(groupEnd, end);
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  for (const group of groups) {
    const columns = [];
    for (const b of group) {
      const start = timeToMinutes(b.start_datetime.substring(11, 16));
      const end = timeToMinutes((b.end_datetime || b.start_datetime).substring(11, 16));
      let colIndex = columns.findIndex((c) => c <= start);
      if (colIndex === -1) {
        colIndex = columns.length;
        columns.push(end);
      } else {
        columns[colIndex] = end;
      }
      layout[b.id] = { col: colIndex, totalCols: 0 };
    }
    const totalCols = columns.length;
    for (const b of group) {
      layout[b.id].totalCols = totalCols;
    }
  }

  return layout;
}

function WeekView({ weekStart, bookings, onSelect, provName, svcName, providers }) {
  const DAY_LABELS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const START_HOUR = 7;
  const END_HOUR = 21;
  const HOUR_HEIGHT = 48;
  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[760px]">
          <div className="grid border-b" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
            <div className="border-r" />
            {days.map((dateStr) => {
              const [, m, d] = dateStr.split("-").map(Number);
              const wd = weekdayFromDate(dateStr);
              return (
                <div key={dateStr} className="px-1 py-2 text-center border-l">
                  <p className="text-xs font-medium text-foreground">{DAY_LABELS[(wd + 6) % 7]}</p>
                  <p className="text-xs text-muted-foreground">{m}/{d}</p>
                </div>
              );
            })}
          </div>
          <div className="grid relative" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
            <div>
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                <div
                  key={i}
                  style={{ height: HOUR_HEIGHT }}
                  className="text-[10px] text-muted-foreground text-right pr-1.5 border-b border-r pt-0.5"
                >
                  {String(START_HOUR + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {days.map((dateStr) => {
              const dayBookings = bookings
                .filter((b) => b.start_datetime?.startsWith(dateStr))
                .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
              const layout = layoutConcurrentBookings(dayBookings);
              return (
                <div key={dateStr} className="border-l relative" style={{ height: totalHeight }}>
                  {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                    <div key={i} style={{ height: HOUR_HEIGHT }} className="border-b" />
                  ))}
                  {dayBookings.map((b) => {
                    const startMin = timeToMinutes(b.start_datetime.substring(11, 16));
                    const endStr = b.end_datetime?.substring(11, 16) || b.start_datetime.substring(11, 16);
                    const endMin = timeToMinutes(endStr);
                    const top = Math.max((startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60), 0);
                    const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60) - 2, 18);
                    const { col, totalCols } = layout[b.id];
                    const widthPct = 100 / totalCols;
                    const leftPct = col * widthPct;
                    return (
                      <button
                        key={b.id}
                        onClick={() => onSelect?.(b)}
                        className="absolute px-1 py-0.5 text-[10px] leading-tight overflow-hidden border-l-2 transition-opacity hover:opacity-80"
                        style={{ top, height, left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`, ...bookingCalendarStyle(b, providers) }}
                      >
                        <p className="font-medium truncate">{b.start_datetime.substring(11, 16)} {b.customer_name}</p>
                        <p className="truncate opacity-80">{svcName(b.service_id)}</p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs">
            {providers.map((provider) => (
              <span key={provider.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 border" style={{ backgroundColor: withAlpha(provider.calendar_color || "#527a73", 0.16), borderColor: provider.calendar_color || "#527a73" }} /> {provider.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden space-y-4">
        {days.map((dateStr) => {
          const dayBookings = bookings
            .filter((b) => b.start_datetime?.startsWith(dateStr))
            .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
          const [, m, d] = dateStr.split("-").map(Number);
          const wd = weekdayFromDate(dateStr);
          return (
            <div key={dateStr}>
              <p className="text-xs font-medium text-foreground mb-1.5">{DAY_LABELS[(wd + 6) % 7]} — {m}/{d}</p>
              {dayBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2">—</p>
              ) : (
                <div className="space-y-1.5">
                  {dayBookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSelect?.(b)}
                      className="w-full text-left border-l-2 px-2 py-1.5 text-xs transition-opacity hover:opacity-80"
                      style={bookingCalendarStyle(b, providers)}
                    >
                      <p className="font-medium">{b.start_datetime.substring(11, 16)} — {b.end_datetime?.substring(11, 16)} · {b.customer_name}</p>
                      <p className="opacity-80 truncate">{provName(b.provider_id)} · {svcName(b.service_id)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function MonthView({ refDate, bookings, onSelect, providers }) {
  const [y, m] = refDate.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS_SHORT.map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="min-h-[80px] sm:min-h-[100px]" />;
          const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayBookings = bookings.filter((b) => b.start_datetime?.startsWith(dateStr));
          return (
            <div key={i} className="min-h-[80px] sm:min-h-[100px] border bg-card p-1 overflow-hidden">
              <p className="text-xs text-muted-foreground mb-1">{day}</p>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelect?.(b)}
                    className="w-full text-left px-1 py-0.5 text-[10px] truncate border-l-2 transition-opacity hover:opacity-80"
                    style={bookingCalendarStyle(b, providers)}
                  >
                    {b.start_datetime.substring(11, 16)} {b.customer_name}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} további</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
