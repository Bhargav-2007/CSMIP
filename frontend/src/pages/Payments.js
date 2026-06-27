import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { toast } from "sonner";
import { CheckCircle2, IndianRupee, ArrowLeft } from "lucide-react";

export default function Payments() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { token, user } = useAuth();
  const [svc, setSvc] = useState(null);
  const [bill, setBill] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(user?.name || "");
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/services/${slug}`).then(r => setSvc(r.data));
  }, [slug]);

  if (!svc) return <div className="p-10">Loading...</div>;

  const pay = async () => {
    if (!bill || !amount || Number(amount) <= 0) { toast.error("Fill all fields"); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API_URL}/payments/mock`,
        { service_slug: slug, bill_number: bill, amount: Number(amount), payer_name: payer || "Citizen" },
        { headers: authHeaders(token) });
      setDone(r.data);
      toast.success(`Payment successful · ${r.data.txn_id}`);
    } catch (e) { toast.error("Payment failed"); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-10" data-testid="payment-success">
        <Card className="border-green-200 bg-green-50 shadow-none">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
            <h2 className="mt-4 text-2xl font-bold heading-font text-slate-900">Payment Successful</h2>
            <p className="mt-1 text-slate-700">{svc.name}</p>
            <div className="mt-6 bg-white border border-slate-200 rounded-md p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Receipt No.</span><span className="font-mono font-semibold" data-testid="receipt-ref">{done.ref_no}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction ID</span><span className="font-mono">{done.txn_id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-semibold">₹{done.amount}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Method</span><span>{done.method}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Bill</span><span className="font-mono">{done.bill_number}</span></div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <Button onClick={() => nav("/dashboard")} className="bg-[var(--civic-primary)] hover:bg-blue-800 text-white" data-testid="pay-dash-btn">My Dashboard</Button>
              <Button variant="outline" onClick={() => window.print()} data-testid="pay-print-btn">Print Receipt</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-10" data-testid="payment-page">
      <button onClick={() => nav(-1)} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>
      <Badge className="bg-orange-100 text-[var(--civic-saffron)] hover:bg-orange-100">{svc.category}</Badge>
      <h1 className="mt-2 text-3xl font-bold heading-font text-slate-900">Pay: {svc.name}</h1>
      <p className="text-slate-600 mt-1">{svc.description}</p>

      <Card className="mt-6 border-slate-200 shadow-none">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Bill / Consumer / Property ID</Label>
            <Input value={bill} onChange={e => setBill(e.target.value)} placeholder="e.g., PROP-12345" data-testid="pay-bill-input" className="mt-1" />
          </div>
          <div>
            <Label>Payer Name</Label>
            <Input value={payer} onChange={e => setPayer(e.target.value)} data-testid="pay-payer-input" className="mt-1" />
          </div>
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="2500" data-testid="pay-amount-input" className="mt-1" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-600">
            <strong>MOCK MODE:</strong> This is a simulated payment for demo. No real transaction occurs.
          </div>
          <Button onClick={pay} disabled={loading} data-testid="pay-now-btn"
            className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
            <IndianRupee className="w-4 h-4 mr-1" />
            {loading ? "Processing..." : `Pay ₹${amount || "0"}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
