import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL, useAuth, authHeaders } from "@/auth";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ApplyService() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();
  const [svc, setSvc] = useState(null);
  const [data, setData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [review, setReview] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/services/${slug}`).then(r => setSvc(r.data));
  }, [slug]);

  if (!svc) return <div className="max-w-3xl mx-auto p-10">Loading...</div>;

  const setField = (name, val) => setData(d => ({ ...d, [name]: val }));

  const validateForm = () => {
    const errors = [];
    svc.fields?.forEach(f => {
      if (f.required && !data[f.name]) {
        errors.push(`${f.label} is required`);
      }
    });
    return errors;
  };

  const submit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSubmitting(true);
    try {
      const r = await axios.post(
        `${API_URL}/applications`,
        { serviceId: svc.id, formData: data },
        { headers: authHeaders(token) }
      );
      setResult(r.data);
      toast.success(`Application submitted: ${r.data.ref_no}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Submission failed");
    }
    setSubmitting(false);
  };

  const canReview = () => {
    return svc.fields?.every(f => !f.required || data[f.name]);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-10" data-testid="apply-success">
        <Card className="border-green-200 bg-green-50 shadow-none">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
            <h2 className="mt-4 text-2xl font-bold heading-font text-slate-900">Application Submitted</h2>
            <p className="mt-2 text-slate-700">{svc.name}</p>
            <div className="mt-6 bg-white border border-slate-200 rounded-md py-4 px-3 inline-block">
              <div className="text-xs uppercase tracking-wider text-slate-500">Reference Number</div>
              <div className="font-mono text-lg font-semibold text-slate-900" data-testid="success-ref">{result.ref_no}</div>
            </div>
            <p className="mt-3 text-sm text-slate-600">Estimated processing: {svc.sla_days} days. You'll receive SMS updates.</p>
            <div className="flex justify-center gap-2 mt-6">
              <Button onClick={() => nav(`/track?ref=${result.ref_no}`)} className="bg-[var(--civic-primary)] hover:bg-blue-800 text-white" data-testid="success-track">Track Status</Button>
              <Button onClick={() => nav("/dashboard")} variant="outline" data-testid="success-dash">My Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" data-testid="apply-form">
      <button onClick={() => nav(-1)} className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>
      <h1 className="text-3xl font-bold heading-font text-slate-900">Apply: {svc.name}</h1>
      <p className="text-slate-600 mt-1">Fee: {svc.fee > 0 ? `₹${svc.fee}` : "Free"} · SLA: {svc.sla_days} days</p>

      <Card className="mt-6 border-slate-200 shadow-none">
        <CardContent className="p-6 space-y-4">
          {svc.fields.map(f => (
            <div key={f.name}>
              <Label className="text-sm font-medium text-slate-700">{f.label} {f.required && <span className="text-red-600">*</span>}</Label>
              {f.type === "textarea" ? (
                <Textarea data-testid={`field-${f.name}`} className="mt-1"
                  value={data[f.name] || ""} onChange={(e) => setField(f.name, e.target.value)} />
              ) : f.type === "select" ? (
                <Select value={data[f.name] || ""} onValueChange={(v) => setField(f.name, v)}>
                  <SelectTrigger data-testid={`field-${f.name}`} className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input data-testid={`field-${f.name}`} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} className="mt-1"
                  value={data[f.name] || ""} onChange={(e) => setField(f.name, e.target.value)} />
              )}
            </div>
          ))}

          {!review ? (
            <Button
              onClick={() => setReview(true)}
              disabled={!canReview()}
              data-testid="review-btn"
              className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white disabled:opacity-50"
            >
              Review Application
            </Button>
          ) : (
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-2">Review your details</h3>
              <dl className="text-sm space-y-1">
                {svc.fields.map(f => (
                  <div key={f.name} className="flex justify-between gap-3">
                    <dt className="text-slate-600">{f.label}:</dt>
                    <dd className="text-slate-900 font-medium text-right">{data[f.name] || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setReview(false)} data-testid="edit-btn">Edit</Button>
                <Button onClick={submit} disabled={submitting} data-testid="submit-app-btn"
                  className="flex-1 bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
                  {submitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
