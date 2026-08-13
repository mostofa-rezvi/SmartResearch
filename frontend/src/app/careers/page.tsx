"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Briefcase,
  MapPin,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
  Send,
  X,
  HeartHandshake
} from "lucide-react";

const positions = [
  {
    id: 1,
    title: "Senior AI Research & Vector Engineer",
    department: "Engineering",
    location: "Remote / San Francisco",
    type: "Full-time",
    exp: "5+ Years",
    desc: "Build next-generation high-dimensional vector embeddings, RAG pipelines, and sub-second citation graph search engines across millions of papers."
  },
  {
    id: 2,
    title: "Principal Distributed Systems Architect",
    department: "Infrastructure",
    location: "Remote / London",
    type: "Full-time",
    exp: "7+ Years",
    desc: "Design real-time multi-user LaTeX/Markdown document co-authoring engines and encrypted lab dataset storage repositories."
  },
  {
    id: 3,
    title: "Scientific UX & Interface Designer",
    department: "Design",
    location: "Remote / New York",
    type: "Full-time",
    exp: "4+ Years",
    desc: "Craft state-of-the-art academic UI/UX interfaces that reduce friction for university professors, PhD candidates, and research labs."
  },
  {
    id: 4,
    title: "Academic Relations & Institutional Lead",
    department: "Partnerships",
    location: "Remote / Global",
    type: "Full-time",
    exp: "3+ Years",
    desc: "Lead university department outreach, ORCID/Crossref integrations, and institutional licensing for top global research centers."
  },
  {
    id: 5,
    title: "Lead Data Security & Compliance Engineer",
    department: "Security",
    location: "Remote / Zurich",
    type: "Full-time",
    exp: "5+ Years",
    desc: "Ensure zero-knowledge encryption, FERPA/GDPR compliance, and end-to-end dataset security across all virtual lab mesh workspaces."
  }
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<typeof positions[0] | null>(null);
  const [appState, setAppState] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setAppState('submitting');
    setTimeout(() => {
      setAppState('submitted');
      setTimeout(() => {
        setSelectedJob(null);
        setAppState('idle');
      }, 2500);
    }, 1200);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Careers Hero Header */}
          <header className="relative isolate mb-20 pt-6 pb-10 text-center max-w-4xl mx-auto">
            <HeroBackdrop tone="secondary" />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 text-xs font-bold uppercase tracking-widest mono-academic mb-6"
            >
              <Briefcase size={16} />
              <span>Shape the Future of Global Inquiry</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Build the Infrastructure for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                The Next Scientific Century
              </span>
            </motion.h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
              We are a team of computer scientists, researchers, and designers building tools that eliminate academic silos and accelerate human discovery.
            </p>
          </header>

          {/* Photorealistic Team Showcase Banner */}
          <section className="mb-24 relative">
            <div className="relative aspect-[21/9] min-h-[320px] rounded-[36px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-950 group grid grid-cols-1 md:grid-cols-12 items-center p-8 md:p-12">
              <Image
                src="/careers_hero.png"
                alt="SmartResearch Team Workspace"
                fill
                priority
                className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />

              <div className="relative z-10 md:col-span-8 space-y-4 text-white">
                <span className="px-3 py-1 rounded-md bg-secondary text-white text-xs font-bold uppercase tracking-widest font-mono inline-block">
                  Remote-First Global Team
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-black leading-tight">
                  Work on Hard Problems with Worldwide Impact.
                </h2>
                <p className="text-slate-300 text-base md:text-lg font-medium max-w-xl">
                  Join researchers and engineers from 15+ countries solving vector search, real-time collaboration, and data sovereignty.
                </p>
              </div>
            </div>
          </section>

          {/* Perks & Benefits Grid */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">
                Why Build With SmartResearch?
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Globe className="text-primary dark:text-white" size={28} />,
                  title: "100% Remote-First Autonomy",
                  desc: "Work from anywhere in the world with flexible asynchronous hours, generous home office stipends, and global co-working passes."
                },
                {
                  icon: <Zap className="text-secondary dark:text-rose-300" size={28} />,
                  title: "Open-Access Research Budget",
                  desc: "Every team member gets a monthly $1,000 personal budget to sponsor open-access academic publications, grants, and conference travel."
                },
                {
                  icon: <HeartHandshake className="text-accent-500" size={28} />,
                  title: "Comprehensive Health & Equity",
                  desc: "Top-tier global medical insurance, competitive equity packages, 401(k) matching, and 5 weeks of annual paid leave."
                }
              ].map((p, i) => (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 hover:shadow-2xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 shadow-sm">
                    {p.icon}
                  </div>
                  <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white mb-3">{p.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Open Positions List */}
          <section className="mb-24">
            <div className="flex justify-between items-end mb-12 border-b border-slate-200 dark:border-white/10 pb-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-primary dark:text-white font-bold">Current Opportunities</span>
                <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mt-1">
                  Open Positions ({positions.length})
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {positions.map((job) => (
                <div
                  key={job.id}
                  className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 hover:border-primary/40 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-md bg-primary/10 text-primary dark:text-primary-200 text-xs font-mono font-bold uppercase">
                        {job.department}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{job.exp}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-white transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl font-medium">
                      {job.desc}
                    </p>
                    <div className="flex gap-4 text-xs font-bold text-slate-400 pt-1 font-mono">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Briefcase size={14} /> {job.type}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
                  >
                    Apply Now <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Application Form Drawer / Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              {appState === 'submitted' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white">Application Received</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                    Thank you for applying for the {selectedJob.title} position. Our engineering leadership team will review your application and respond shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-5">
                  <div>
                    <span className="text-xs font-mono font-bold text-primary dark:text-white uppercase">{selectedJob.department}</span>
                    <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-1">
                      Apply for {selectedJob.title}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Alex Vance"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@university.edu"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      LinkedIn / GitHub / Google Scholar URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/yourhandle"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Cover Note / Relevant Research Work
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about your background in vector search, RAG pipelines, or academic platforms..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={appState === 'submitting'}
                    className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {appState === 'submitting' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
