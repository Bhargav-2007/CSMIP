import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth";
import { useI18n } from "@/i18n";
import { authAPI, formatAPIError } from "@/services/api";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.sendOTP(phone);
      setStep(2);
      toast.success("OTP sent to your phone number");
      if (import.meta.env.MODE === "development" && response.data.dev_otp) {
        console.log(`[DEV] OTP for testing: ${response.data.dev_otp}`);
      }
    } catch (error) {
      const apiError = formatAPIError(error);
      toast.error(apiError.message);
    }
    setLoading(false);
  };

  const verify = async () => {
    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, otp);
      const { token, refresh_token, user } = response.data;
      localStorage.setItem('csmip_token', token);
      localStorage.setItem('csmip_refresh_token', refresh_token);
      localStorage.setItem('csmip_user', JSON.stringify(user));
      login(token, user);
      toast.success(`Welcome, ${user.name || 'Citizen'}! 🙏`);
      nav("/dashboard");
    } catch (error) {
      const apiError = formatAPIError(error);
      toast.error(apiError.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Panel – Decorative */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0F2167 0%, #1E3A8A 40%, #1d4ed8 100%)'}}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />

        <Link to="/" className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold heading-font">CS</div>
          <div>
            <div className="text-sm font-bold text-white heading-font">Citizen Services</div>
            <div className="text-[10px] text-blue-300 uppercase tracking-wider">Municipal Intelligence Platform</div>
          </div>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-blue-200 mb-6" style={{background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.2)'}}>
            <ShieldCheck className="w-3 h-3 text-green-300" />
            Secure & Government Verified
          </div>
          <h2 className="text-4xl font-bold heading-font text-white leading-tight">
            Digital governance,<br />
            <span className="text-blue-300">at your fingertips.</span>
          </h2>
          <p className="mt-4 text-blue-200 text-sm leading-relaxed max-w-sm">
            Access 50+ government services, file RTI requests, pay bills, and track applications — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "No paperwork required",
              "Real-time application tracking",
              "Multilingual support (EN/HI)",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 relative">
          <div className="h-1 w-10 rounded-full bg-orange-400" />
          <div className="h-1 w-10 rounded-full bg-white" />
          <div className="h-1 w-10 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Right Panel – Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--civic-primary)] text-white flex items-center justify-center font-bold text-xs">CS</div>
              <span className="font-bold heading-font text-slate-900 text-sm">Citizen Services</span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold heading-font text-slate-900">{t("login")}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {step === 1 ? "Enter your mobile number to receive OTP" : `OTP sent to +91 ${phone}`}
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-[var(--civic-primary)]" : "bg-slate-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-[var(--civic-primary)]" : "bg-slate-200"}`} />
          </div>

          {/* Step 1: Phone */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t("phone")}</label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 h-11 bg-white focus-within:ring-2 focus-within:ring-[var(--civic-primary)] focus-within:border-[var(--civic-primary)] transition-all">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-600 border-r border-slate-200 pr-2 mr-1">+91</span>
                  <Input
                    data-testid="login-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9999999999"
                    className="border-0 focus-visible:ring-0 px-0 h-auto text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t("your_name")} <span className="font-normal text-slate-400">(Optional)</span></label>
                <Input
                  data-testid="login-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="h-11 border-slate-300 rounded-xl focus-visible:ring-[var(--civic-primary)] focus-visible:border-[var(--civic-primary)] bg-white"
                />
              </div>

              <Button
                onClick={send}
                disabled={loading || phone.length !== 10}
                data-testid="send-otp-btn"
                className="w-full h-11 bg-[var(--civic-primary)] hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all hover:shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="spinner w-4 h-4" /> Sending OTP…</span>
                ) : (
                  <span className="flex items-center gap-2">{t("send_otp")} <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{t("enter_otp")}</label>
                <Input
                  data-testid="login-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="h-14 border-slate-300 rounded-xl focus-visible:ring-[var(--civic-primary)] focus-visible:border-[var(--civic-primary)] bg-white tracking-[0.5em] text-center text-2xl font-bold placeholder:text-slate-300 placeholder:tracking-normal"
                />
                <p className="text-xs text-slate-500 mt-2 text-center">6-digit OTP sent to +91 {phone}</p>
              </div>

              <Button
                onClick={verify}
                disabled={loading || otp.length !== 6}
                data-testid="verify-otp-btn"
                className="w-full h-11 bg-[var(--civic-primary)] hover:bg-blue-800 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all hover:shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="spinner w-4 h-4" /> Verifying…</span>
                ) : t("verify_otp")}
              </Button>

              <button
                onClick={() => { setStep(1); setOtp(""); }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                data-testid="change-phone-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change phone number
              </button>
            </div>
          )}

          <p className="text-xs text-center text-slate-400 mt-8 leading-relaxed">
            By continuing you agree to our{" "}
            <a href="#" className="underline hover:text-slate-700">Terms of Service</a> &amp;{" "}
            <a href="#" className="underline hover:text-slate-700">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
