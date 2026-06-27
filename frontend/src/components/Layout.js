import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Menu, Globe, User as UserIcon, LogOut, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const navItems = [
    { to: "/", label: t("nav_home") },
    { to: "/services", label: t("nav_services") },
    { to: "/schemes", label: t("nav_schemes") },
    { to: "/complaints", label: t("nav_complaints") },
    { to: "/rti", label: t("nav_rti") },
    { to: "/track", label: t("nav_track") },
    { to: "/assistant", label: t("nav_assistant") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200" data-testid="site-header">
      <div className="tricolour-stripe" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
          <div className="w-9 h-9 rounded-full bg-[var(--civic-primary)] text-white flex items-center justify-center font-bold heading-font">CS</div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold heading-font text-slate-900 leading-tight">Citizen Services</div>
            <div className="text-[11px] text-slate-500 leading-tight">Municipal Intelligence Platform</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === "/"}
              data-testid={`nav-${it.to.replace(/\//g, "") || "home"}`}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "text-[var(--civic-primary)] bg-blue-50" : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}>
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="lang-switcher" className="gap-1">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{lang === "en" ? "EN" : "हि"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLang("en")} data-testid="lang-en">English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("hi")} data-testid="lang-hi">हिन्दी (Hindi)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="user-menu" className="gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => nav("/dashboard")} data-testid="menu-dashboard">{t("nav_dashboard")}</DropdownMenuItem>
                {user.role === "admin" && <DropdownMenuItem onClick={() => nav("/admin")} data-testid="menu-admin">{t("nav_admin")}</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => { logout(); nav("/"); }} data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" /> {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => nav("/login")} size="sm" data-testid="login-btn"
              className="bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
              {t("login")}
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-btn">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-1 mt-6">
                {navItems.map((it) => (
                  <NavLink key={it.to} to={it.to} end={it.to === "/"}
                    data-testid={`m-nav-${it.to.replace(/\//g, "") || "home"}`}
                    className={({ isActive }) =>
                      `px-3 py-2 text-sm font-medium rounded-md ${
                        isActive ? "text-[var(--civic-primary)] bg-blue-50" : "text-slate-700 hover:bg-slate-50"
                      }`}>
                    {it.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-16" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-bold heading-font text-slate-900">Citizen Services</div>
          <p className="text-sm text-slate-600 mt-2">{t("footer_tag")}</p>
          <p className="text-xs text-slate-500 mt-2">{t("powered_by")}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Services</div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li><Link to="/services/birth-certificate" className="hover:underline">Birth Certificate</Link></li>
            <li><Link to="/services/property-tax" className="hover:underline">Property Tax</Link></li>
            <li><Link to="/services/water-bill" className="hover:underline">Water Bill</Link></li>
            <li><Link to="/services/trade-license" className="hover:underline">Trade License</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Citizen</div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li><Link to="/complaints" className="hover:underline">File a Complaint</Link></li>
            <li><Link to="/rti" className="hover:underline">RTI</Link></li>
            <li><Link to="/schemes" className="hover:underline">Schemes</Link></li>
            <li><Link to="/track" className="hover:underline">Track Application</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Helpline</div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Civic Helpline: <span className="font-semibold">1800-XXX-XXXX</span></li>
            <li>Emergency: <span className="font-semibold">112</span></li>
            <li>Email: support@csmip.gov.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Citizen Services & Municipal Intelligence Platform. All rights reserved.
      </div>
    </footer>
  );
};

const AssistantFab = () => {
  const nav = useNavigate();
  return (
    <button onClick={() => nav("/assistant")} data-testid="assistant-fab"
      className="fixed bottom-6 right-6 z-40 bg-[var(--civic-primary)] hover:bg-blue-800 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
      <MessageCircle className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-medium pr-1">Ask Mitra</span>
    </button>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AssistantFab />
    </div>
  );
}
