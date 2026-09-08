import { Loader2 } from "lucide-react";

// slots: [{ time, status }] where status is "available" | "booked" | "pending" | "unavailable"
function withAlpha(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return hex;
  const value = parseInt(clean, 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export default function TimeSlots({ slots, loading, value, onSelect, colors }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-charcoal/50 text-sm min-h-[120px]">
        <Loader2 className="h-4 w-4 animate-spin" /> Időpontok betöltése…
      </div>
    );
  }
  if (!slots || slots.length === 0) {
    return (
      <p className="text-sm text-charcoal/50 min-h-[60px]">
        Erre a napra nincs időpont. Kérjük, válasszon másik dátumot.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
        {slots.map((s) => {
          const isAvailable = s.status === "available";
          const isSelected = value === s.time;
          const palette = colors || { available: "#71805a", selected: "#3f4b32", unavailable: "#d8d4cb" };
          let cls;
          let slotStyle;
          if (isSelected) {
            cls = "text-white font-medium";
            slotStyle = { backgroundColor: palette.selected, borderColor: palette.selected };
          } else if (s.status === "available") {
            cls = "text-foreground hover:opacity-80";
            slotStyle = { backgroundColor: withAlpha(palette.available, 0.14), borderColor: palette.available };
          } else if (s.status === "pending") {
            cls = "text-muted-foreground border-transparent cursor-not-allowed";
            slotStyle = { backgroundColor: withAlpha(palette.unavailable, 0.45) };
          } else {
            // booked or unavailable
            cls = "text-muted-foreground border-transparent cursor-not-allowed line-through";
            slotStyle = { backgroundColor: withAlpha(palette.unavailable, 0.45) };
          }
          return (
            <button
              key={s.time}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(s.time)}
              style={slotStyle}
              className={`py-2 text-sm border transition-colors ${cls}`}
            >
              {s.time}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-charcoal/50">
        <span className="flex items-center gap-1"><span className="w-3 h-3 border inline-block" style={{ backgroundColor: withAlpha(colors?.available || "#71805a", 0.14), borderColor: colors?.available || "#71805a" }}></span> Szabad</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 border border-transparent inline-block" style={{ backgroundColor: withAlpha(colors?.unavailable || "#d8d4cb", 0.45) }}></span> Nem elérhető</span>
      </div>
    </div>
  );
}
