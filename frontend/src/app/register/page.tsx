"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { User, Mail, Lock, Building, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  status: string;
  institution: string;
};

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(result.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl text-center border border-slate-100 dark:border-slate-700"
        >
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Verification Sent!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            We've sent a verification link to your email. Please check your inbox (and spam folder) to activate your ResearchBridge account.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            Return to Home <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">Join ResearchBridge</h1>
            <p className="text-primary-foreground/80">Start your journey in the global research community.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <User size={16} /> Full Name
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="John Doe"
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

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
