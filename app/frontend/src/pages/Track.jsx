import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/auth";
import { toast } from "sonner";
import { Search, Clock } from "lucide-react";

export default function Track() {
  const [params, setParams] = useSearchParams();
  const [ref, setRef] = useState(params.get("ref") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const search = async (r) => {
    if (!r) return;
    setLoading(true); setErr(""); setData(null);
    try {
      const res = await axios.get(`${API_URL}/track/${r}`);
      setData(res.data);
    } catch {
      setErr("No record found for this reference number.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const r = params.get("ref");
    if (r) { setRef(r); search(r); }
    // eslint-disable-next-line
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setParams({ ref });
    search(ref);
  };

  const item = data?.data;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" data-testid="track-page">
      <h1 className="text-3xl font-bold heading-font text-slate-900">Track Application</h1>
      <p className="text-slate-600 mt-1">Enter any reference number to see real-time status.</p>

      <form onSubmit={submit} className="mt-6 flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-white">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="APP-260210-123456" className="border-0 focus-visible:ring-0 font-mono" data-testid="track-input-main" />
        <Button type="submit" data-testid="track-btn-main" className="bg-[var(--civic-primary)] text-white hover:bg-blue-800">
          {loading ? "Searching..." : "Track"}
        </Button>
      </form>

      {err && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800" data-testid="track-error">{err}</div>}

      {item && (
        <Card className="mt-6 border-slate-200 shadow-none" data-testid="track-result">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Badge variant="outline" className="text-[10px] border-slate-300">{data.kind.toUpperCase()}</Badge>
                <h2 className="font-semibold text-slate-900 mt-1">{item.service_name || item.title || item.subject || "Record"}</h2>
                <p className="text-xs font-mono text-slate-500">{item.ref_no}</p>
              </div>
              <Badge className="bg-blue-100 text-[var(--civic-primary)] hover:bg-blue-100">{item.status}</Badge>
            </div>

            {item.timeline && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Timeline</h3>
                <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                  {item.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-[var(--civic-primary)]" />
                      <div className="text-sm font-medium text-slate-900">{t.status}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.at).toLocaleString()}</div>
                      {t.note && <p className="text-sm text-slate-600 mt-1">{t.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {data.kind === "payment" && (
              <div className="mt-4 text-sm grid grid-cols-2 gap-3">
                <div><span className="text-slate-500">Amount:</span> <span className="font-semibold">₹{item.amount}</span></div>
                <div><span className="text-slate-500">Txn ID:</span> <span className="font-mono">{item.txn_id}</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
