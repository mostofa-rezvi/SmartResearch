"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Award,
  Globe,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  FileText,
  Sparkles,
  Lock,
  Compass,
  Cpu,
  GraduationCap
} from "lucide-react";

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* Academic Manifesto Hero Section */}
          <section className="relative isolate mb-24 pt-6 pb-10 text-center max-w-5xl mx-auto">
            <HeroBackdrop tone="primary" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-200 text-xs md:text-sm font-bold mb-8 uppercase tracking-widest mono-academic"
            >
              <GraduationCap size={16} />
              <span>Academic Vision & Institutional Manifesto</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white mb-8 leading-[1.08] font-serif tracking-tight"
            >
              Democratizing Global Science. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Bridging Student to Professor.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-4xl mx-auto"
            >
              Founded with a singular commitment: eliminating academic isolation and friction in scientific inquiry.
              SmartResearch unifies literature discovery, real-time lab collaboration, and peer mentorship into an authoritative, open, and AI-augmented scientific ecosystem.
            </motion.p>
          </section>

          {/* Photorealistic Lab Showcase Banner */}
          <section className="mb-28 relative">
            <div className="relative aspect-[21/9] min-h-[340px] rounded-[36px] md:rounded-[48px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-950 group">
              <Image
                src="/about_lab.png"
                alt="ResearchBridge Academic Laboratory"
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10">
                <div>
                  <span className="px-3 py-1 rounded-md bg-secondary text-white text-xs font-bold uppercase tracking-widest font-mono mb-3 inline-block">
                    The Modern Research Lab
                  </span>
                  <h2 className="text-2xl md:text-4xl font-serif font-black text-white leading-tight">
                    Where Curiosity Meets Rigorous Proof.
                  </h2>
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold font-mono">
                    DOI Verified
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold font-mono">
                    ORCID Integrated
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Academic Metrics */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-32">
            {[
              { label: "Active Researchers", value: "50,000+", note: "Across 140+ Universities" },
              { label: "Indexed Publications", value: "12.4M+", note: "With Q1/Q2 Impact Tiers" },
              { label: "Citations Tracked", value: "25.0M+", note: "Real-time Vector Lineage" },
              { label: "Virtual Lab Mesh", value: "3,200+", note: "Active Lab Workspaces" }
            ].map((stat, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl glass-skeuo-card border border-white/40 dark:border-white/10 text-center hover:border-primary/40 transition-all shadow-lg"
              >
                <div className="text-4xl md:text-5xl font-black font-serif text-primary dark:text-primary-300 mb-2">{stat.value}</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{stat.note}</div>
              </div>
            ))}
          </section>

          {/* Academic Core Pillars */}
          <section className="mb-32">
            <div className="text-center mb-16">
              <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary dark:text-rose-300 text-xs font-bold uppercase tracking-widest mono-academic mb-4 inline-block">
                Our Institutional Pillars
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-serif mb-4">
                Principles of Scientific Integrity
              </h2>
              <div className="w-24 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <ShieldCheck size={28} className="text-primary dark:text-white" />,
                  title: "Radical Openness & Reproducibility",
                  desc: "We believe scientific progress depends on transparent data, open methodologies, and verifiable citations. Our platform provides immutable lineage tracking for papers and research datasets."
                },
                {
                  icon: <Zap size={28} className="text-secondary dark:text-rose-300" />,
                  title: "Velocity Without Sacrificing Rigor",
                  desc: "By removing friction in literature discovery and lab administrative tasks, researchers gain hundreds of hours back for deep hypothesis formulation and peer-reviewed publication."
                },
                {
                  icon: <Globe size={28} className="text-accent-500" />,
                  title: "Cross-Disciplinary Unity",
                  desc: "Scientific breakthroughs increasingly occur at the intersection of disciplines. SmartResearch bridges students, postdocs, and senior PIs across chemistry, AI, medicine, and physics."
                }
              ].map((v, i) => (
                <div
                  key={i}
                  className="p-10 rounded-3xl glass-skeuo-card border border-white/40 dark:border-white/10 hover:shadow-2xl transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                    {v.icon}
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-4">{v.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base font-medium">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Academic Vision & Manifesto Banner */}
          <section className="mb-32 relative bg-primary-900 text-white rounded-[40px] md:rounded-[48px] overflow-hidden shadow-2xl p-8 md:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/20 text-accent font-mono text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={14} />
                  <span>The Academic Manifesto</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-serif leading-tight">
                  Addressing the Reproducibility & Silo Crisis in Higher Education.
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed font-light">
                  Traditional academia suffers from fragmented tools: static PDFs locked behind paywalls, disconnected lab spreadsheets, and isolated communication channels.
                </p>
                <p className="text-slate-300 text-lg leading-relaxed font-light">
                  SmartResearch introduces a unified vector layer over academic literature, granting researchers instant context while honoring the sanctity of peer-review standards.
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="btn btn-primary py-3.5 px-8 rounded-xl font-bold inline-flex items-center gap-2"
                  >
                    Join the Academic Network
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/about_vision.png"
                  alt="Academic Keynote Conference"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* Scientific Leadership & Advisory Board */}
          <section className="mb-24 text-center">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 text-xs font-bold uppercase tracking-widest mono-academic mb-4 inline-block">
              Scientific Leadership
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-serif mb-4">
              Guided by Experienced Researchers & PIs
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-16 text-lg font-medium">
              Engineered by scientists, professors, and machine learning engineers committed to open academic progress.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  name: "Dr. Elena Rossi, PhD",
                  role: "Director of Research & Founder",
                  affiliation: "ex-CERN Fellow, Quantum Informatics",
                  pubs: "45+ Q1 Publications",
                  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
                },
                {
                  name: "Prof. Marcus Vance, PhD",
                  role: "Chief Academic Officer",
                  affiliation: "Professor of Bioinformatics, MIT",
                  pubs: "80+ Citations Tracked",
                  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600"
                },
                {
                  name: "Dr. Satoshi Tanaka, PhD",
                  role: "Head of AI & Vector Search",
                  affiliation: "NLP Lead Scientist, ex-Stanford AI Lab",
                  pubs: "Vector RAG Patent Holder",
                  image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
                },
                {
                  name: "Prof. Sarah Jenkins, PhD",
                  role: "Chair of Open Data Governance",
                  affiliation: "Department Chair, Oxford University",
                  pubs: "Editorial Board, Q1 Journals",
                  image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600"
                }
              ].map((m, i) => (
                <div
                  key={i}
                  className="group bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 hover:shadow-xl transition-all text-left"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-5 border border-slate-200 dark:border-white/10">
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="font-serif font-black text-xl text-slate-900 dark:text-white mb-1">{m.name}</h4>
                  <div className="text-xs font-bold text-primary dark:text-primary-300 uppercase tracking-wider mb-2 font-mono">{m.role}</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{m.affiliation}</p>
                  <div className="inline-block px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                    {m.pubs}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Academic Governance Standards */}
          <section className="py-12 border-t border-slate-200 dark:border-white/10 text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 mb-8">
              Compliant with International Academic & Data Privacy Standards
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">ORCID ID Authentication</span>
              <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">Crossref DOI Schema</span>
              <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">GDPR & FERPA Data Compliance</span>
              <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">Open Access Initiative (OAI-PMH)</span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
