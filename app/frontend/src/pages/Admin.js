import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { toast } from "sonner";
import { Download, Users, FileText, AlertTriangle, IndianRupee, Scroll } from "lucide-react";

export default function Admin() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({});
  const [apps, setApps] = useState([]);
  const [cmps, setCmps] = useState([]);

  const h = { headers: authHeaders(token) };

  useEffect(() => {
    if (user?.role !== "admin") return;
    axios.get(`${API_URL}/admin/stats`, h).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API_URL}/admin/applications`, h).then(r => setApps(r.data.applications)).catch(() => {});
    axios.get(`${API_URL}/admin/complaints`, h).then(r => setCmps(r.data.complaints)).catch(() => {});
    // eslint-disable-next-line
  }, [user, token]);

  if (user?.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto p-10 text-center" data-testid="admin-denied">
        <h1 className="text-2xl font-bold heading-font text-slate-900">Admin / Officer Access Required</h1>
        <p className="text-slate-600 mt-2">Go to Dashboard and click &quot;Switch to Officer Mode (Demo)&quot; to access this area.</p>
      </div>
    );
  }

  const updateApp = async (ref_no, status) => {
    try {
      await axios.put(`${API_URL}/admin/applications/${ref_no}`, { status, remarks: `Marked ${status}` }, h);
      const r = await axios.get(`${API_URL}/admin/applications`, h);
      setApps(r.data.applications);
      toast.success(`Updated ${ref_no} → ${status}`);
    } catch { toast.error("Update failed"); }
  };

  const updateCmp = async (ref_no, status) => {
    try {
      await axios.put(`${API_URL}/admin/complaints/${ref_no}`, { status, remarks: `Marked ${status}` }, h);
      const r = await axios.get(`${API_URL}/admin/complaints`, h);
      setCmps(r.data.complaints);
      toast.success(`Updated ${ref_no} → ${status}`);
    } catch { toast.error("Update failed"); }
  };

  const exportCsv = async (kind) => {
    try {
      const res = await fetch(`${API_URL}/admin/export/${kind}`, { headers: authHeaders(token) });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${kind}.csv`; a.click();
      toast.success(`Downloaded ${kind}.csv`);
    } catch { toast.error("Export failed"); }
  };

  const cards = [
    { label: "Users", value: stats.total_users || 0, icon: Users },
    { label: "Applications", value: stats.total_applications || 0, icon: FileText },
    { label: "Complaints (Open)", value: `${stats.open_complaints || 0}/${stats.total_complaints || 0}`, icon: AlertTriangle },
    { label: "RTI", value: stats.total_rti || 0, icon: Scroll },
    { label: "Revenue (₹)", value: stats.revenue || 0, icon: IndianRupee },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="admin-page">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Badge className="bg-blue-50 text-[var(--civic-primary)] hover:bg-blue-50">Officer Console</Badge>
          <h1 className="text-3xl font-bold heading-font text-slate-900 mt-2">Municipal Admin Dashboard</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["applications", "complaints", "rti", "payments", "users"].map(k => (
            <Button key={k} variant="outline" size="sm" onClick={() => exportCsv(k)} data-testid={`export-${k}`}>
              <Download className="w-4 h-4 mr-1" /> {k}.csv
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        {cards.map(c => (
          <Card key={c.label} className="border-slate-200 shadow-none">
            <CardContent className="p-4">
              <c.icon className="w-5 h-5 text-[var(--civic-primary)] mb-2" />
              <div className="text-xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="apps" className="mt-8">
        <TabsList>
          <TabsTrigger value="apps" data-testid="adm-tab-apps">Applications ({apps.length})</TabsTrigger>
          <TabsTrigger value="cmps" data-testid="adm-tab-cmps">Complaints ({cmps.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="apps">
          <div className="mt-4 space-y-2">
            {apps.length === 0 && <p className="text-sm text-slate-500">No applications.</p>}
            {apps.map(a => (
              <Card key={a.ref_no} className="border-slate-200 shadow-none">
                <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">{a.ref_no}</div>
                    <div className="font-medium text-slate-900">{a.service_name}</div>
                    <div className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => updateApp(a.ref_no, v)}>
                    <SelectTrigger data-testid={`adm-app-status-${a.ref_no}`} className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["submitted", "under-review", "approved", "rejected", "completed"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="cmps">
          <div className="mt-4 space-y-2">
            {cmps.length === 0 && <p className="text-sm text-slate-500">No complaints.</p>}
            {cmps.map(c => (
              <Card key={c.ref_no} className="border-slate-200 shadow-none">
                <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="text-xs font-mono text-slate-500">{c.ref_no}</div>
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.category} · {c.location}</div>
                  </div>
                  <Select value={c.status} onValueChange={(v) => updateCmp(c.ref_no, v)}>
                    <SelectTrigger data-testid={`adm-cmp-status-${c.ref_no}`} className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["open", "in-progress", "resolved", "closed", "rejected"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
