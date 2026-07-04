import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const CATS = ["Garbage / Waste", "Pothole / Road", "Streetlight", "Water Leakage", "Drainage / Sewer", "Stray Animals", "Encroachment", "Other"];

export default function Complaints() {
  const { token } = useAuth();
  const [form, setForm] = useState({ category: "", title: "", description: "", location: "", ward: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => axios.get(`${API_URL}/complaints`, { headers: authHeaders(token) }).then(r => setItems(r.data.data || [])).catch(() => setItems([]));
  useEffect(() => { load(); }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.title) { toast.error("Category and title are required"); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API_URL}/complaints`, form, { headers: authHeaders(token) });
      toast.success(`Complaint filed · ${r.data.ref_no}`);
      setForm({ category: "", title: "", description: "", location: "", ward: "" });
      load();
    } catch { toast.error("Failed to file complaint"); }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10" data-testid="complaints-page">
      <h1 className="text-3xl font-bold heading-font text-slate-900">File a Civic Complaint</h1>
      <p className="text-slate-600 mt-1">Report civic issues — your ward officer will respond within 7 days.</p>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 border-slate-200 shadow-none">
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="cmp-category" className="mt-1"><SelectValue placeholder="Select issue type" /></SelectTrigger>
                  <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Garbage not collected for 4 days" data-testid="cmp-title" className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} data-testid="cmp-desc" className="mt-1" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Location *</Label>
                  <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Street, area, landmark" data-testid="cmp-loc" className="mt-1" />
                </div>
                <div>
                  <Label>Ward / Zone</Label>
                  <Input value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} placeholder="Ward 12" data-testid="cmp-ward" className="mt-1" />
                </div>
              </div>
              <Button type="submit" disabled={loading} data-testid="cmp-submit"
                className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {loading ? "Filing..." : "File Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold heading-font text-slate-900 mb-3">My Complaints</h3>
          <div className="space-y-3" data-testid="cmp-list">
            {items.length === 0 && <p className="text-sm text-slate-500">No complaints yet.</p>}
            {items.map(c => (
              <Card key={c.ref_no} className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-slate-300">{c.category}</Badge>
                    <Badge className={c.status === "resolved" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-orange-100 text-orange-700 hover:bg-orange-100"}>{c.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-900 mt-2">{c.title}</p>
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
