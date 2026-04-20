"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { User, Mail, Lock, Building, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  status: string;
  institution: string;
};

export default function RegisterPage() {
  const auth = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
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
      const response = await fetch(API.auth.verifyOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();

      if (response.ok) {
        auth.login(result.data.accessToken, result.data.user);
        setSuccessMessage("Account verified! Redirecting to dashboard...");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        setError(result.error?.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-full opacity-30 dark:opacity-20 bg-grid pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] -z-10 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] -z-10 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px]" />

      <Navbar />

      <main className="pt-32 pb-20 px-6 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
        >
          <div className="bg-primary p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h1 className="text-3xl font-black mb-2 relative z-10">
              {step === 1 ? "Join the Vanguard" : "Verify Your Identity"}
            </h1>
            <p className="text-primary-foreground/80 relative z-10">
              {step === 1 ? "Empowering the next generation of researchers." : `Sent code to ${email}`}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register("name", { required: "Name is required" })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="Dr. Jane Doe"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
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
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="jane@university.edu"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Secure Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      {...register("password", { 
                        required: "Password is required",
                        minLength: { value: 8, message: "Minimum 8 characters" }
                      })}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="••••••••"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Current Status</label>
                    <div className="relative">
                      <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        {...register("status", { required: "Please select your status" })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
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
                    {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
                  </div>

                  {/* Institution */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Institution</label>
                    <div className="relative">
                      <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        {...register("institution", { required: "Institution is required" })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none transition-all"
                        placeholder="University Name"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.institution && <p className="text-xs text-red-500 mt-1">{errors.institution.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-8 text-center animate-fade-up">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail size={40} className="text-emerald-600" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Verification Sent</h2>
                  <p className="text-slate-500">We've sent a secure verification link to <span className="font-bold text-slate-900 dark:text-white">{email}</span>. Please click the link in your email to activate your account.</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-slate-100 dark:border-white/10 italic text-sm text-slate-500">
                  "Establishing the habit of authenticated, secure entry."
                </div>

                <Link 
                  href="/login"
                  className="block w-full bg-primary text-white py-5 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  Return to Login <ArrowRight size={20} />
                </Link>
                
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 text-sm font-bold hover:text-primary transition-colors"
                >
                  Change Email Address
                </button>
              </div>
            )}

            <p className="text-center text-sm text-slate-500">
              Already a member?{" "}
              <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
