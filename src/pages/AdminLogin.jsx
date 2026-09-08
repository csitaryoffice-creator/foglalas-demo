import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useDemo } from "@/demo/DemoContext";
import DemoBanner from "@/components/demo/DemoBanner";
import DemoNav from "@/components/demo/DemoNav";

export default function AdminLogin() {
  const { preset, adminPath, bookingPath } = useDemo();
  const navigate = useNavigate();

  function enterAdmin() {
    sessionStorage.setItem("borka_admin_session", "open-demo-session");
    sessionStorage.setItem("borka_admin_session_time", Date.now().toString());
    navigate(adminPath, { replace: true });
  }

  return (
    <div className="admin-login min-h-screen bg-background">
      <DemoNav />
      <DemoBanner />
      <div className="flex justify-center px-4 py-12">
        <div className="login-panel w-full max-w-sm border bg-card p-6 sm:p-8">
          <div className="mb-8">
            <p className="business-kicker">Admin demó</p>
            <h1 className="mt-2 font-heading text-2xl text-foreground">{preset.businessName}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">A teljes adminfelület szabadon kipróbálható. A belépéshez nincs szükség felhasználónévre vagy jelszóra.</p>
          </div>
          <button type="button" onClick={enterAdmin} className="primary-action flex w-full items-center justify-center gap-2 bg-forest px-6 py-3 text-ivory font-medium">
            Belépés <ArrowRight className="h-4 w-4" />
          </button>
          <div className="mt-6 text-center">
            <a href={bookingPath} className="text-sm text-muted-foreground hover:text-foreground">← Vissza a vendégnézethez</a>
          </div>
        </div>
      </div>
    </div>
  );
}
