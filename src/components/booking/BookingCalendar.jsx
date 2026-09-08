import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthSlotStatus, budapestNow, addDays } from "@/services/availability";

const MONTH_NAMES = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const DAY_LABELS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function withAlpha(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const value = parseInt(clean, 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export default function BookingCalendar({ providerId, service, value, onChange, maxDate, colors }) {
  const today = budapestNow().dateStr;
  const initial = value ? value.split("-") : today.split("-");
  const [viewYear, setViewYear] = useState(parseInt(initial[0]));
  const [viewMonth, setViewMonth] = useState(parseInt(initial[1]) - 1);
  const [dayStatus, setDayStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId || !service) return;
    setLoading(true);
    getMonthSlotStatus(providerId, service, viewYear, viewMonth)
      .then(setDayStatus)
      .finally(() => setLoading(false));
  }, [providerId, service, viewYear, viewMonth]);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const maxD = maxDate || addDays(today, 60);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDisabled(dateStr) {
    if (dateStr < today) return true;
    if (dateStr > maxD) return true;
    if (loading) return false;
    return dayStatus[dateStr] === "closed";
  }

  function handleSelect(day) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="select-none max-w-[280px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 border border-charcoal/15 hover:border-charcoal/30 transition-colors"
          aria-label="Előző hónap"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-charcoal" />
        </button>
        <span className="font-heading text-sm text-charcoal">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 border border-charcoal/15 hover:border-charcoal/30 transition-colors"
          aria-label="Következő hónap"
        >
          <ChevronRight className="h-3.5 w-3.5 text-charcoal" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-charcoal/40 font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const disabled = isDisabled(dateStr);
          const selected = value === dateStr;
          const isToday = dateStr === today;
          const status = dayStatus[dateStr];
          const palette = colors || { available: "#71805a", selected: "#3f4b32", unavailable: "#d8d4cb" };

          let cellClass;
          let cellStyle;
          if (selected) {
            cellClass = "text-white font-medium";
            cellStyle = { backgroundColor: palette.selected, borderColor: palette.selected };
          } else if (status === "closed") {
            cellClass = "text-muted-foreground cursor-not-allowed";
            cellStyle = { backgroundColor: withAlpha(palette.unavailable, 0.45), borderColor: "transparent" };
          } else if (status === "blocked") {
            cellClass = "text-foreground hover:opacity-80";
            cellStyle = { backgroundColor: withAlpha(palette.unavailable, 0.45), borderColor: palette.unavailable };
          } else if (disabled) {
            cellClass = "border-transparent text-charcoal/25 cursor-not-allowed";
          } else if (status === "available") {
            cellClass = "text-foreground hover:opacity-80";
            cellStyle = { backgroundColor: withAlpha(palette.available, 0.14), borderColor: palette.available };
          } else if (status === "full") {
            cellClass = "text-muted-foreground cursor-not-allowed line-through";
            cellStyle = { backgroundColor: withAlpha(palette.unavailable, 0.45), borderColor: "transparent" };
          } else {
            cellClass = "border-charcoal/10 text-charcoal hover:border-forest hover:text-forest";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={disabled || status === "full"}
              onClick={() => handleSelect(day)}
              style={cellStyle}
              className={`aspect-square flex items-center justify-center text-xs border transition-colors ${cellClass} ${isToday && !selected ? "ring-1 ring-forest/40" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-[10px] text-charcoal/40 mt-2 text-center">Naptár betöltése…</p>
      )}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-charcoal/50 justify-center flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border inline-block" style={{ backgroundColor: withAlpha(colors?.available || "#71805a", 0.14), borderColor: colors?.available || "#71805a" }}></span> Szabad</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-transparent inline-block" style={{ backgroundColor: withAlpha(colors?.unavailable || "#d8d4cb", 0.45) }}></span> Nem elérhető</span>
      </div>
    </div>
  );
}
