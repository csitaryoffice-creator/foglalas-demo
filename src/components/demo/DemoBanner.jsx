import { Info, RotateCcw } from "lucide-react";
import { useDemo } from "@/demo/DemoContext";
import { clearCache } from "@/services/settings";

export default function DemoBanner() {
  const { preset, resetDemo } = useDemo();

  function resetCurrentDemo() {
    if (!confirm("Biztosan alaphelyzetbe állítod ezt a demót? Minden munkamenetben végzett módosítás törlődik.")) return;
    resetDemo();
    clearCache();
    window.location.reload();
  }
  return (
    <div className="demo-banner border-b">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-3 px-4 py-2.5 text-xs sm:px-6">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p><strong>Bemutató rendszer.</strong> A megadott adatok nem kerülnek tartós mentésre. Használj fiktív adatokat.</p>
            {preset.safetyNote && <p className="mt-1 font-medium">{preset.safetyNote}</p>}
          </div>
        </div>
        <button type="button" onClick={resetCurrentDemo} className="demo-reset-button"><RotateCcw /> <span className="hidden sm:inline">Demó alaphelyzetbe állítása</span><span className="sm:hidden">Alaphelyzet</span></button>
      </div>
    </div>
  );
}
