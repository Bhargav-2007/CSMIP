import { Link, NavLink, useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Menu, Globe, User as UserIcon, LogOut, MessageCircle, LayoutDashboard, Settings } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const navItems = [
    { to: "/", label: t("nav_home") || "Home" },
    { to: "/services", label: t("nav_services") || "Services" },
    { to: "/schemes", label: t("nav_schemes") || "Schemes" },
    { to: "/complaints", label: t("nav_complaints") || "Complaints" },
    { to: "/rti", label: t("nav_rti") || "RTI" },
    { to: "/track", label: t("nav_track") || "Track" },
    { to: "/assistant", label: t("nav_assistant") || "AI Assistant" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm" data-testid="site-header">
      <div className="tricolour-stripe" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0" data-testid="brand-link">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center font-bold heading-font text-sm shadow-md shadow-blue-200">
            CS
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold heading-font text-slate-900 leading-tight">Citizen Services</div>
            <div className="text-[10px] text-slate-500 leading-tight font-medium tracking-wide uppercase">Municipal Intelligence Platform</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {navItems.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === "/"}
              data-testid={`nav-${it.to.replace(/\//g, "") || "home"}`}
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                  isActive
                    ? "text-[var(--civic-primary)] bg-blue-50 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}>
              {it.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="lang-switcher" className="gap-1.5 text-slate-600 hover:text-slate-900 h-8 px-2.5">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{lang === "en" ? "EN" : "हि"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setLang("en")} data-testid="lang-en" className="gap-2 cursor-pointer">
                <span>🇬🇧</span> English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("hi")} data-testid="lang-hi" className="gap-2 cursor-pointer">
                <span>🇮🇳</span> हिन्दी
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="user-menu"
                  className="gap-2 h-9 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-700">{user.name?.split(" ")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">+91 {user.phone}</p>
                </div>
                <DropdownMenuItem onClick={() => nav("/dashboard")} data-testid="menu-dashboard" className="gap-2 cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 text-slate-500" /> {t("nav_dashboard")}
                </DropdownMenuItem>
                {['admin', 'officer'].includes(String(user.role || '').toLowerCase()) && (
                  <DropdownMenuItem onClick={() => nav("/admin")} data-testid="menu-admin" className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4 text-slate-500" /> {t("nav_admin")}
                  </DropdownMenuItem>
                )}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <DropdownMenuItem onClick={() => { logout(); nav("/"); }} data-testid="menu-logout"
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4" /> {t("logout")}
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => nav("/login")} size="sm" data-testid="login-btn"
              className="h-9 px-4 bg-[var(--civic-primary)] hover:bg-blue-800 text-white font-semibold shadow-sm shadow-blue-200 transition-all hover:shadow-md">
              {t("login")}
            </Button>
          )}

          {/* Mobile Hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" data-testid="mobile-menu-btn">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white flex items-center justify-center font-bold text-xs">CS</div>
                  <div>
                    <div className="text-sm font-bold heading-font text-slate-900">Citizen Services</div>
                    <div className="text-[10px] text-slate-500">CSMIP Portal</div>
                  </div>
                </div>
              </div>
              <nav className="flex flex-col gap-1 p-3 mt-2">
                {navItems.map((it) => (
                  <NavLink key={it.to} to={it.to} end={it.to === "/"}
                    data-testid={`m-nav-${it.to.replace(/\//g, "") || "home"}`}
                    className={({ isActive }) =>
                      `px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive ? "text-[var(--civic-primary)] bg-blue-50 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}>
                    {it.label}
                  </NavLink>
                ))}
              </nav>
              {user && (
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-100">
                  <button onClick={() => { logout(); nav("/"); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
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
    <footer className="border-t border-slate-200 bg-slate-900 mt-20" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Col */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-xs">CS</div>
            <span className="font-bold heading-font text-white text-sm">Citizen Services</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{t("footer_tag")}</p>
          <p className="text-xs text-slate-500 mt-3">{t("powered_by")}</p>
          <div className="flex gap-1 mt-4">
            <div className="h-1 w-8 rounded-full bg-orange-500"></div>
            <div className="h-1 w-8 rounded-full bg-white"></div>
            <div className="h-1 w-8 rounded-full bg-green-500"></div>
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Services</div>
          <ul className="space-y-2.5">
            {[
              { to: "/services/birth-certificate", label: "Birth Certificate" },
              { to: "/services/property-tax", label: "Property Tax" },
              { to: "/services/water-bill", label: "Water Bill" },
              { to: "/services/trade-license", label: "Trade License" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Citizen */}
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Citizen</div>
          <ul className="space-y-2.5">
            {[
              { to: "/complaints", label: "File a Complaint" },
              { to: "/rti", label: "RTI Request" },
              { to: "/schemes", label: "Government Schemes" },
              { to: "/track", label: "Track Application" },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Helpline */}
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">Helpline</div>
          <ul className="space-y-3 text-sm text-slate-400">
            <li>
              <span className="block text-xs text-slate-500 mb-0.5">Civic Helpline</span>
              <span className="font-semibold text-white">1800-XXX-XXXX</span>
            </li>
            <li>
              <span className="block text-xs text-slate-500 mb-0.5">Emergency</span>
              <span className="font-bold text-red-400 text-lg">112</span>
            </li>
            <li>
              <span className="block text-xs text-slate-500 mb-0.5">Email</span>
              <a href="mailto:support@csmip.gov.in" className="hover:text-white transition-colors">support@csmip.gov.in</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Citizen Services & Municipal Intelligence Platform. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">Government of India Initiative</p>
        </div>
      </div>
    </footer>
  );
};

const AssistantFab = () => {
  const nav = useNavigate();
  return (
    <button onClick={() => nav("/assistant")} data-testid="assistant-fab"
      className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] hover:from-blue-700 hover:to-blue-500 text-white rounded-2xl px-5 py-3 shadow-xl shadow-blue-900/30 flex items-center gap-2.5 transition-all duration-200 hover:scale-105 hover:shadow-2xl">
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline text-sm font-semibold">Ask Mitra</span>
    </button>
  );
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <AssistantFab />
    </div>
  );
}
