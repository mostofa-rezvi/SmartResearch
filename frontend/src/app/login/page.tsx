"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function LoginContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok && data.otp_required) {
        setStep(2);
        setSuccessMessage(data.message);
      } else {
        setError(data.message || "Invalid credentials");
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
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (response.ok) {
        // Save token (localStorage for now) and redirect
        localStorage.setItem("token", data.token);
        setSuccessMessage("Access granted! Redirecting...");
        setTimeout(() => window.location.href = "/", 2000);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="pt-32 pb-20 px-6 flex justify-center">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="bg-primary p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">
            {step === 1 ? "Welcome Back" : "One-Time Passcode"}
          </h1>
          <p className="text-primary-foreground/80">
            {step === 1 ? "Log in to ResearchBridge" : `Sent to ${email}`}
          </p>
        </div>

        <div className="p-8 space-y-6">
          {(successMessage || error) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${
                error 
                ? "bg-red-50 text-red-600 border-red-100" 
                : "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              <CheckCircle2 size={18} className="shrink-0" />
              {error || successMessage}
            </motion.div>
          )}

          {step === 1 ? (
            <form onSubmit={handleInitialLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail size={16} /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock size={16} /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary transition-all shadow-xl hover:shadow-primary/25 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-center mb-6">
                <p className="text-sm text-slate-500 mb-4">Please enter the 6-digit code sent to your email.</p>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="000000"
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl hover:shadow-accent/25 flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify & Enter <ArrowRight size={20} /></>}
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-slate-500 text-sm hover:underline"
              >
                Back to login
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <Suspense fallback={
        <main className="pt-32 pb-20 px-6 flex justify-center italic text-slate-400">
          Loading login...
        </main>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
