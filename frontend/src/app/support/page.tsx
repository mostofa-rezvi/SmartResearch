"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Mail,
  MessageCircle,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  X,
  Send,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  LifeBuoy,
  BookOpen,
  Lock,
  Cpu,
  Users,
  GraduationCap
} from "lucide-react";

const supportCategories = [
  {
    icon: <ShieldCheck className="text-primary dark:text-white" size={24} />,
    title: "Verification & ORCID Sync",
    desc: "Institutional email validation, ORCID credential linking, and academic status upgrades."
  },
  {
    icon: <Users className="text-secondary dark:text-rose-300" size={24} />,
    title: "Lab Workspaces & Permissions",
    desc: "Managing private lab groups, member roles, dataset access controls, and Kanban boards."
  },
  {
    icon: <Search className="text-accent-600" size={24} />,
    title: "Semantic Literature Engine",
    desc: "Vector search queries, DOI lookups, Q1/Q2 journal tier filters, and citation graphs."
  },
  {
    icon: <Cpu className="text-emerald-600" size={24} />,
    title: "AI RAG Assistant & Export",
    desc: "Multi-page PDF key takeaway extraction, automated BibTeX, APA, IEEE citation exports."
  }
];

const faqs = [
  {
    category: "Verification",
    q: "How do I verify my institutional researcher status?",
    a: "Navigate to Profile Settings > Academic Verification and connect your institutional email address or link your ORCID iD. Verification is instant for standard university domains and takes 1-2 hours for specialized lab affiliations."
  },
  {
    category: "Security",
    q: "Are my lab group documents and unpublished raw data secure?",
    a: "Absolutely. All documents, draft LaTeX/Markdown papers, and raw research datasets are encrypted at rest (AES-256) and in transit (TLS 1.3). Your unpublished work is never indexed or used for third-party AI training."
  },
  {
    category: "Platform",
    q: "What is the vector similarity score in Semantic Search?",
    a: "Our vector similarity metric measures contextual agreement across high-dimensional paper embeddings. A 90%+ match indicates strong conceptual, methodological, or dataset overlap even when precise keywords differ."
  },
  {
    category: "Lab Mesh",
    q: "How can I invite external co-authors from another university to my Lab Workspace?",
    a: "In your Lab Workspace settings, click 'Invite Collaborator' and generate a secure single-use invitation link or send an invite directly to their institutional email address."
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketState, setTicketState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketState('sending');
    setTimeout(() => {
      setTicketState('sent');
      setTimeout(() => {
        setIsModalOpen(false);
        setTicketState('idle');
      }, 2500);
    }, 1200);
  };

  const filteredFaqs = searchQuery.trim() === ""
    ? faqs
    : faqs.filter(f =>
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">

          {/* Academic Support Header */}
          <header className="relative isolate mb-16 pt-6 pb-10 text-center max-w-4xl mx-auto">
            <HeroBackdrop tone="emerald" />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 text-xs font-bold uppercase tracking-widest mono-academic mb-6"
            >
              <LifeBuoy size={16} />
              <span>Research Support Concierge</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Dedicated Technical & <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Methodological Assistance
              </span>
            </motion.h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              Get immediate help with university verifications, lab permissions, semantic search queries, and RAG document exports.
            </p>

            {/* Instant Search Bar */}
            <div className="relative max-w-2xl mx-auto shadow-2xl rounded-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input
                type="text"
                placeholder="Search support articles, ORCID sync, DOI indexing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </header>

          {/* Photorealistic Support Concierge Hero Banner */}
          <section className="mb-24 relative">
            <div className="relative aspect-[21/9] min-h-[300px] rounded-[36px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-950 group grid grid-cols-1 md:grid-cols-12 items-center p-8 md:p-12">
              <Image
                src="/support_hero.png"
                alt="Research Support Concierge"
                fill
                priority
                className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />

              <div className="relative z-10 md:col-span-8 space-y-4 text-white">
                <span className="px-3 py-1 rounded-md bg-secondary text-white text-xs font-bold uppercase tracking-widest font-mono inline-block">
                  Priority Response
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-black leading-tight">
                  Need Personalized Help with Your Lab Setup?
                </h2>
                <p className="text-slate-300 text-base md:text-lg font-medium max-w-xl">
                  Our academic support team responds to verified institutional inquiries within 2 hours.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary py-3.5 px-8 rounded-xl font-bold inline-flex items-center gap-2"
                >
                  <Mail size={18} />
                  Open Concierge Support Ticket
                </button>
              </div>
            </div>
          </section>

          {/* Support Channels Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 text-center flex flex-col items-center hover:shadow-2xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary dark:text-primary-300 flex items-center justify-center mb-6">
                <Mail size={26} />
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-2">Priority Inbox</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Direct channel to our academic systems engineer. Guaranteed reply within 2-4 hours.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-600 transition-all shadow-lg"
              >
                Send Ticket
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 text-center flex flex-col items-center hover:shadow-2xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary dark:text-rose-300 flex items-center justify-center mb-6">
                <MessageCircle size={26} />
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-2">Researcher Community</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Ask domain-specific methodology questions in our open Q&A forum with 50,000+ peers.
              </p>
              <a
                href="/community"
                className="mt-auto px-6 py-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
              >
                Browse Forum
              </a>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 text-center flex flex-col items-center hover:shadow-2xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 text-accent-600 flex items-center justify-center mb-6">
                <FileText size={26} />
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-2">Knowledge Base</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Explore comprehensive guides on ORCID sync, vector search API, and LaTeX exports.
              </p>
              <a
                href="#faq"
                className="mt-auto px-6 py-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
              >
                View Articles
              </a>
            </div>
          </section>

          {/* Categorized Knowledge Base Topics */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">
                Explore Support Topics
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportCategories.map((cat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 hover:border-primary/40 transition-all text-left group"
                >
                  <div className="mb-4">{cat.icon}</div>
                  <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                    {cat.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive FAQ Section */}
          <section className="max-w-4xl mx-auto mb-24" id="faq">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 dark:text-white mb-4">
                Frequently Answered Questions
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base font-medium">
                Instant solutions for common institutional inquiry workflows.
              </p>
            </div>

            <div className="space-y-4">
              {filteredFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex justify-between items-center gap-4 font-bold text-lg text-slate-900 dark:text-white hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary dark:text-white text-xs font-mono font-bold">
                        {faq.category}
                      </span>
                      {faq.q}
                    </span>
                    <ChevronRight
                      size={20}
                      className={`transform transition-transform ${openFaq === i ? "rotate-90 text-primary dark:text-white" : "text-slate-400"}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 text-slate-600 dark:text-slate-300 leading-relaxed text-sm border-t border-slate-100 dark:border-white/5 pt-4 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Concierge Support Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              {ticketState === 'sent' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white">Ticket Submitted</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                    Your concierge inquiry has been assigned to an academic support engineer. You will receive a reply at your email address shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-1">Open Support Ticket</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Priority assistance for verified researchers & PIs.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="prof.name@university.edu"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Inquiry Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lab Group Permissions / ORCID Sync Issue"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                      Message Details
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe your methodological or technical request..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketState === 'sending'}
                    className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {ticketState === 'sending' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Ticket...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Priority Ticket
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
