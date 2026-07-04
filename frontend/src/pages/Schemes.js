import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/auth";
import { Search, ExternalLink, Gift } from "lucide-react";

export default function Schemes() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const load = (query = "") => axios.get(`${API_URL}/schemes`, { params: { q: query } }).then(r => setItems(r.data.schemes));
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="schemes-page">
      <h1 className="text-3xl sm:text-4xl font-bold heading-font text-slate-900">Government Schemes</h1>
      <p className="text-slate-600 mt-1">Discover central and state schemes you may qualify for.</p>

      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="mt-6 flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2 max-w-2xl">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search schemes by name, category..." className="border-0 focus-visible:ring-0" data-testid="schemes-search" />
        <Button type="submit" data-testid="schemes-search-btn" className="bg-[var(--civic-primary)] text-white hover:bg-blue-800">Search</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8" data-testid="schemes-grid">
        {items.map(s => (
          <Card key={s.slug} className="civic-card border-slate-200 shadow-none" data-testid={`scheme-${s.slug}`}>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-md bg-orange-100 text-[var(--civic-saffron)] flex items-center justify-center mb-3">
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {s.categories.map(c => <Badge key={c} variant="outline" className="text-[10px] border-slate-300">{c}</Badge>)}
              </div>
              <h3 className="font-semibold text-slate-900">{s.name}</h3>
              <p className="text-xs text-slate-500">{s.ministry}</p>
              <p className="text-sm text-slate-700 mt-2 line-clamp-3">{s.description}</p>
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                <strong>Benefit:</strong> {s.benefit}
              </div>
              <p className="text-xs text-slate-600 mt-2"><strong>Eligibility:</strong> {s.eligibility}</p>
              <a href={s.apply_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--civic-primary)] hover:underline" data-testid={`apply-${s.slug}`}>
                Apply on official portal <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
