import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, FileText, Clock, IndianRupee, ArrowRight } from "lucide-react";
import { API_URL } from "@/auth";
import { MOCK_SERVICES } from "@/lib/mockData";

const CATEGORIES = ["All", "Vital Records", "Property", "Utilities", "Business", "Identity"];

const CATEGORY_COLORS = {
  "Vital Records": "bg-purple-100 text-purple-700",
  "Property": "bg-blue-100 text-blue-700",
  "Utilities": "bg-cyan-100 text-cyan-700",
  "Business": "bg-amber-100 text-amber-700",
  "Identity": "bg-green-100 text-green-700",
};

export default function Services() {
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState(params.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = params.get("q") || "";
    const cat = params.get("category") || "";
    setActiveCategory(cat || "All");
    axios.get(`${API_URL}/services`, { params: { search: q, category: cat } })
      .then(r => {
        const list = r.data.data || r.data.services || [];
        const filtered = list.filter(s =>
          (!q || s.name.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || s.category === cat)
        );
        setServices(filtered.length > 0 ? filtered : list);
      })
      .catch(() => {
        const q2 = params.get("q") || "";
        const cat2 = params.get("category") || "";
        const filtered = MOCK_SERVICES.filter(s =>
          (!q2 || s.name.toLowerCase().includes(q2.toLowerCase())) &&
          (!cat2 || s.category === cat2)
        );
        setServices(filtered.length > 0 ? filtered : MOCK_SERVICES);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const onSearch = (e) => {
    e.preventDefault();
    const np = new URLSearchParams();
    if (search) np.set("q", search);
    if (activeCategory !== "All") np.set("category", activeCategory);
    setParams(np);
  };

  const onCategory = (cat) => {
    setActiveCategory(cat);
    const np = new URLSearchParams();
    const q = params.get("q") || "";
    if (q) np.set("q", q);
    if (cat !== "All") np.set("category", cat);
    setParams(np);
  };

  const displayedCategory = params.get("category") || "";

  return (
    <div data-testid="services-page">
      {/* Page Header */}
      <div className="py-12" style={{background: 'linear-gradient(135deg, #0F2167 0%, #1E3A8A 40%, #1d4ed8 100%)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Government Portal</p>
          <h1 className="text-3xl sm:text-4xl font-bold heading-font text-white">All Services</h1>
          <p className="text-blue-200 mt-2">Browse all municipal & government services available online.</p>

          {/* Search */}
          <form onSubmit={onSearch} className="mt-6 flex items-center bg-white rounded-2xl p-1.5 shadow-xl shadow-black/20 max-w-2xl">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services... e.g. Birth Certificate, Property Tax"
                className="border-0 focus-visible:ring-0 text-sm text-slate-900 placeholder:text-slate-400 px-0 h-9"
                data-testid="services-search-input"
              />
            </div>
            <button type="submit" data-testid="services-search-btn"
              className="h-9 px-5 bg-[var(--civic-saffron)] hover:bg-orange-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => onCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                (cat === "All" && activeCategory === "All") || activeCategory === cat
                  ? "bg-[var(--civic-primary)] text-white shadow-sm shadow-blue-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {cat}
            </button>
          ))}
          {displayedCategory && (
            <button onClick={() => onCategory("All")}
              className="px-3 py-1.5 rounded-full text-sm text-red-600 bg-red-50 hover:bg-red-100 font-medium">
              ✕ Clear filter
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-5">
          {loading ? "Loading…" : `${services.length} service${services.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl p-5 animate-pulse">
                <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-full bg-slate-200 rounded mb-1" />
                <div className="h-3 w-3/4 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Services Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="services-grid">
            {services.map((s) => (
              <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`svc-card-${s.slug}`}
                className="civic-card group border border-slate-200 rounded-2xl bg-white hover:border-blue-200 hover:shadow-blue-50 overflow-hidden flex flex-col">
                {/* Colour accent bar */}
                <div className="h-1 bg-gradient-to-r from-[var(--civic-primary)] to-[var(--civic-primary-light)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`status-pill text-[10px] font-semibold ${CATEGORY_COLORS[s.category] || "bg-slate-100 text-slate-600"}`}>
                      {s.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {s.sla_days}d
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-[var(--civic-primary)] transition-colors">{s.name}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed flex-1">{s.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {s.fee === 0 ? <span className="text-green-600">Free</span> : s.fee}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[var(--civic-primary)]">
                      Apply Now <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {services.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400" data-testid="no-services">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600">No services found</p>
                <p className="text-sm mt-1">Try a different search term or category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
