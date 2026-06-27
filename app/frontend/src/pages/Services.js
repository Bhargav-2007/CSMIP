import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronRight, FileText } from "lucide-react";
import { API_URL } from "@/auth";

export default function Services() {
  const [params, setParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState(params.get("q") || "");
  const category = params.get("category") || "";

  useEffect(() => {
    const q = params.get("q") || "";
    const cat = params.get("category") || "";
    axios.get(`${API_URL}/services`, { params: { q, category: cat } })
      .then(r => setServices(r.data.services)).catch(() => {});
  }, [params]);

  const onSearch = (e) => {
    e.preventDefault();
    const np = new URLSearchParams(params);
    if (search) np.set("q", search); else np.delete("q");
    setParams(np);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14" data-testid="services-page">
      <h1 className="text-3xl sm:text-4xl font-bold heading-font text-slate-900">All Services</h1>
      <p className="text-slate-600 mt-2">Browse all government & municipal services.</p>

      <form onSubmit={onSearch} className="mt-6 flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 max-w-2xl">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..." className="border-0 focus-visible:ring-0"
          data-testid="services-search-input" />
        <button type="submit" data-testid="services-search-btn"
          className="bg-[var(--civic-primary)] text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-800">
          Search
        </button>
      </form>

      {category && (
        <div className="mt-4">
          <Badge className="bg-blue-100 text-[var(--civic-primary)] hover:bg-blue-100">Category: {category}</Badge>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="services-grid">
        {services.map((s) => (
          <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`svc-card-${s.slug}`}>
            <Card className="civic-card border-slate-200 shadow-none h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-600">{s.category}</Badge>
                  <span className="text-xs text-slate-500">SLA: {s.sla_days || 0}d</span>
                </div>
                <h3 className="font-semibold text-slate-900">{s.name}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{s.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{s.department}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {services.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500" data-testid="no-services">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No services match your search.
          </div>
        )}
      </div>
    </div>
  );
}
