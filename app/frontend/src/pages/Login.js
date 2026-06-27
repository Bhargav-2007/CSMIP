import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/auth";
import { useI18n } from "@/i18n";
import { authAPI, formatAPIError } from "@/services/api";
import { toast } from "sonner";
import { Phone, ShieldCheck, ArrowRight } from "lucide-react";

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
      
      // DEVELOPMENT ONLY: Log OTP to console for testing
      if (process.env.NODE_ENV === "development" && response.data.dev_otp) {
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
      
      // Store tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth context
      login(token, user);
      toast.success(`Welcome, ${user.name || 'Citizen'}`);
      nav("/dashboard");
    } catch (error) {
      const apiError = formatAPIError(error);
      toast.error(apiError.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 py-12" data-testid="login-page">
      <div className="max-w-md mx-auto px-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-50 text-[var(--civic-primary)] rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="mt-4 text-2xl font-bold heading-font text-slate-900">{t("login")}</h1>
              <p className="mt-1 text-sm text-slate-600">Secure login with mobile OTP</p>
            </div>

            {step === 1 && (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">{t("phone")}</label>
                  <div className="mt-1 flex items-center gap-2 border border-slate-300 rounded-md px-3 focus-within:ring-2 focus-within:ring-blue-500">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 text-sm">+91</span>
                    <Input 
                      data-testid="login-phone-input" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9999999999" 
                      className="border-0 focus-visible:ring-0 px-1" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">{t("your_name")} (Optional)</label>
                  <Input 
                    data-testid="login-name-input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Rahul Sharma" 
                    className="mt-1" 
                  />
                </div>
                <Button 
                  onClick={send} 
                  disabled={loading} 
                  data-testid="send-otp-btn"
                  className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white"
                >
                  {loading ? "Sending..." : t("send_otp")} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">{t("enter_otp")}</label>
                  <Input
                    data-testid="login-otp-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="mt-1 tracking-widest text-center text-lg"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Enter the 6-digit OTP sent to +91 {phone}
                  </p>
                </div>
                <Button
                  onClick={verify}
                  disabled={loading || otp.length !== 6}
                  data-testid="verify-otp-btn"
                  className="w-full bg-[var(--civic-primary)] hover:bg-blue-800 text-white"
                >
                  {loading ? "Verifying..." : t("verify_otp")}
                </Button>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-600 hover:text-slate-900 block w-full"
                  data-testid="change-phone-btn"
                >
                  Change phone number
                </button>
              </div>
            )}

            <p className="text-xs text-center text-slate-500 mt-6">
              By continuing you agree to the Terms of Service & Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
