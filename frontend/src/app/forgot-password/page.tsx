"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAppRouter } from "@/lib/useAppRouter";
import Navbar from "@/components/Navbar";
import AuthShowcase from "@/components/marketing/AuthShowcase";
import { API } from "@/config/api";

type Step = "request" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useAppRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API.auth.forgotPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMessage(result.data?.message || "If an account exists, a reset code has been sent.");
        setStep("reset");
      } else {
        setError(result.error?.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Server error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API.auth.resetPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMessage(null);
        setStep("done");
        setTimeout(() => router.push("/login?message=" + encodeURIComponent("Password reset successfully. Please sign in.")), 2200);
      } else {
        setError(result.error?.message || "Could not reset your password.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const res = await fetch(API.auth.forgotPassword, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) setSuccessMessage(result.data?.message || "A new code was sent.");
    } catch {
      setError("Could not resend the code.");
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617]">
      <Navbar />
      <main className="pt-20">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-5rem)]">
          <AuthShowcase
            eyebrow="Account Recovery"
            titleLead="Back into your lab in"
            titleHighlight="under a minute."
            subtitle="We'll email you a one-time code to verify it's you, then you can set a fresh password and get straight back to your research."
            features={[
              { title: "Email one-time code", desc: "A 6-digit code, valid for 15 minutes, proves it's really you." },
              { title: "No links to click", desc: "Reset entirely in-app — nothing to hunt for in your inbox." },
              { title: "Your data stays safe", desc: "Your labs and drafts remain encrypted throughout the process." },
            ]}
            stats={[
              { value: "15m", label: "Code Window" },
              { value: "AES-256", label: "Encryption" },
              { value: "24/7", label: "Support" },
            ]}
          />

          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md mx-auto"
            >
              {/* Mobile brand mark */}
              <Link href="/" className="lg:hidden inline-flex items-center gap-2.5 mb-8">
                <img src="/logo-icon.png" alt="" className="w-9 h-9 object-contain" />
                <span className="text-xl font-serif font-black text-slate-900 dark:text-white">ResearchBridge</span>
              </Link>

              {/* Heading */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary dark:text-accent-300 mono-academic">
                  {step === "done" ? <ShieldCheck size={13} /> : <KeyRound size={13} />}
                  {step === "request" ? "Forgot Password" : step === "reset" ? "Reset Password" : "All Set"}
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mt-3 mb-2 leading-tight">
                  {step === "request" ? "Reset your password" : step === "reset" ? "Enter your new password" : "Password updated"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  {step === "request"
                    ? "Enter your account email and we'll send you a verification code."
                    : step === "reset"
                    ? <>Enter the code sent to <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span> and choose a new password.</>
                    : "Your password has been changed. Redirecting you to sign in…"}
                </p>
              </div>

              {(successMessage || error) && step !== "done" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-6 p-4 rounded-2xl text-sm font-semibold border flex items-center gap-3 ${
                    error
                      ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800/50"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50"
                  }`}
                >
                  {error ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
                  {error || successMessage}
                </motion.div>
              )}

              {step === "request" && (
                <form onSubmit={requestCode} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent outline-none transition-all"
                        placeholder="name@university.edu"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send reset code <ArrowRight size={20} /></>}
                  </button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={resetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      autoFocus
                      className="w-full text-center text-3xl md:text-4xl tracking-[0.4em] font-black px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent outline-none transition-all mono-academic"
                      placeholder="000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent outline-none transition-all"
                        placeholder="At least 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                      Use 8+ characters with an uppercase letter, a lowercase letter, and a number.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset password <ArrowRight size={20} /></>}
                  </button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => { setStep("request"); setError(null); setSuccessMessage(null); }}
                      className="text-slate-500 dark:text-slate-400 font-bold hover:text-primary dark:hover:text-white transition-colors"
                    >
                      ← Use a different email
                    </button>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                      No code?{" "}
                      <button type="button" onClick={resend} className="text-primary dark:text-accent-300 font-bold hover:underline">
                        Resend
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {step === "done" && (
                <div className="text-center animate-fade-up">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <Link
                    href="/login"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Continue to sign in <ArrowRight size={20} />
                  </Link>
                </div>
              )}

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                Remembered it?{" "}
                <Link href="/login" className="text-primary dark:text-accent-300 font-bold hover:underline underline-offset-4">
                  Back to sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
