import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, CalendarDays, LayoutDashboard } from "lucide-react";
import CsitaryMark from "@/components/demo/CsitaryMark";
import { useDemo } from "@/demo/DemoContext";

export default function DemoNav({ adminAuthenticated = false }) {
  const { preset, bookingPath, adminPath, adminLoginPath } = useDemo();
  const adminTarget = adminAuthenticated ? adminPath : adminLoginPath;
  const linkClass = ({ isActive }) => `demo-nav__link ${isActive ? "demo-nav__link--active" : ""}`;

  return (
    <header className="demo-nav sticky top-0 z-40 border-b bg-card">
      <div className="demo-nav__inner mx-auto max-w-7xl gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="demo-back-link" aria-label="Vissza a vállalkozásokhoz"><ArrowLeft /><span>Vissza</span></Link>
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="brand-monogram"><img src={preset.branding.logoImage} alt={`${preset.businessName} logója`} /></span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-base text-foreground">{preset.businessName}</span>
              <span className="hidden text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:block">{preset.businessType}</span>
            </span>
          </Link>
        </div>
        <div className="demo-nav__actions flex items-center gap-4">
          <span className="hidden border-r border-border pr-4 lg:inline-flex"><CsitaryMark compact /></span>
          <nav className="demo-view-switch" aria-label="Demó nézetváltó">
            <NavLink to={bookingPath} className={linkClass}><CalendarDays /> <span>Időpontfoglalás</span></NavLink>
            <NavLink to={adminTarget} className={linkClass}><LayoutDashboard /> <span>Adminisztráció</span></NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
