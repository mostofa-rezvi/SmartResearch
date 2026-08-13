"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { User, Mail, Lock, Building, GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Globe, Link2, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AuthShowcase from "@/components/marketing/AuthShowcase";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  status: string;
  institution: string;
  personal_website?: string;
  linkedin_url?: string;
  google_scholar_url?: string;
  researchgate_url?: string;
};

export default function RegisterPage() {
  const auth = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setError(null);
    setEmail(data.email);

    try {
      const response = await fetch(API.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setStep(2);
        setSuccessMessage("Account created! Check your email for the verification code.");
      } else {
        setError(result.error?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API.auth.verifyRegistration, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok) {
        auth.login(result.data.accessToken, result.data.user);
        setSuccessMessage("Account verified! Redirecting...");
        setTimeout(() => window.location.href = "/onboarding", 1200);
      } else {
        setError(result.error?.message || "Invalid verification code.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendRegistrationOtp = async () => {
    setError(null);
    try {
      const response = await fetch(API.auth.resendRegistrationOtp, {
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

  const inputBase =
    "w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent outline-none transition-all";

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617]">
      <Navbar />
      <main className="pt-20">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-5rem)]">
          <AuthShowcase
            eyebrow="Join the Vanguard"
            titleLead="Join the vanguard of"
            titleHighlight="open science."
            subtitle="Create your verified researcher identity and unlock semantic discovery, real-time lab collaboration, and expert mentorship."
            features={[
              { title: "Verified academic identity", desc: "Link your institutional email or ORCID to build trust and reputation." },
              { title: "AI-augmented discovery", desc: "Semantic search across 12.4M papers with RAG-powered summaries." },
              { title: "Real-time lab workspaces", desc: "Co-author LaTeX/Markdown and share datasets with your team." },
            ]}
            stats={[
              { value: "50K+", label: "Researchers" },
              { value: "12.4M", label: "Papers" },
              { value: "140+", label: "Universities" },
            ]}
          />

          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mx-auto"
            >
              {/* Mobile brand mark */}
              <Link href="/" className="lg:hidden inline-flex items-center gap-2.5 mb-8">
                <img src="/logo-icon.png" alt="" className="w-9 h-9 object-contain" />
                <span className="text-xl font-serif font-black text-slate-900 dark:text-white">ResearchBridge</span>
              </Link>

              {/* Heading */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary dark:text-accent-300 mono-academic">
                  <Sparkles size={13} />
                  {step === 1 ? "Create Your Account" : "Verify Your Identity"}
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mt-3 mb-2 leading-tight">
                  {step === 1 ? "Join the Vanguard" : "One last step"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  {step === 1
                    ? "Empowering the next generation of researchers."
                    : <>We sent a verification code to <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span>.</>}
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          {...register("name", { required: "Name is required" })}
                          className={`${inputBase} pl-12 pr-4`}
                          placeholder="Dr. Jane Doe"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address"
                            }
                          })}
                          className={`${inputBase} pl-12 pr-4`}
                          placeholder="jane@university.edu"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Secure Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password", {
                          required: "Password is required",
                          minLength: { value: 8, message: "Minimum 8 characters" }
                        })}
                        className={`${inputBase} pl-12 pr-12`}
                        placeholder="At least 8 characters"
                        disabled={isSubmitting}
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
                    {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Current Status</label>
                      <div className="relative">
                        <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                          {...register("status", { required: "Please select your status" })}
                          className={`${inputBase} pl-12 pr-4 appearance-none`}
                          disabled={isSubmitting}
                        >
                          <option value="">Select status...</option>
                          <option value="new">New Researcher</option>
                          <option value="amateur">Amateur Scholar</option>
                          <option value="undergraduate">Undergraduate Student</option>
                          <option value="graduate">Graduate Student</option>
                          <option value="phd">PhD Researcher</option>
                          <option value="professor">Professor / Faculty</option>
                          <option value="industry">Industry Specialist</option>
                        </select>
                      </div>
                      {errors.status && <p className="text-xs text-red-500 mt-1 ml-1">{errors.status.message}</p>}
                    </div>

                    {/* Institution */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Institution</label>
                      <div className="relative">
                        <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          {...register("institution", { required: "Institution is required" })}
                          className={`${inputBase} pl-12 pr-4`}
                          placeholder="University Name"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.institution && <p className="text-xs text-red-500 mt-1 ml-1">{errors.institution.message}</p>}
                    </div>
                  </div>

                  {/* Online Presence */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Online Presence — Optional</h3>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input {...register("personal_website")} className={`${inputBase} pl-11 pr-4 text-sm !py-3`} placeholder="Personal Website" />
                      </div>
                      <div className="relative">
                        <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input {...register("linkedin_url")} className={`${inputBase} pl-11 pr-4 text-sm !py-3`} placeholder="LinkedIn" />
                      </div>
                      <div className="relative">
                        <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input {...register("google_scholar_url")} className={`${inputBase} pl-11 pr-4 text-sm !py-3`} placeholder="Google Scholar" />
                      </div>
                      <div className="relative">
                        <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input {...register("researchgate_url")} className={`${inputBase} pl-11 pr-4 text-sm !py-3`} placeholder="ResearchGate" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Create Account <ArrowRight size={20} /></>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    By creating an account you agree to our{" "}
                    <Link href="/terms" className="text-primary dark:text-accent-300 font-semibold hover:underline">Terms</Link> and{" "}
                    <Link href="/privacy" className="text-primary dark:text-accent-300 font-semibold hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-up">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto">
                    <Mail size={32} className="text-emerald-600 dark:text-emerald-300" />
                  </div>
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
                      Code valid 15 min
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium">
                      No code?{" "}
                      <button type="button" onClick={handleResendRegistrationOtp} className="text-primary dark:text-accent-300 font-bold hover:underline">
                        Resend
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify &amp; Continue <ArrowRight size={20} /></>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-primary dark:hover:text-white transition-colors"
                  >
                    ← Change email address
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                Already a member?{" "}
                <Link href="/login" className="text-primary dark:text-accent-300 font-bold hover:underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
