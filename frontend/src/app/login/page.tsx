"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const auth = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      });
      const result = await response.json();

      if (response.ok && result.data?.otp_required) {
        setStep(2);
        setSuccessMessage(result.data.message);
      } else {
        setError(result.error?.message || result.data?.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please check your connection.");
    } finally {
      setIsLoading(false);
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
    <main className="pt-40 pb-20 px-6 flex justify-center">
      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
      >
        <div className="bg-primary p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <h1 className="text-3xl font-black mb-2 relative z-10">
            {step === 1 ? "Welcome Back" : "Security Shield"}
          </h1>
          <p className="text-primary-foreground/80 relative z-10">
            {step === 1 ? "Sign in to your research hub" : `Code sent to your inbox`}
          </p>
        </div>

        <div className="p-10 space-y-8">
          {(successMessage || error) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 ${
                error 
                ? "bg-red-50 text-red-600 border-red-100" 
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}
            >
              <CheckCircle2 size={18} className="shrink-0" />
              {error || successMessage}
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleInitialLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="name@university.edu"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-6 text-center">
                <p className="text-sm text-slate-500">A verification code has been sent to your email. It expires in 10 minutes.</p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-center text-4xl tracking-widest font-black px-4 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="000000"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Access <ArrowRight size={20} /></>}
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-slate-500 text-sm font-bold hover:text-primary transition-colors"
              >
                Back to credentials
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            New to ResearchBridge?{" "}
            <Link href="/register" className="text-primary font-black hover:underline underline-offset-4">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-full opacity-30 dark:opacity-20 bg-grid pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] -z-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] -z-10 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />

      <Navbar />
      <Suspense fallback={
        <main className="pt-40 pb-20 px-6 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
