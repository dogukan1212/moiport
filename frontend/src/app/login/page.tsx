"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { LayoutDashboard, ArrowRight, Mail, Lock, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { primaryColor } from "@/components/landing-layout";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<
    "login" | "verify" | "email_verify" | "forgot_request" | "forgot_confirm"
  >("login");
  const [challengeToken, setChallengeToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailVerifyToken, setEmailVerifyToken] = useState("");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [autoEmailVerifyStarted, setAutoEmailVerifyStarted] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const { login } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = (searchParams.get("verifyEmailToken") || "").trim();
    const code = (searchParams.get("verifyEmailCode") || "").trim();
    if (!token || autoEmailVerifyStarted) return;

    setAutoEmailVerifyStarted(true);
    setEmailVerifyToken(token);
    setEmailVerifyCode(code);
    setStep("email_verify");
    setError("");
    setMessage("E-posta doğrulaması yapılıyor...");

    (async () => {
      try {
        const res = code
          ? await api.post("/auth/verify-email", { token, code })
          : await api.post("/auth/verify-email-token", { token });
        login(res.data.access_token, res.data.user);
      } catch (err: any) {
        setMessage("");
        setError(err?.response?.data?.message || "Doğrulama başarısız");
      }
    })();
  }, [searchParams, autoEmailVerifyStarted, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data?.requiresEmailVerification && res.data?.token) {
        setEmailVerifyToken(String(res.data.token));
        setEmailVerifyCode("");
        setStep("email_verify");
        setMessage("E-postanıza doğrulama kodu gönderdik.");
        return;
      }
      if (res.data?.requiresTwoFactor && res.data?.token) {
        setChallengeToken(String(res.data.token));
        setStep("verify");
        return;
      }
      login(res.data.access_token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/verify-2fa", {
        token: challengeToken,
        code: verificationCode,
      });
      login(res.data.access_token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Doğrulama başarısız");
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/verify-email", {
        token: emailVerifyToken,
        code: emailVerifyCode.trim(),
      });
      login(res.data.access_token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Doğrulama başarısız");
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    try {
      await api.post("/auth/resend-2fa", { token: challengeToken });
    } catch (err: any) {
      setError(err.response?.data?.message || "Kod tekrar gönderilemedi");
    }
  };

  const handleResendEmail = async () => {
    setError("");
    setMessage("");
    try {
      await api.post("/auth/resend-email-verification", { token: emailVerifyToken });
      setMessage("Kod tekrar gönderildi.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Kod tekrar gönderilemedi");
    }
  };

  const startForgotPassword = () => {
    setError("");
    setMessage("");
    setResetCode("");
    setResetNewPassword("");
    setStep("forgot_request");
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/auth/password-reset/request", { email });
      setStep("forgot_confirm");
      setMessage("Şifre sıfırlama kodu e-posta adresinize gönderildi.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Şifre sıfırlama isteği başarısız");
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/auth/password-reset/confirm", {
        email: email.trim(),
        code: resetCode.trim(),
        newPassword: resetNewPassword,
      });
      setPassword("");
      setResetCode("");
      setResetNewPassword("");
      setStep("login");
      setMessage("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Şifre sıfırlama başarısız");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] font-sans selection:bg-[#00e676] selection:text-black">
      {/* Sol Taraf - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-24 relative z-10">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-2 mb-8 w-fit">
            <div
              className="flex size-8 items-center justify-center rounded"
              style={{ backgroundColor: primaryColor }}
            >
              <LayoutDashboard size={20} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              MOI PORT
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white mb-3">Tekrar Hoş Geldiniz</h1>
          <p className="text-zinc-400">Ajans hesabınıza giriş yaparak yönetime devam edin.</p>
        </div>

        <form
          onSubmit={
            step === "login"
              ? handleSubmit
              : step === "verify"
                ? handleVerify
                : step === "email_verify"
                  ? handleVerifyEmail
                : step === "forgot_request"
                  ? handleRequestReset
                  : handleConfirmReset
          }
          className="space-y-5 max-w-md"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl"
            >
              {error}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-sm text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-xl"
            >
              {message}
            </motion.div>
          )}

          {step === "verify" ? (
            <>
              <div className="space-y-2">
                <div className="text-white font-extrabold text-2xl">SMS Doğrulama</div>
                <div className="text-zinc-400 text-sm">
                  Telefonunuza gelen 6 haneli doğrulama kodunu girin.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Doğrulama Kodu</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    inputMode="numeric"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-4 transition-transform active:scale-[0.98]"
              >
                Doğrula <ArrowRight className="ml-2" size={20} />
              </Button>

              <button
                type="button"
                onClick={handleResend}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Kodu tekrar gönder
              </button>
            </>
          ) : step === "email_verify" ? (
            <>
              <div className="space-y-2">
                <div className="text-white font-extrabold text-2xl">E-posta Doğrulama</div>
                <div className="text-zinc-400 text-sm">
                  E-postanıza gelen 6 haneli doğrulama kodunu girin.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Doğrulama Kodu</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    inputMode="numeric"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="123456"
                    value={emailVerifyCode}
                    onChange={(e) => setEmailVerifyCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-4 transition-transform active:scale-[0.98]"
              >
                Doğrula <ArrowRight className="ml-2" size={20} />
              </Button>

              <button
                type="button"
                onClick={handleResendEmail}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Kodu tekrar gönder
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setStep("login");
                }}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Girişe dön
              </button>
            </>
          ) : step === "forgot_request" ? (
            <>
              <div className="space-y-2">
                <div className="text-white font-extrabold text-2xl">Şifre Sıfırlama</div>
                <div className="text-zinc-400 text-sm">
                  E-posta adresinizi girin, size 6 haneli kod gönderelim.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">E-posta</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    type="email"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="ornek@ajans.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-4 transition-transform active:scale-[0.98]"
              >
                Kodu Gönder <ArrowRight className="ml-2" size={20} />
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setStep("login");
                }}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Girişe dön
              </button>
            </>
          ) : step === "forgot_confirm" ? (
            <>
              <div className="space-y-2">
                <div className="text-white font-extrabold text-2xl">Şifre Sıfırlama</div>
                <div className="text-zinc-400 text-sm">
                  E-postanıza gelen kodu ve yeni şifrenizi girin.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Kod</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    inputMode="numeric"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Yeni Şifre</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
                  <input
                    type="password"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-4 transition-transform active:scale-[0.98]"
              >
                Şifreyi Güncelle <ArrowRight className="ml-2" size={20} />
              </Button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setStep("login");
                }}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Girişe dön
              </button>
            </>
          ) : (
            <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">E-posta</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
              <input
                type="email"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                placeholder="ornek@ajans.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Şifre</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00e676] transition-colors" size={18} />
              <input
                type="password"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-12 py-4 text-white placeholder-zinc-600 outline-none focus:border-[#00e676]/50 focus:bg-white/[0.05] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startForgotPassword}
            className="w-full text-right text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Şifremi unuttum
          </button>

          <Button 
            type="submit" 
            className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-14 rounded-xl text-base mt-4 transition-transform active:scale-[0.98]"
          >
            Giriş Yap <ArrowRight className="ml-2" size={20} />
          </Button>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-[#00e676] hover:underline font-bold">
              Hemen Kaydolun
            </Link>
          </p>
            </>
          )}
        </form>
      </div>

      {/* Sağ Taraf - Görsel */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00e676]/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 text-center max-w-lg">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="w-full aspect-video bg-zinc-900/50 rounded-2xl mb-6 flex items-center justify-center border border-white/5">
                <LayoutDashboard size={48} className="text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">İşinizi Kaldığınız Yerden Yönetin</h3>
            <p className="text-zinc-400 text-sm">
              MOI Port paneline giriş yaparak tüm operasyonlarınızı tek bir yerden kontrol etmeye devam edin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
