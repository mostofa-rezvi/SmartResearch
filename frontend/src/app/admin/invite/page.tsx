"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";

export default function SuperAdminInvitePage() {
  const { isSuperAdmin, token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Restricted Access</h1>
          <p className="text-slate-600 mb-6">This section is exclusively for Super Admin members.</p>
          <Link href="/" className="text-primary font-bold hover:underline">Return to safety</Link>
        </div>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(API.admin.invite, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: "Academic invitation initiated successfully. The magic link has been generated." });
        setName("");
        setEmail("");
      } else {
        setMessage({ type: 'error', text: data.message || "Failed to send invitation." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Connection error. Please check your backend." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="bg-primary p-8 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserPlus /> Academic Invite
            </h1>
            <p className="text-primary-foreground/80 mt-2">
              Invite distinguished scholars and researchers to the platform. 
              They will receive a secure onboarding link.
            </p>
          </div>

          <form onSubmit={handleInvite} className="p-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 ${
                message.type === 'error' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {message.type === 'error' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Scholar Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400"><UserPlus size={18} /></span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Prof. Julian Barnes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Institutional Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-400"><Mail size={18} /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="j.barnes@university.edu"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary transition-all shadow-xl hover:shadow-primary/25 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Generate Exclusive Invite"}
            </button>
            <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-bold">
              Mission Critical Action
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
