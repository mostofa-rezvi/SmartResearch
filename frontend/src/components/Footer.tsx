"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  GraduationCap,
  Globe,
  Send,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Search,
  Users,
  FileText
} from "lucide-react";

export default function Footer() {
  const { user } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail("");
        setSubscribed(false);
      }, 3500);
    }
  };

  return (
    <footer className="pt-20 pb-12 glass-skeuo-card border-t border-white/30 dark:border-white/10 text-slate-900 dark:text-slate-100 relative overflow-hidden">
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3.5 group inline-flex">
              <img
                src="/logo-animated.gif"
                alt="SmartResearch Animated Logo"
                className="w-11 h-11 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="text-2xl font-serif font-black text-primary dark:text-white tracking-tight">
                ResearchBridge
              </span>
            </Link>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic text-sm font-medium max-w-sm">
              "Unifying global intelligence from student to professor. Escaping academic isolation through structured discovery and vector literature synthesis."
            </p>

            {/* Compliance & Status Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50 uppercase tracking-widest font-mono flex items-center gap-1">
                <CheckCircle2 size={12} /> Email Verified
              </span>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 uppercase tracking-widest font-mono flex items-center gap-1">
                <ShieldCheck size={12} /> Data Protected
              </span>
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-800/50 uppercase tracking-widest font-mono flex items-center gap-1">
                <Lock size={12} /> ORCID Linked
              </span>
            </div>

            {/* Social Media Connections (Clean Inline SVGs) */}
            <div className="pt-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                Academic & Social Network
              </div>
              <div className="flex items-center gap-3">
                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub Repository"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                {/* Twitter / X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter X Profile"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn Page"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                {/* ResearchGate */}
                <a
                  href="https://researchgate.net"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="ResearchGate Network"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm font-serif font-black text-xs"
                >
                  RG
                </a>
                {/* Google Scholar */}
                <a
                  href="https://scholar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Google Scholar Citations"
                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm"
                >
                  <GraduationCap size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Platform Apps — link to authenticated features, so only shown when signed in. */}
          {user && (
          <div className="lg:col-span-2 space-y-4">
            <h4 className="mono-academic font-black text-primary dark:text-slate-300 uppercase text-xs tracking-[0.2em]">
              Platform Apps
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/discovery" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <Search size={14} className="text-secondary dark:text-rose-300" /> Semantic Search
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <BookOpen size={14} className="text-primary dark:text-white" /> Q1/Q2 Library
                </Link>
              </li>
              <li>
                <Link href="/groups" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <Users size={14} className="text-accent-500" /> Lab Groups Mesh
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500" /> AI RAG Assistant
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-primary dark:hover:text-white transition-colors">
                  Research Forum
                </Link>
              </li>
              <li>
                <Link href="/researchers" className="hover:text-primary dark:hover:text-white transition-colors">
                  Expert Directory
                </Link>
              </li>
            </ul>
          </div>
          )}

          {/* Navigation Column 2: Resources & About */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="mono-academic font-black text-primary dark:text-slate-300 uppercase text-xs tracking-[0.2em]">
              Resources & Discourse
            </h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/about" className="hover:text-primary dark:hover:text-white transition-colors">
                  About & Manifesto
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary dark:hover:text-white transition-colors flex items-center gap-1.5">
                  The Chronicle (Blog)
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary dark:hover:text-white transition-colors">
                  Support Concierge
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary dark:hover:text-white transition-colors">
                  Institutional Pricing
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-primary dark:hover:text-white transition-colors">
                  System Architecture
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary dark:hover:text-white transition-colors">
                  Contact Department
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Newsletter & Legal */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="mono-academic font-black text-primary dark:text-slate-300 uppercase text-xs tracking-[0.2em]">
              Institutional Newsletter
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Weekly vector search findings, new Q1 publication alerts, and grant calls.
            </p>

            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={16} /> Subscribed to Academic Digest!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="prof@university.edu"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-white hover:bg-primary-600 transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2">
              <h5 className="mono-academic font-black text-slate-400 uppercase text-[10px] tracking-widest mb-3">
                Legal & Governance
              </h5>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Protocol</Link>
                <Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link>
                <Link href="/careers" className="hover:text-secondary transition-colors flex items-center gap-1">
                  Careers <span className="px-1.5 py-0.2 rounded bg-secondary/10 text-secondary dark:text-rose-300 text-[9px] font-bold uppercase">Hiring</span>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <p>© 2026 SmartResearch — ResearchBridge Ecosystem. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Systems Operational (99.98% Uptime)</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Globe size={13} className="text-slate-400" />
              <span>English (US) • Global Node</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
