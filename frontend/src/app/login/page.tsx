"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthShowcase from "@/components/marketing/AuthShowcase";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const auth = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(message);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok) {
        if (result.data?.otp_required) {
          setStep(2);
          setSuccessMessage(result.data.message);
        } else if (result.data?.accessToken) {
          auth.login(result.data.accessToken, result.data.user);
          setSuccessMessage("Authentication successful! Entering research lab...");
          setTimeout(() => window.location.href = "/dashboard", 1200);
        }
      } else {
        setError(result.error?.message || result.data?.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      const response = await fetch(API.auth.resendOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage(result.data?.message || "A new code was sent.");
      } else {
        setError(result.error?.message || "Could not resend the code.");
      }
    } catch (err) {
      setError("Could not resend the code. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API.auth.verifyOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok) {
        auth.login(result.data.accessToken, result.data.user);
        setSuccessMessage("Access granted! Redirecting to dashboard...");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        setError(result.error?.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Mobile brand mark (showcase is hidden on small screens) */}
        <Link href="/" className="lg:hidden inline-flex items-center gap-2.5 mb-8">
          <img src="/logo-icon.png" alt="" className="w-9 h-9 object-contain" />
          <span className="text-xl font-serif font-black text-slate-900 dark:text-white">ResearchBridge</span>
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary dark:text-accent-300 mono-academic">
            <ShieldCheck size={13} />
            {step === 1 ? "Secure Researcher Access" : "Two-Factor Verification"}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mt-3 mb-2 leading-tight">
            {step === 1 ? "Welcome back" : "Check your inbox"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {step === 1
              ? "Sign in to your virtual research lab."
              : <>Enter the 6-digit code sent to <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span>.</>}
          </p>
        </div>

        {(successMessage || error) && (
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

        {step === 1 ? (
          <form onSubmit={handleInitialLogin} className="space-y-5">
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
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-primary dark:text-accent-300 hover:underline underline-offset-2">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
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
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight size={20} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              autoFocus
              className="w-full text-center text-4xl md:text-5xl tracking-[0.4em] font-black px-4 py-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent outline-none transition-all mono-academic"
              placeholder="000000"
            />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Secure Session
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                No code?{" "}
                <button type="button" onClick={handleResendOtp} className="text-primary dark:text-accent-300 font-bold hover:underline">
                  Resend
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Unlock Access <ArrowRight size={20} /></>}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-primary dark:hover:text-white transition-colors"
            >
              ← Back to credentials
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
          New to ResearchBridge?{" "}
          <Link href="/register" className="text-primary dark:text-accent-300 font-bold hover:underline underline-offset-4">
            Create your account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617]">
      <Navbar />
      <main className="pt-20">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-5rem)]">
          <AuthShowcase
            eyebrow="Secure Researcher Access"
            titleLead="Pick up where your"
            titleHighlight="research left off."
            subtitle="Sign back into your virtual lab mesh — synchronized literature, live co-authoring, and your global peer network, all in one place."
            features={[
              { title: "Zero-knowledge encrypted labs", desc: "Your unpublished work stays yours — AES-256 at rest, TLS 1.3 in transit." },
              { title: "Two-factor secured sign-in", desc: "One-time codes protect your reputation and research data." },
              { title: "Global research network", desc: "Reconnect with mentors, co-authors, and lab groups instantly." },
            ]}
            stats={[
              { value: "50K+", label: "Researchers" },
              { value: "12.4M", label: "Papers" },
              { value: "140+", label: "Universities" },
            ]}
          />
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <LoginContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
