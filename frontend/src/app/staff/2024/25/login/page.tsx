"use client";

/**
 * Staff Console Login — /staff/2024/25/login
 *
 * A deliberately separate, restricted-access sign-in for the admin panel. It
 * shares the same backend auth flow (password → email OTP) as the researcher
 * login but presents a distinct "secure terminal" UI and:
 *   - never offers self-registration (staff accounts are provisioned),
 *   - rejects non-admin accounts after 2FA instead of dumping them into the app,
 *   - always lands a verified admin on the Staff Console.
 */

import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertTriangle, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

const PANEL_PATH = "/staff/2024/25/admin-panel";
const isStaffRole = (role?: string) => role === "admin" || role === "super_admin";

export default function StaffLoginPage() {
  const auth = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(API.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error?.message || "Invalid staff credentials.");
        return;
      }
      if (result.data?.otp_required) {
        setStep(2);
        if (result.data.dev_otp) {
          setOtp(String(result.data.dev_otp));
          setNotice(`Dev mode — verification code ${result.data.dev_otp} pre-filled.`);
        } else {
          setNotice("A one-time verification code was sent to your staff email.");
        }
      } else if (result.data?.accessToken) {
        // OTP disabled — verify role immediately.
        finalize(result.data.accessToken, result.data.user);
      }
    } catch {
      setError("Cannot reach the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.auth.verifyOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error?.message || "Invalid verification code.");
        return;
      }
      finalize(result.data.accessToken, result.data.user);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const res = await fetch(API.auth.resendOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        if (result.data?.dev_otp) {
          setOtp(String(result.data.dev_otp));
          setNotice(`Dev mode — new code ${result.data.dev_otp} pre-filled.`);
        } else {
          setNotice(result.data?.message || "A new code was sent.");
        }
      } else {
        setError(result.error?.message || "Could not resend the code.");
      }
    } catch {
      setError("Could not resend the code.");
    }
  };

  // Gate on role: only admins/super_admins may hold a Staff Console session.
  const finalize = (accessToken: string, user: any) => {
    if (!isStaffRole(user?.role)) {
      setError("This account is not authorized for staff access.");
      setStep(1);
      setPassword("");
      setOtp("");
      return;
    }
    auth.login(accessToken, user);
    setNotice("Access granted. Opening the Staff Console…");
    setTimeout(() => { window.location.href = PANEL_PATH; }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-950 text-slate-200">
      {/* Ambient security-grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-rose-600/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-sky-600/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Crest */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl shadow-black/40 mb-5">
            <ShieldCheck className="text-rose-400" size={30} />
          </div>
          <span className="mono-academic text-[11px] font-black tracking-[0.32em] text-rose-400/80 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Restricted · Staff Console
          </span>
          <h1 className="text-3xl font-serif font-black text-white mt-3">
            {step === 1 ? "Staff Access" : "Two-Factor Check"}
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">
            {step === 1
              ? "Authorized administrators only. All actions are logged and audited."
              : <>Enter the 6-digit code issued to <span className="font-bold text-slate-200">{email}</span>.</>}
          </p>
        </div>

        {(error || notice) && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-sm font-semibold border flex items-center gap-2.5 ${
              error
                ? "bg-rose-950/50 text-rose-300 border-rose-800/50"
                : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
            }`}
          >
            {error ? <AlertTriangle size={17} className="shrink-0" /> : <ShieldCheck size={17} className="shrink-0" />}
            <span>{error || notice}</span>
          </div>
        )}

        <div className="rounded-2xl bg-slate-900/70 backdrop-blur border border-white/10 shadow-2xl shadow-black/50 p-6">
          {step === 1 ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Staff Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/70 focus:border-transparent outline-none transition-all"
                    placeholder="admin@researchbridge.app"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/70 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/40 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <Loader2 size={19} className="animate-spin" /> : <>Authenticate <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.5em] font-black pl-4 pr-4 py-4 rounded-xl bg-slate-950/60 border border-white/10 text-white focus:ring-2 focus:ring-rose-500/70 outline-none transition-all mono-academic"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/40 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? <Loader2 size={19} className="animate-spin" /> : <>Unlock Console <ArrowRight size={18} /></>}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStep(1); setOtp(""); setError(null); setNotice(null); }} className="text-slate-500 hover:text-slate-300 font-bold transition-colors">
                  ← Back
                </button>
                <button type="button" onClick={handleResend} className="text-rose-400 hover:text-rose-300 font-bold transition-colors">
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6 font-mono uppercase tracking-widest">
          Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
