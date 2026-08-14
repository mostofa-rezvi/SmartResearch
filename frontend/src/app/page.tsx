"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useAppRouter } from "@/lib/useAppRouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Search,
  Users,
  Lightbulb,
  ShieldCheck,
  Globe,
  Zap,
  Quote,
  BookOpen,
  Sparkles,
  Cpu,
  FileText,
  Layers,
  Compass,
  Share2,
  ChevronRight,
  HelpCircle,
  Database,
  BarChart3,
  Award,
  Lock
} from "lucide-react";
import dynamic from "next/dynamic";

const CitationGraphExplorer = dynamic(
  () => import("@/components/landing/CitationGraphExplorer"),
  {
    loading: () => (
      <div className="py-24 max-w-7xl mx-auto rounded-[40px] bg-slate-900/40 animate-pulse h-96 my-16 border border-white/10" />
    )
  }
);

const CitationExporterStudio = dynamic(
  () => import("@/components/landing/CitationExporterStudio"),
  {
    loading: () => (
      <div className="py-20 max-w-7xl mx-auto rounded-3xl bg-slate-800/20 animate-pulse h-80 my-12" />
    )
  }
);

const VirtualLabCoAuthoring = dynamic(
  () => import("@/components/landing/VirtualLabCoAuthoring"),
  {
    loading: () => (
      <div className="py-20 max-w-7xl mx-auto rounded-[36px] bg-slate-800/20 animate-pulse h-96 my-12" />
    )
  }
);

const JournalQuartileMeter = dynamic(
  () => import("@/components/landing/JournalQuartileMeter"),
  {
    loading: () => (
      <div className="py-20 max-w-7xl mx-auto rounded-3xl bg-slate-800/20 animate-pulse h-80 my-12" />
    )
  }
);

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useAppRouter();
  const [activeTab, setActiveTab] = useState<"discovery" | "lab" | "assistant" | "community">("discovery");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="italic text-slate-500 dark:text-slate-400 animate-pulse font-serif">Initializing research universe...</p>
        </div>
      </div>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const tabServices = {
    discovery: {
      label: "Semantic Discovery",
      title: "AI-Powered Semantic Literature & DOI Search",
      subtitle: "Discover deep context beyond keywords",
      desc: "Instantly query millions of peer-reviewed papers with context-aware semantic search. Automatically filter by Q1/Q2 journal impact metrics, index citations into interactive knowledge graphs, and extract core findings.",
      image: "/feature_semantic.png",
      bullets: [
        "Semantic similarity vector matching across 12M+ publications",
        "Q1 & Q2 Journal Tier filtering with verified impact metrics",
        "Interactive citation graph visualization & DOI lookup engine"
      ]
    },
    lab: {
      label: "Lab Workspaces",
      title: "Real-time Collaborative Lab Workspaces",
      subtitle: "Unify student researchers & senior professors",
      desc: "Break down departmental boundaries with unified virtual research labs. Manage research project Kanbans, co-author LaTeX/Markdown documents in real-time, and securely archive raw research datasets.",
      image: "/feature_lab.png",
      bullets: [
        "Real-time multi-user document co-editing & version history",
        "Integrated Lab Kanban boards & milestone task tracking",
        "Granular access controls & encrypted dataset repositories"
      ]
    },
    assistant: {
      label: "AI Assistant",
      title: "RAG-Powered AI Research Assistant",
      subtitle: "Your 24/7 intelligent scientific companion",
      desc: "Ask complex methodological questions, summarize lengthy 50-page PDFs into key bullet points in seconds, and automatically generate citations formatted in BibTeX, APA, IEEE, or Chicago styles.",
      image: "/feature_ai.png",
      bullets: [
        "Retrieval-Augmented Generation (RAG) trained on academic papers",
        "Instant multi-page PDF key takeaway & methodology extraction",
        "Automated multi-format citation & reference export"
      ]
    },
    community: {
      label: "Researcher Network",
      title: "Global Researcher Directory & Peer Mentorship",
      subtitle: "Escape academic isolation through active connection",
      desc: "Connect directly with leading domain experts, seek academic peer reviews, participate in domain-specific Q&A exchanges, and find mentorship opportunities across international universities.",
      image: "/hero_real_dashboard.png",
      bullets: [
        "Verified academic credentials & university affiliation badges",
        "Direct peer review & cross-institutional collaboration invites",
        "Specialized discipline streams (Biotech, Quantum Physics, AI, etc.)"
      ]
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-primary/20">
      <Navbar />

      <main className="pt-20">
        {/* Full-Width 2-Column Hero Section */}
        <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center px-6 py-12 md:py-20 overflow-hidden bg-gradient-to-br from-[#0A192F] via-[#12294B] to-[#0A192F] text-white">
          {/* Background Ambient Spotlights & Grid */}
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-secondary/30 via-accent/25 to-primary-300/30 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse" />

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headline, Subtitle, Live Search & CTAs */}
              <div className="lg:col-span-6 space-y-8 text-left">
                {/* Live Indicator Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/25 shadow-xl text-white text-xs md:text-sm font-bold uppercase tracking-wider mono-academic"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                  </span>
                  <span>SmartResearch — Unified Academic Network</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] font-serif"
                >
                  Unifying Global Science. <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-200 via-secondary-300 to-amber-400">
                    Accelerating Discovery.
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-lg md:text-xl text-primary-100 leading-relaxed font-medium max-w-xl"
                >
                  Escaping academic isolation with intelligent semantic literature search, real-time lab collaboration, and RAG-powered AI document synthesis.
                </motion.p>

                {/* Hero Interactive Literature Search Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/30 shadow-2xl max-w-xl"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      router.push('/discovery');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Search className="text-secondary-300 ml-3 shrink-0" size={20} />
                    <input
                      type="text"
                      placeholder="Search 12.4M+ papers, DOIs, hypotheses..."
                      className="w-full bg-transparent px-2 py-3 text-white placeholder-primary-200 focus:outline-none font-medium text-sm"
                    />
                    <button
                      type="submit"
                      className="skeuo-button-secondary text-white px-5 py-3 rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5"
                    >
                      Search Literature <ArrowRight size={14} />
                    </button>
                  </form>
                </motion.div>

                {/* Call to Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
                >
                  <Link
                    href="/register"
                    className="group skeuo-button-primary text-white px-7 py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 shadow-xl border border-white/20"
                  >
                    Create Free Researcher Account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/discovery"
                    className="bg-white/15 hover:bg-white/25 text-white px-7 py-3.5 rounded-2xl text-base font-bold border border-white/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Search size={18} className="text-amber-400" />
                    Explore Engine
                  </Link>
                </motion.div>

                {/* Micro Stats Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-6 text-xs font-mono font-bold text-primary-100">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-400" /> 12.4M+ Papers Indexed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap size={15} className="text-secondary-300" /> 99.4% Vector Accuracy
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={15} className="text-amber-400" /> 3,200+ Active Labs
                  </span>
                </div>
              </div>

              {/* Right Column: ResearchBridge Bespoke Hero Image Showcase */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.3 }}
                className="lg:col-span-6 relative"
              >
                <div className="relative group rounded-[32px] p-2 bg-white/10 backdrop-blur-xl shadow-2xl border border-white/30">
                  
                  {/* Floating Stat Badge Left Top */}
                  <div className="hidden sm:flex absolute -left-8 top-8 z-20 bg-[#0A192F]/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl items-center gap-3 animate-bounce-gentle border border-white/30">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold border border-emerald-500/40">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-primary-200 font-bold uppercase tracking-wider">Semantic Vector Match</div>
                      <div className="text-xs font-black text-white">99.4% Accuracy</div>
                    </div>
                  </div>

                  {/* Floating Stat Badge Right Bottom */}
                  <div className="hidden sm:flex absolute -right-8 bottom-10 z-20 bg-[#0A192F]/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl items-center gap-3 animate-bounce-gentle border border-white/30" style={{ animationDelay: '1s' }}>
                    <div className="w-9 h-9 rounded-xl bg-secondary/30 text-secondary-200 flex items-center justify-center font-bold border border-secondary/50">
                      <Zap size={18} />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-primary-200 font-bold uppercase tracking-wider">Virtual Lab Mesh</div>
                      <div className="text-xs font-black text-white">Real-Time Co-Authoring</div>
                    </div>
                  </div>

                  {/* Bespoke ResearchBridge Hero Mesh Image */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-[#0A192F]">
                    <Image
                      src="/researchbridge_hero_mesh.png"
                      alt="ResearchBridge Realistic Dashboard Interface"
                      width={1200}
                      height={750}
                      priority
                      className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Global Academic Institutional Trust Bar */}
        <section className="py-16 bg-slate-50/80 dark:bg-white/[0.02] border-y border-slate-200/60 dark:border-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mb-10 mono-academic">
              Trusted by Researchers & Labs Worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
              {[
                { name: "MIT", loc: "Cambridge, MA", field: "AI & Quantum" },
                { name: "Stanford", loc: "Stanford, CA", field: "Bioengineering" },
                { name: "CERN", loc: "Geneva, CH", field: "Particle Physics" },
                { name: "Oxford", loc: "Oxford, UK", field: "Genomics" },
                { name: "Harvard", loc: "Boston, MA", field: "Medicine" },
                { name: "Max Planck", loc: "Munich, DE", field: "Astrophysics" }
              ].map((inst) => (
                <div
                  key={inst.name}
                  className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
                >
                  <Globe size={16} className="text-secondary dark:text-rose-300 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="text-left">
                    <div className="font-serif font-black text-slate-900 dark:text-slate-100 text-base">{inst.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-tight">{inst.field} • {inst.loc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System Architecture & Comprehensive Services Breakdown */}
        <section className="py-32 px-6 max-w-7xl mx-auto" id="services">
          <div className="text-center mb-16">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 text-xs font-bold uppercase tracking-widest mono-academic mb-4 inline-block">
              Comprehensive Platform Capabilities
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 font-serif">
              Everything Your Research Lab Demands
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-3xl mx-auto font-medium">
              Explore how SmartResearch integrates every phase of scientific inquiry into one intuitive digital workspace.
            </p>
          </div>

          {/* Interactive Service Tabs */}
          <div className="flex justify-center flex-wrap gap-3 mb-12">
            {[
              { id: "discovery", label: "Semantic Discovery", icon: <Search size={16} /> },
              { id: "lab", label: "Lab Workspaces", icon: <Users size={16} /> },
              { id: "assistant", label: "AI RAG Assistant", icon: <Cpu size={16} /> },
              { id: "community", label: "Researcher Network", icon: <Globe size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-xl shadow-primary/25 scale-105"
                    : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Service Detail Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center glass-skeuo-card p-8 md:p-12 rounded-[36px] border border-white/40 dark:border-white/10 shadow-2xl"
            >
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-secondary/10 text-secondary dark:text-rose-300 text-xs font-bold uppercase tracking-wider font-mono">
                  <Sparkles size={14} />
                  <span>{tabServices[activeTab].subtitle}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-serif leading-tight">
                  {tabServices[activeTab].title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-medium">
                  {tabServices[activeTab].desc}
                </p>

                <div className="space-y-3 pt-2">
                  {tabServices[activeTab].bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-800 dark:text-slate-200 font-semibold text-sm">
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 btn btn-primary py-3.5 px-6 rounded-xl font-bold"
                  >
                    Experience {tabServices[activeTab].label}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-950 group">
                <Image
                  src={tabServices[activeTab].image}
                  alt={tabServices[activeTab].title}
                  width={900}
                  height={550}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Lazy Loaded Feature 1: Citation Graph Topology */}
        <CitationGraphExplorer />

        {/* Lazy Loaded Feature 2: Real-time Collaborative Manuscript Studio */}
        <VirtualLabCoAuthoring />

        {/* Lazy Loaded Feature 3: Q1 & Q2 Journal Directory */}
        <JournalQuartileMeter />

        {/* Lazy Loaded Feature 4: Universal Citation Exporter Studio */}
        <CitationExporterStudio />

        {/* Live Step-by-Step Workflow Journey */}
        <section className="py-32 px-6 bg-primary-900 text-white rounded-[40px] md:rounded-[60px] mx-4 md:mx-8 mb-32 relative overflow-hidden">
          <div className="absolute inset-0 -z-0 bg-grid opacity-[0.12] pointer-events-none" />
          <div className="absolute top-0 right-0 w-[650px] h-[650px] bg-accent/10 rounded-full blur-[140px] -z-0" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-widest mono-academic mb-4 inline-block">
                The End-to-End Workflow
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6 font-serif">How SmartResearch Works</h2>
              <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-light">From initial question to published paper in 4 seamless steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", icon: <Search />, title: "Semantic Query", desc: "Submit natural language queries to search millions of papers with full vector context." },
                { step: "02", icon: <Cpu />, title: "RAG Synthesis", desc: "Let our AI assistant extract methodologies, datasets, and summaries instantly." },
                { step: "03", icon: <Users />, title: "Lab Co-Authoring", desc: "Collaborate in real-time with lab peers on LaTeX/Markdown drafts and datasets." },
                { step: "04", icon: <Award />, title: "Q1/Q2 Publishing", desc: "Target top journal tiers and publish verified breakthroughs with full citation tracking." }
              ].map((s, i) => (
                <div key={i} className="relative bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 flex flex-col group hover:bg-white/10 transition-all">
                  <div className="text-6xl font-serif font-black text-white/10 absolute top-6 right-6 select-none">{s.step}</div>
                  <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center text-xl font-bold mb-8 shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-serif">{s.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Metrics / Platform Analytics */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: "12.4M+", label: "Peer-Reviewed Papers Indexed", tone: "text-primary dark:text-white" },
              { stat: "99.4%", label: "Semantic Search Accuracy", tone: "text-secondary dark:text-rose-300" },
              { stat: "50,000+", label: "Active Researchers & Labs", tone: "text-accent-500" },
              { stat: "< 2s", label: "Average Vector Query Latency", tone: "text-emerald-500" }
            ].map((m, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-center">
                <div className={`text-4xl md:text-5xl font-serif font-black mb-2 ${m.tone}`}>{m.stat}</div>
                <div className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* System Architecture FAQ Accordion */}
        <section className="py-24 px-6 max-w-4xl mx-auto" id="faq">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-serif">Frequently Asked Questions</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Everything you need to know about the SmartResearch ecosystem.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the Semantic Literature Search differ from Google Scholar?",
                a: "Unlike keyword matching, SmartResearch converts academic papers into high-dimensional vector embeddings. It understands complex research hypotheses, methodologies, and technical context to deliver precise paper recommendations even when exact keywords differ."
              },
              {
                q: "Is my lab data secure and private?",
                a: "Yes. All lab group files, real-time draft co-authoring documents, and research datasets are encrypted end-to-end. Your raw data is never exposed publicly or used to train third-party models."
              },
              {
                q: "How does the RAG AI Assistant work with my PDFs?",
                a: "When you upload a PDF or select indexed papers, our Retrieval-Augmented Generation engine parses the document structure. You can ask for summary takeaways, methodology comparisons, or automated citation generation in seconds."
              },
              {
                q: "Can students and professors collaborate across different universities?",
                a: "Absolutely. SmartResearch is built to eliminate academic isolation. You can invite collaborators via direct invitation links or search researchers by domain expertise to co-author papers and manage joint projects."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 font-bold text-lg text-slate-900 dark:text-white hover:text-primary dark:hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    size={20}
                    className={`transform transition-transform ${activeFaq === i ? "rotate-90 text-primary dark:text-white" : "text-slate-400"}`}
                  />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 dark:text-slate-300 leading-relaxed text-base border-t border-slate-100 dark:border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="relative bg-primary rounded-[48px] p-12 md:p-24 text-center overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 font-serif">Ready to Accelerate Your Science?</h2>
              <p className="text-white/80 text-lg md:text-xl mb-12 font-medium">
                Join thousands of researchers breaking through academic barriers with SmartResearch.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/register"
                  className="bg-white text-primary px-10 py-4.5 rounded-2xl text-lg font-bold hover:bg-slate-100 transition-all shadow-2xl overflow-hidden group"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/discovery"
                  className="bg-primary-700/60 backdrop-blur-md text-white border border-white/20 px-10 py-4.5 rounded-2xl text-lg font-bold hover:bg-primary-700/80 transition-all"
                >
                  Try Discovery Search
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
