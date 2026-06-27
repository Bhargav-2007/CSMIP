import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/auth";
import {
  Search, Home as HomeIcon, FileText, Droplet, Store, AlertTriangle, Calendar,
  Heart, Building2, Utensils, Briefcase, Baby, Gift, Scroll, ArrowRight,
  ChevronRight, MapPin, Shield
} from "lucide-react";

const ICON_MAP = {
  HomeIcon, FileTextIcon: FileText, DropletIcon: Droplet, StoreIcon: Store,
  AlertTriangleIcon: AlertTriangle, CalendarIcon: Calendar, HeartIcon: Heart,
  Building2Icon: Building2, UtensilsIcon: Utensils, BriefcaseIcon: Briefcase,
  BabyIcon: Baby, GiftIcon: Gift, ScrollIcon: Scroll, PipetteIcon: Droplet,
};

const Icon = ({ name, className }) => {
  const C = ICON_MAP[name] || FileText;
  return <C className={className} />;
};

export default function Home() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [trackRef, setTrackRef] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/services`).then(r => setServices(r.data.services)).catch(() => {});
    axios.get(`${API_URL}/alerts`).then(r => setAlerts(r.data.alerts)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) nav(`/services?q=${encodeURIComponent(search)}`);
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackRef.trim()) nav(`/track?ref=${encodeURIComponent(trackRef.trim())}`);
  };

  const popular = services.slice(0, 6);
  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#1E3A8A]" data-testid="hero-section">
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "url(https://images.pexels.com/photos/19883686/pexels-photo-19883686.jpeg)",
            backgroundSize: "cover", backgroundPosition: "center"
          }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white mb-5 border border-white/20" data-testid="hero-badge">
              <Shield className="w-3 h-3" /> <span>Official Citizen Services Portal — India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold heading-font text-white tracking-tight" data-testid="hero-title">
              {t("hero_title")}
            </h1>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl" data-testid="hero-subtitle">{t("hero_sub")}</p>

            <form onSubmit={handleSearch} className="mt-8 flex items-center gap-2 bg-white rounded-xl p-2 shadow-2xl max-w-2xl" data-testid="hero-search-form">
              <Search className="w-5 h-5 text-slate-400 ml-3" />
              <Input
                data-testid="hero-search-input"
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search_placeholder")}
                className="border-0 focus-visible:ring-0 text-base text-slate-900 placeholder:text-slate-400"
              />
              <Button type="submit" data-testid="hero-search-btn"
                className="bg-[var(--civic-saffron)] hover:bg-orange-700 text-white px-6">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ALERTS TICKER */}
      {alerts.length > 0 && (
        <div className="bg-orange-50 border-y border-orange-200 overflow-hidden" data-testid="alerts-ticker">
          <div className="max-w-7xl mx-auto flex items-center gap-4 py-2 px-4">
            <Badge className="bg-orange-600 text-white hover:bg-orange-600 shrink-0">New</Badge>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-12 marquee-track whitespace-nowrap text-sm text-slate-800">
                {[...alerts, ...alerts].map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" data-testid="quick-actions-section">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold heading-font tracking-tight text-slate-900">{t("quick_actions")}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { to: "/services/property-tax", icon: HomeIcon, label: t("qa_paytax"), tone: "blue", tid: "qa-paytax" },
            { to: "/complaints", icon: AlertTriangle, label: t("qa_complaint"), tone: "orange", tid: "qa-complaint" },
            { to: "/services/birth-certificate", icon: FileText, label: t("qa_apply_cert"), tone: "blue", tid: "qa-cert" },
            { to: "/track", icon: Search, label: t("qa_track"), tone: "green", tid: "qa-track" },
            { to: "/assistant", icon: MapPin, label: t("qa_assistant"), tone: "blue", tid: "qa-assistant" },
          ].map((it) => (
            <Link key={it.to} to={it.to} data-testid={it.tid}
              className="civic-card group border border-slate-200 rounded-lg p-5 bg-white hover:border-[var(--civic-primary)] flex flex-col items-start gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                it.tone === "blue" ? "bg-blue-100 text-[var(--civic-primary)]" :
                it.tone === "orange" ? "bg-orange-100 text-[var(--civic-saffron)]" :
                "bg-green-100 text-[var(--civic-green)]"}`}>
                <it.icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-slate-900 leading-snug">{it.label}</div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[var(--civic-primary)] mt-auto" />
            </Link>
          ))}
        </div>
      </section>

      {/* TRACK BOX + CATEGORIES */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-slate-200 shadow-none" data-testid="track-widget">
              <CardContent className="p-6">
                <h3 className="font-semibold heading-font text-lg text-slate-900">{t("track_title")}</h3>
                <p className="text-sm text-slate-600 mt-1">Enter your reference number from SMS or receipt.</p>
                <form onSubmit={handleTrack} className="mt-4 space-y-3">
                  <Input value={trackRef} onChange={(e) => setTrackRef(e.target.value)}
                    placeholder={t("track_placeholder")} data-testid="track-input" />
                  <Button type="submit" data-testid="track-submit"
                    className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
                    {t("track_btn")} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-semibold heading-font text-slate-900 mb-4">{t("categories")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((c) => (
                <Link key={c} to={`/services?category=${encodeURIComponent(c)}`}
                  data-testid={`cat-${c.toLowerCase()}`}
                  className="civic-card border border-slate-200 rounded-lg bg-white p-4 flex items-center justify-between hover:border-[var(--civic-primary)]">
                  <span className="text-sm font-medium text-slate-900">{c}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" data-testid="popular-section">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold heading-font text-slate-900">{t("popular")}</h2>
          <Link to="/services" className="text-sm font-medium text-[var(--civic-primary)] hover:underline" data-testid="view-all-services">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popular.map((s) => (
            <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`svc-${s.slug}`}
              className="civic-card border border-slate-200 rounded-lg p-5 bg-white hover:border-[var(--civic-primary)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 text-[var(--civic-primary)] flex items-center justify-center shrink-0">
                  <Icon name={s.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-300">{s.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{s.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SCHEMES TEASER */}
      <section className="bg-gradient-to-br from-blue-50 to-orange-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold heading-font text-slate-900">{t("schemes_title")}</h2>
            <p className="mt-3 text-slate-700 leading-relaxed">
              From PM-KISAN to Ayushman Bharat — find central and state schemes you qualify for, with eligibility checks and direct apply links.
            </p>
            <Button className="mt-5 bg-[var(--civic-primary)] hover:bg-blue-800 text-white" onClick={() => nav("/schemes")} data-testid="schemes-cta">
              Explore Schemes <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["PM-KISAN", "Ayushman Bharat", "PMAY-Urban", "Ujjwala"].map((n) => (
              <div key={n} className="bg-white rounded-lg border border-slate-200 p-4 text-sm font-medium text-slate-900">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[var(--civic-saffron)] flex items-center justify-center mb-2">
                  <Gift className="w-4 h-4" />
                </div>
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
