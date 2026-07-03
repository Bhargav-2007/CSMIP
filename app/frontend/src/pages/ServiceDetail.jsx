import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileText, Clock, IndianRupee, FileCheck2, AlertCircle, ArrowRight } from "lucide-react";
import { API_URL } from "@/auth";

export default function ServiceDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [svc, setSvc] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/services/${slug}`)
      .then(r => setSvc(r.data))
      .catch(() => setErr("Service not found"));
  }, [slug]);

  if (err) return <div className="max-w-3xl mx-auto p-10 text-center text-slate-600">{err}</div>;
  if (!svc) return <div className="max-w-3xl mx-auto p-10">Loading...</div>;

  const isPayment = svc.category === "Payments";
  const isComplaint = svc.slug === "complaint-311";
  const isRTI = svc.slug === "rti";
  const isScheme = svc.slug === "scheme-discovery";

  const primaryAction = () => {
    if (isComplaint) { nav("/complaints"); return; }
    if (isRTI) { nav("/rti"); return; }
    if (isScheme) { nav("/schemes"); return; }
    if (isPayment) { nav(`/pay/${svc.slug}`); return; }
    nav(`/apply/${svc.slug}`);
  };

  const ctaLabel = isPayment ? "Pay Now" : isComplaint ? "File Complaint" : isRTI ? "File RTI" : isScheme ? "Explore Schemes" : "Apply Now";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid={`service-detail-${svc.slug}`}>
      <Link to="/services" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Badge className="bg-blue-50 text-[var(--civic-primary)] hover:bg-blue-50 border-blue-200">{svc.category}</Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold heading-font text-slate-900">{svc.name}</h1>
          <p className="mt-2 text-slate-600">{svc.description}</p>
          <p className="mt-1 text-sm text-slate-500">Department: <span className="font-medium text-slate-700">{svc.department}</span></p>

          <Card className="mt-6 border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h3 className="font-semibold heading-font text-slate-900 mb-3 flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-[var(--civic-primary)]" /> Documents Required</h3>
              {(svc.documents && svc.documents.length > 0) ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {svc.documents.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--civic-primary)] mt-2" /> {d}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">No specific documents required.</p>}
            </CardContent>
          </Card>

          <Card className="mt-4 border-slate-200 shadow-none">
            <CardContent className="p-6">
              <h3 className="font-semibold heading-font text-slate-900 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[var(--civic-saffron)]" /> Eligibility</h3>
              <p className="text-sm text-slate-700">{svc.eligibility}</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-slate-200 shadow-none sticky top-20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Fee</span>
                <span className="font-semibold text-slate-900">{svc.fee > 0 ? `₹${svc.fee}` : "Free"}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Processing</span>
                <span className="font-semibold text-slate-900">{svc.sla_days > 0 ? `${svc.sla_days} days` : "Instant"}</span>
              </div>
              <Button onClick={primaryAction} data-testid="service-primary-cta"
                className="w-full mt-5 bg-[var(--civic-primary)] hover:bg-blue-800 text-white">
                {ctaLabel} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button onClick={() => nav("/assistant")} variant="outline" data-testid="service-assistant-cta" className="w-full mt-2">
                Get help from AI
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
