import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, LogOut, RotateCcw } from "lucide-react";
import * as repo from "@/services/dataService";
import { clearCache } from "@/services/settings";
import { useDemo } from "@/demo/DemoContext";
import DemoBanner from "@/components/demo/DemoBanner";
import DemoNav from "@/components/demo/DemoNav";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminArchive from "@/components/admin/AdminArchive";
import AdminServices from "@/components/admin/AdminServices";
import BlockedSlotsPanel from "@/components/admin/BlockedSlotsPanel";
import AdminSettings from "@/components/admin/AdminSettings";

export default function Admin() {
  const { preset, terminology, bookingPath, adminLoginPath, resetDemo, revision } = useDemo();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const TABS = [
    { k: "dashboard", l: "Mai foglalások" },
    { k: "archive", l: "Archívum" },
    { k: "services", l: terminology.servicePlural },
    { k: "blocked", l: "Lezárandó időpontok" },
    { k: "settings", l: "Beállítások" },
  ];

  async function loadAll() {
    const [b, p, s] = await Promise.all([
      repo.bookings.list(),
      repo.providers.list(),
      repo.services.list(),
    ]);
    setBookings(b);
    setProviders(p);
    setServices(s);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [revision]);

  const sessionToken = sessionStorage.getItem("borka_admin_session");
  const sessionTime = sessionStorage.getItem("borka_admin_session_time");
  const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

  if (!sessionToken || !sessionTime || Date.now() - parseInt(sessionTime) > SESSION_TIMEOUT) {
    sessionStorage.removeItem("borka_admin_session");
    sessionStorage.removeItem("borka_admin_session_time");
    navigate(adminLoginPath, { replace: true });
    return null;
  }

  function logout() {
    sessionStorage.removeItem("borka_admin_session");
    sessionStorage.removeItem("borka_admin_session_time");
    navigate(adminLoginPath, { replace: true });
  }

  function resetCurrentDemo() {
    if (!confirm("Biztosan alaphelyzetbe állítod ezt a demót? Minden munkamenetben végzett módosítás törlődik.")) return;
    resetDemo();
    clearCache();
    setTab("dashboard");
    loadAll();
  }

  return (
    <div className="admin-shell min-h-screen bg-background">
      <DemoNav adminAuthenticated />
      <DemoBanner />
      <header className="admin-toolbar border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <h1 className="font-heading text-lg text-foreground">{preset.businessName} · Admin</h1>
          <div className="flex items-center gap-4">
            <button onClick={resetCurrentDemo} className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-4 w-4" /> Demó alaphelyzetbe állítása
            </button>
            <a href={bookingPath} className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground">
              ← Vendégnézet
            </a>
            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Kijelentkezés
            </button>
            <button
              className="sm:hidden p-2 -mr-2 text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-forest animate-[slideInRight_0.3s_ease-out]">
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-4 p-2 text-cream"
            aria-label="Menü bezárása"
          >
            <X className="h-7 w-7" />
          </button>
          <nav className="h-full flex flex-col items-center justify-center gap-6 px-6" aria-label="Admin navigáció">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => { setTab(t.k); setMenuOpen(false); }}
                className={`font-heading text-2xl transition-colors ${
                  tab === t.k ? "text-cream underline underline-offset-8" : "text-cream/70 hover:text-cream"
                }`}
              >
                {t.l}
              </button>
            ))}
            <a
              href={bookingPath}
              className="mt-4 inline-flex items-center px-8 py-3 bg-cream text-forest font-medium"
            >
              ← Vendégnézet
            </a>
            <button onClick={() => { resetCurrentDemo(); setMenuOpen(false); }} className="inline-flex items-center gap-2 px-8 py-3 text-cream/80 hover:text-cream">
              <RotateCcw className="h-5 w-5" /> Demó alaphelyzetbe állítása
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-8 py-3 text-cream/80 hover:text-cream"
            >
              <LogOut className="h-5 w-5" /> Kijelentkezés
            </button>
          </nav>
        </div>
      )}

      <div className="admin-workspace max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <nav className="admin-tabs hidden sm:flex" aria-label="Admin navigáció">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`admin-tab px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
                tab === t.k
                  ? "admin-tab--active text-forest font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </nav>

        {tab === "dashboard" && (
          <AdminDashboard providers={providers} services={services} bookings={bookings} loading={loading} reload={loadAll} />
        )}
        {tab === "archive" && (
          <AdminArchive providers={providers} services={services} bookings={bookings} loading={loading} reload={loadAll} />
        )}
        {tab === "services" && <AdminServices providers={providers} reload={loadAll} />}
        {tab === "blocked" && <BlockedSlotsPanel providers={providers} />}
        {tab === "settings" && <AdminSettings providers={providers} reload={loadAll} />}
      </div>
    </div>
  );
}
