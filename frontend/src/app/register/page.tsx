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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="pt-32 pb-20 px-6 flex justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="bg-primary p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">
              {step === 1 ? "Join ResearchBridge" : "Verify Email"}
            </h1>
            <p className="text-primary-foreground/80">
              {step === 1 ? "Start your journey in the global research community." : `We sent a code to ${email}`}
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User size={16} /> Full Name
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail size={16} /> Email Address
                  </label>
                  <input
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="john@university.edu"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Lock size={16} /> Password
                  </label>
                  <input
                    type="password"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 8, message: "Minimum 8 characters" }
                    })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <GraduationCap size={16} /> Status
                    </label>
                    <select
                      {...register("status", { required: "Please select your status" })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
                      disabled={isSubmitting}
                    >
                      <option value="">Select status...</option>
                      <option value="undergraduate">Undergraduate Student</option>
                      <option value="graduate">Graduate Student</option>
                      <option value="phd">PhD Researcher</option>
                      <option value="professor">Professor / Faculty</option>
                      <option value="industry">Industry Specialist</option>
                    </select>
                    {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
                  </div>

                  {/* Institution */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Building size={16} /> Institution
                    </label>
                    <input
                      {...register("institution", { required: "Institution is required" })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="University of Science"
                      disabled={isSubmitting}
                    />
                    {errors.institution && <p className="text-xs text-red-500 mt-1">{errors.institution.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary transition-all shadow-xl hover:shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Complete Registration <ArrowRight size={20} /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2 text-center mb-6">
                  <p className="text-sm text-slate-500 mb-4">Please enter the 6-digit verification code sent to your email.</p>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                    className="w-full text-center text-3xl tracking-[0.5em] font-mono px-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="000000"
                    disabled={isSubmitting}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-xl hover:shadow-accent/25 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Verify Account <ArrowRight size={20} /></>}
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-slate-500 text-sm hover:underline"
                >
                  Back to form
                </button>
              </form>
            )}

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
