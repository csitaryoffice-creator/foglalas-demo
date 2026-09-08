import { useState } from "react";
import { Info } from "lucide-react";

export default function ServiceInfoIcon({ description }) {
  const [show, setShow] = useState(false);
  if (!description) return null;
  return (
    <div className="relative shrink-0">
      <span
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-charcoal/40 hover:text-charcoal/60 cursor-help inline-flex"
      >
        <Info className="h-4 w-4" />
      </span>
      {show && (
        <div className="absolute right-0 top-5 z-30 w-56 p-2.5 bg-white border border-charcoal/15 text-xs text-charcoal/70 shadow-lg">
          {description}
        </div>
      )}
    </div>
  );
}