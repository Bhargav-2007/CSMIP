import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/auth";
import { MOCK_SERVICES, MOCK_ALERTS } from "@/lib/mockData";
import {
  Search, Home as HomeIcon, FileText, Droplet, Store, AlertTriangle, Calendar,
  Heart, Building2, Utensils, Briefcase, Baby, Gift, Scroll, ArrowRight,
  ChevronRight, MapPin, Shield, Zap, Clock, Star, Users, CheckCircle
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

const statsData = [
  { label: "Services Available", value: "50+", icon: Zap, color: "blue" },
  { label: "Citizens Served", value: "2M+", icon: Users, color: "green" },
  { label: "Avg. Processing", value: "3 days", icon: Clock, color: "orange" },
  { label: "Satisfaction Rate", value: "94%", icon: Star, color: "blue" },
];

export default function Home() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [services, setServices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [trackRef, setTrackRef] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/services`)
      .then(r => setServices(r.data.data || r.data.services || []))
      .catch(() => setServices(MOCK_SERVICES));
    axios.get(`${API_URL}/alerts`)
      .then(r => setAlerts(r.data.alerts || []))
      .catch(() => setAlerts(MOCK_ALERTS));
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
      
      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0F2167 0%, #1E3A8A 40%, #1d4ed8 100%)'}} data-testid="hero-section">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(https://images.pexels.com/photos/19883686/pexels-photo-19883686.jpeg)",
            backgroundSize: "cover", backgroundPosition: "center"
          }} />
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white mb-6" style={{background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.2)'}} data-testid="hero-badge">
              <Shield className="w-3 h-3 text-green-300" />
              <span>Official Citizen Services Portal — India</span>
              <CheckCircle className="w-3 h-3 text-green-300" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold heading-font text-white tracking-tight leading-tight" data-testid="hero-title">
              {t("hero_title")}
            </h1>
            <p className="mt-5 text-lg text-blue-200 max-w-xl leading-relaxed" data-testid="hero-subtitle">
              {t("hero_sub")}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 flex items-center bg-white rounded-2xl p-1.5 shadow-2xl shadow-black/20 max-w-xl" data-testid="hero-search-form">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <Input
                  data-testid="hero-search-input"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="border-0 focus-visible:ring-0 text-sm text-slate-900 placeholder:text-slate-400 px-0 h-9"
                />
              </div>
              <Button type="submit" data-testid="hero-search-btn"
                className="h-9 px-5 bg-[var(--civic-saffron)] hover:bg-orange-700 text-white font-semibold rounded-xl shadow-none">
                Search
              </Button>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["Property Tax", "Birth Certificate", "Water Bill", "Trade License"].map((s) => (
                <button key={s} onClick={() => nav(`/services?q=${encodeURIComponent(s)}`)}
                  className="text-xs text-blue-200 bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((s) => (
              <div key={s.label} className="flex items-center gap-3 text-white">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  s.color === "blue" ? "bg-blue-400/20" :
                  s.color === "green" ? "bg-green-400/20" : "bg-orange-400/20"
                }`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-bold heading-font">{s.value}</div>
                  <div className="text-xs text-blue-300">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          ALERTS TICKER
      ══════════════════════════════════ */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border-y border-amber-200 overflow-hidden" data-testid="alerts-ticker">
          <div className="max-w-7xl mx-auto flex items-center gap-4 py-2.5 px-4">
            <Badge className="bg-[var(--civic-saffron)] text-white hover:bg-[var(--civic-saffron)] shrink-0 text-xs px-2.5">
              ● LIVE
            </Badge>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-16 marquee-track whitespace-nowrap text-sm text-amber-900 font-medium">
                {[...alerts, ...alerts].map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20" data-testid="quick-actions-section">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[var(--civic-saffron)] uppercase tracking-wider mb-1">Start Here</p>
            <h2 className="text-2xl sm:text-3xl font-bold heading-font tracking-tight text-slate-900">{t("quick_actions")}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { to: "/services/property-tax", icon: HomeIcon, label: t("qa_paytax"), tone: "blue", tid: "qa-paytax" },
            { to: "/complaints", icon: AlertTriangle, label: t("qa_complaint"), tone: "orange", tid: "qa-complaint" },
            { to: "/services/birth-certificate", icon: FileText, label: t("qa_apply_cert"), tone: "blue", tid: "qa-cert" },
            { to: "/track", icon: Search, label: t("qa_track"), tone: "green", tid: "qa-track" },
            { to: "/assistant", icon: MapPin, label: t("qa_assistant"), tone: "blue", tid: "qa-assistant" },
          ].map((it) => (
            <Link key={it.to} to={it.to} data-testid={it.tid}
              className="civic-card group border border-slate-200 rounded-2xl p-5 bg-white hover:border-blue-200 hover:shadow-blue-50 flex flex-col items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                it.tone === "blue" ? "bg-blue-100 text-[var(--civic-primary)]" :
                it.tone === "orange" ? "bg-orange-100 text-[var(--civic-saffron)]" :
                "bg-green-100 text-[var(--civic-green)]"}`}>
                <it.icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 leading-snug">{it.label}</div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[var(--civic-primary)] mt-auto transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          TRACK + CATEGORIES
      ══════════════════════════════════ */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Track Widget */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 shadow-none overflow-hidden" data-testid="track-widget">
              <div className="h-1.5 bg-gradient-to-r from-[var(--civic-primary)] to-[var(--civic-primary-light)]" />
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[var(--civic-primary)] flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="font-bold heading-font text-lg text-slate-900">{t("track_title")}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Enter your reference number from SMS or receipt.</p>
                <form onSubmit={handleTrack} className="mt-5 space-y-3">
                  <Input value={trackRef} onChange={(e) => setTrackRef(e.target.value)}
                    placeholder={t("track_placeholder")} data-testid="track-input"
                    className="border-slate-200 focus-visible:ring-[var(--civic-primary)] focus-visible:border-[var(--civic-primary)]" />
                  <Button type="submit" data-testid="track-submit"
                    className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white font-semibold">
                    {t("track_btn")} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <div className="mb-2">
              <p className="text-xs font-semibold text-[var(--civic-saffron)] uppercase tracking-wider mb-1">Browse by topic</p>
              <h2 className="text-2xl sm:text-3xl font-bold heading-font text-slate-900">{t("categories")}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {categories.map((c) => (
                <Link key={c} to={`/services?category=${encodeURIComponent(c)}`}
                  data-testid={`cat-${c.toLowerCase()}`}
                  className="civic-card border border-slate-200 rounded-2xl bg-white p-4 flex items-center justify-between hover:border-blue-200 group">
                  <span className="text-sm font-semibold text-slate-800">{c}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[var(--civic-primary)] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          POPULAR SERVICES
      ══════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20" data-testid="popular-section">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[var(--civic-saffron)] uppercase tracking-wider mb-1">Most Used</p>
            <h2 className="text-2xl sm:text-3xl font-bold heading-font text-slate-900">{t("popular")}</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-[var(--civic-primary)] hover:underline flex items-center gap-1" data-testid="view-all-services">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popular.map((s) => (
            <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`svc-${s.slug}`}
              className="civic-card group border border-slate-200 rounded-2xl p-5 bg-white hover:border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[var(--civic-primary)] flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Icon name={s.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 px-2 py-0 mb-2">{s.category}</Badge>
                  <h3 className="font-bold text-slate-900 leading-snug">{s.name}</h3>
                  <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{s.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-[var(--civic-primary)]">Apply Now</span>
                <ArrowRight className="w-3 h-3 text-[var(--civic-primary)]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          SCHEMES TEASER
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0F2167 0%, #1E3A8A 40%, #1d4ed8 100%)'}}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Government Benefits</p>
            <h2 className="text-3xl sm:text-4xl font-bold heading-font text-white">{t("schemes_title")}</h2>
            <p className="mt-4 text-blue-200 leading-relaxed">
              From PM-KISAN to Ayushman Bharat — find central and state schemes you qualify for, with eligibility checks and direct apply links.
            </p>
            <Button className="mt-7 bg-white text-[var(--civic-primary)] hover:bg-blue-50 font-bold px-6 shadow-none" onClick={() => nav("/schemes")} data-testid="schemes-cta">
              Explore All Schemes <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "PM-KISAN", desc: "Farmer income support" },
              { name: "Ayushman Bharat", desc: "Health coverage up to ₹5L" },
              { name: "PMAY-Urban", desc: "Affordable housing scheme" },
              { name: "Ujjwala Yojana", desc: "Free LPG connections" },
            ].map((s) => (
              <div key={s.name} className="rounded-2xl p-4 hover:bg-white/20 transition-colors cursor-pointer" style={{background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.2)'}}>
                <div className="w-8 h-8 rounded-xl bg-orange-400/20 text-orange-300 flex items-center justify-center mb-3">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white">{s.name}</div>
                <div className="text-xs text-blue-300 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
