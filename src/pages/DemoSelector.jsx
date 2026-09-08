import { ArrowRight, CalendarCheck2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import CsitaryMark from "@/components/demo/CsitaryMark";
import { DEMO_PRESETS } from "@/demo/presets";

function cardStyle(branding) {
  return {
    backgroundColor: "#fbfaf7",
    "--card-accent": `hsl(${branding.primaryColor})`,
    "--card-bg": `hsl(${branding.backgroundColor})`,
  };
}

export default function DemoSelector() {
  return (
    <main className="selector-page min-h-screen">
      <header className="selector-header">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-5 sm:px-6">
          <CsitaryMark />
        </div>
      </header>
      <section className="selector-intro">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <p className="selector-kicker">A Csitáry Office időpontfoglaló demója</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-6xl">Próbáld ki működés közben!</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">Válassz egy vállalkozástípust, foglalj időpontot vendégként, majd nézd meg ugyanazt az adminfelületen is.</p>
          <div className="selector-features mt-9">
            <span><ShieldCheck /> Fiktív mintaadatok</span>
            <span><SlidersHorizontal /> Teljes adminfelület</span>
            <span><CalendarCheck2 /> Teljes foglalási folyamat</span>
          </div>
          <div className="customizable-note">
            <strong>A rendszer hozzád alkalmazkodik.</strong> A bemutatott funkciók igény szerint tovább bővíthetők és a vállalkozásod működésére szabhatók.
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-8 flex items-end justify-between border-b border-stone-300 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Válassz környezetet</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Öt különböző vállalkozás, egy rendszer</h2>
          </div>
          <span className="hidden text-sm text-stone-500 sm:block">A demó bármikor alaphelyzetbe állítható</span>
        </div>
        <div className="selector-grid">
          {DEMO_PRESETS.map((preset) => (
            <Link key={preset.id} to={`/demo/${preset.id}/booking`} className="selector-card group" style={cardStyle(preset.branding)}>
              <div className="selector-card__image">
                <img src={preset.branding.heroImage} alt="" loading="lazy" />
                <span className="selector-card__monogram"><img src={preset.branding.logoImage} alt={`${preset.businessName} logója`} /></span>
              </div>
              <div className="selector-card__body">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--card-accent)" }}>{preset.businessType}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{preset.businessName}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">{preset.description}</p>
                <span className="selector-card__link">Demó megnyitása <ArrowRight /></span>
              </div>
            </Link>
          ))}
        </div>
        <div className="selector-notice">
          <p className="font-semibold">Bemutató rendszer, biztonságos próbaadatokkal</p>
          <p className="mt-1 text-stone-600">A megadott adatok nem kerülnek tartós mentésre. A kipróbáláshoz használj fiktív adatokat.</p>
        </div>
      </section>
      <footer className="selector-footer border-t border-stone-300 px-4 py-8 text-sm text-stone-500">
        <CsitaryMark compact />
        <span>Digitális megoldások kisvállalkozásoknak</span>
      </footer>
    </main>
  );
}
