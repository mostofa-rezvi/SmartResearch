"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Lock, AtSign, Loader2, CheckCircle2, ShieldCheck, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    const fetchInvite = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/invitation/${token}`);
        const data = await response.json();
        if (response.ok) {
          setInviteData(data);
        } else {
          setError(data.message || "Invalid or expired invitation.");
        }
      } catch (err) {
        setError("Unable to connect to service.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, title, bio }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login?message=" + encodeURIComponent(data.message));
      } else {
        setError(data.message || "Activation failed.");
      }
    } catch (err) {
      setError("Server connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex flex-col items-center pt-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /><p className="mt-4 italic text-slate-500">Validating your credentials...</p></div>;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl text-center border border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-4">Invitation Error</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={() => router.push("/")} className="text-primary font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto mt-10 p-8 md:p-12 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700"
    >
      <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-100 dark:border-slate-700">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 transition-transform hover:rotate-12 duration-500">
          <GraduationCap size={48} />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full mb-3 inline-block">Exclusive Academic Invite</span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 underline decoration-accent decoration-4">Welcome, {inviteData.invitee_name}</h1>
          <p className="text-slate-600 dark:text-slate-400">You have been invited to ResearchBridge by our Super Admin community. Complete your profile to activate your professional account.</p>
        </div>
      </div>

      <form onSubmit={handleActivate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><Lock size={16} /> Create Security Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><BookOpen size={16} /> Professional Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
              placeholder="e.g. Professor of Neuroscience"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2"><AtSign size={16} /> Academic Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="Tell us about your research focus, lab, or academic trajectory..."
            />
          </div>
        </div>

        <div className="md:col-span-2 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Complete Professional Onboarding</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <Suspense fallback={<div>Loading Secure Portal...</div>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
