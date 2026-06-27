import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { toast } from "sonner";
import { Scroll } from "lucide-react";

export default function RTI() {
  const { token } = useAuth();
  const [form, setForm] = useState({ department: "", subject: "", description: "", period_from: "", period_to: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get(`${API_URL}/rti`, { headers: authHeaders(token) }).then(r => setItems(r.data.rti));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.department || !form.subject) { toast.error("Department and subject are required"); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API_URL}/rti`, form, { headers: authHeaders(token) });
      toast.success(`RTI filed · ${r.data.ref_no}`);
      setForm({ department: "", subject: "", description: "", period_from: "", period_to: "" });
      load();
    } catch { toast.error("Failed to file RTI"); }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10" data-testid="rti-page">
      <h1 className="text-3xl font-bold heading-font text-slate-900">Right to Information</h1>
      <p className="text-slate-600 mt-1">File an RTI request under the RTI Act, 2005. Standard fee: ₹10 (mock).</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 border-slate-200 shadow-none">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Public Authority / Department *</Label>
                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g., Municipal Corporation - PWD" data-testid="rti-dept" className="mt-1" />
              </div>
              <div>
                <Label>Subject *</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Road repair tenders for Ward 5" data-testid="rti-subject" className="mt-1" />
              </div>
              <div>
                <Label>Information Required</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} data-testid="rti-desc" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>From Date</Label>
                  <Input type="date" value={form.period_from} onChange={e => setForm({ ...form, period_from: e.target.value })} data-testid="rti-from" className="mt-1" />
                </div>
                <div>
                  <Label>To Date</Label>
                  <Input type="date" value={form.period_to} onChange={e => setForm({ ...form, period_to: e.target.value })} data-testid="rti-to" className="mt-1" />
                </div>
              </div>
              <Button type="submit" disabled={loading} data-testid="rti-submit"
                className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
                <Scroll className="w-4 h-4 mr-1" />
                {loading ? "Filing..." : "File RTI (₹10 mock fee)"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold heading-font text-slate-900 mb-3">My RTI Requests</h3>
          <div className="space-y-3" data-testid="rti-list">
            {items.length === 0 && <p className="text-sm text-slate-500">No RTI requests yet.</p>}
            {items.map(c => (
              <Card key={c.ref_no} className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <Badge variant="outline" className="text-[10px] border-slate-300">{c.department}</Badge>
                  <p className="text-sm font-medium text-slate-900 mt-2">{c.subject}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{c.ref_no}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
