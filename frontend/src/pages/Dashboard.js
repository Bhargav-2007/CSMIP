import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { FileText, AlertTriangle, Scroll, CreditCard, ShieldUser } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, token, refresh } = useAuth();
  const [stats, setStats] = useState({});
  const [apps, setApps] = useState([]);
  const [cmps, setCmps] = useState([]);
  const [rtis, setRtis] = useState([]);
  const [pays, setPays] = useState([]);

  useEffect(() => {
    const h = { headers: authHeaders(token) };
    axios.get(`${API_URL}/dashboard/stats`, h).then(r => setStats(r.data));
    axios.get(`${API_URL}/applications`, h).then(r => setApps(r.data.applications));
    axios.get(`${API_URL}/complaints`, h).then(r => setCmps(r.data.complaints));
    axios.get(`${API_URL}/rti`, h).then(r => setRtis(r.data.rti));
    axios.get(`${API_URL}/payments`, h).then(r => setPays(r.data.payments));
  }, [token]);

  const becomeAdmin = async () => {
    await axios.post(`${API_URL}/admin/promote-self`, {}, { headers: authHeaders(token) });
    toast.success("You are now an admin. Refreshing...");
    await refresh();
  };

  const cards = [
    { label: "Applications", value: stats.applications || 0, icon: FileText, tone: "blue" },
    { label: "Complaints", value: stats.complaints || 0, icon: AlertTriangle, tone: "orange" },
    { label: "RTI Requests", value: stats.rti || 0, icon: Scroll, tone: "blue" },
    { label: "Payments", value: stats.payments || 0, icon: CreditCard, tone: "green" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold heading-font text-slate-900">Namaste, {user?.name}</h1>
          <p className="text-slate-600 mt-1">+91 {user?.phone}</p>
        </div>
        {user?.role !== "admin" && (
          <Button variant="outline" onClick={becomeAdmin} data-testid="become-admin-btn">
            <ShieldUser className="w-4 h-4 mr-1" /> Switch to Officer Mode (Demo)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {cards.map(c => (
          <Card key={c.label} className="border-slate-200 shadow-none" data-testid={`stat-${c.label.toLowerCase().replace(/ /g, "-")}`}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-md mb-3 flex items-center justify-center ${
                c.tone === "blue" ? "bg-blue-100 text-[var(--civic-primary)]" :
                c.tone === "orange" ? "bg-orange-100 text-[var(--civic-saffron)]" : "bg-green-100 text-[var(--civic-green)]"}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="apps" className="mt-8">
        <TabsList data-testid="dash-tabs">
          <TabsTrigger value="apps" data-testid="tab-apps">Applications</TabsTrigger>
          <TabsTrigger value="cmps" data-testid="tab-cmps">Complaints</TabsTrigger>
          <TabsTrigger value="rti" data-testid="tab-rti">RTI</TabsTrigger>
          <TabsTrigger value="pay" data-testid="tab-pay">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="apps">
          <List items={apps} renderTitle={a => a.service_name} statusColor={statusColor} />
        </TabsContent>
        <TabsContent value="cmps">
          <List items={cmps} renderTitle={c => c.title} statusColor={statusColor} />
        </TabsContent>
        <TabsContent value="rti">
          <List items={rtis} renderTitle={r => r.subject} statusColor={statusColor} />
        </TabsContent>
        <TabsContent value="pay">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {pays.length === 0 && <p className="text-sm text-slate-500 col-span-full">No payments yet.</p>}
            {pays.map(p => (
              <Card key={p.ref_no} className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <span className="text-xs font-mono text-slate-500">{p.ref_no}</span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{p.status}</Badge>
                  </div>
                  <div className="mt-2 font-semibold text-slate-900">₹{p.amount} · {p.service_slug}</div>
                  <div className="text-xs text-slate-500">Bill: {p.bill_number} · {p.method}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function statusColor(s) {
  if (["resolved", "approved", "completed", "success"].includes(s)) return "bg-green-100 text-green-700 hover:bg-green-100";
  if (["rejected", "denied"].includes(s)) return "bg-red-100 text-red-700 hover:bg-red-100";
  return "bg-blue-100 text-[var(--civic-primary)] hover:bg-blue-100";
}

function List({ items, renderTitle, statusColor }) {
  if (!items.length) return <p className="text-sm text-slate-500 mt-4">Nothing here yet.</p>;
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(it => (
        <Link to={`/track?ref=${it.ref_no}`} key={it.ref_no} data-testid={`row-${it.ref_no}`}>
          <Card className="civic-card border-slate-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-slate-500">{it.ref_no}</span>
                <Badge className={statusColor(it.status)}>{it.status}</Badge>
              </div>
              <div className="mt-2 font-medium text-slate-900">{renderTitle(it)}</div>
              <div className="text-xs text-slate-500 mt-1">{new Date(it.created_at).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
