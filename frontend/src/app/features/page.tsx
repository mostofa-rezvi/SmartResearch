"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

import { Search, Users, Zap, ShieldCheck, Globe, Lightbulb, Database, Award, MessageSquare } from "lucide-react";

export default function FeaturesPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const features = [
    {
      icon: <Search className="text-primary" />,
      title: "AI-Powered Discovery",
      description: "Our semantic search engine goes beyond keywords. It understands scientific context, methodology, and citations to find exactly what you need.",
      detail: "Supports LaTeX search, formula matching, and cross-language paper discovery."
    },
    {
      icon: <Users className="text-blue-500" />,
      title: "Dynamic Lab Spaces",
      description: "Create private or public rooms for your research team. Share live dashboards, datasets, and synchronized LaTeX editors.",
      detail: "Granular permission sets, member analytics, and real-time activity feeds."
    },
    {
      icon: <Database className="text-amber-500" />,
      title: "Immutable Data Storage",
      description: "Store your research data with blockchain-verified integrity. Every change is logged and cryptographically signed.",
      detail: "Petabyte-scale storage, automatic versioning, and secure data sharing protocols."
    },
    {
      icon: <Globe className="text-indigo-500" />,
      title: "Global Peer Network",
      description: "Connect with verified researchers globally. Find mentors, co-authors, or expert reviewers in your specific niche.",
      detail: "Verified researcher badges, influence scoring, and intelligent matchmaking."
    },
    {
      icon: <ShieldCheck className="text-emerald-500" />,
      title: "Ethical Compliance Tooling",
      description: "Built-in tools to ensure your research meets global ethical standards and data privacy regulations like GDPR.",
      detail: "Automatic anonymization, consent management, and audit trailing."
    },
    {
      icon: <Award className="text-purple-500" />,
      title: "Open Access Publishing",
      description: "Publish your findings directly to the platform. Get cited faster and reach a wider audience without the paywalls.",
      detail: "Integrated DOI generation, impact tracking, and altmetrics integration."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-24"
          >
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
              Powerful Tools for <br />
              <span className="text-primary">Serious Researchers</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
              ResearchBridge provides a unified ecosystem that handles everything from 
              data collection and team management to global distribution.
            </p>
          </motion.div>

          <div className="space-y-32">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-20 items-center`}
              >
                <div className="flex-1 w-full">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-primary/10 rounded-[32px] blur-2xl group-hover:bg-primary/20 transition-all duration-500 opacity-0 group-hover:opacity-100" />
                    <div className="relative aspect-video rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center p-12">
                      <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        {f.icon}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm font-bold text-primary uppercase tracking-widest">Feature {i + 1}</span>
                    <div className="h-px w-12 bg-primary/20" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">{f.title}</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    {f.description}
                  </p>
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-tight">Technical Detail</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{f.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-40 p-12 md:p-20 rounded-[48px] bg-slate-900 text-white text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">Integrate with Your Lab</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">
              ResearchBridge plays well with others. Connect with Overleaf, GitHub, Zotero, and more.
            </p>
            <button className="bg-primary text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 relative z-10">
              Get Started with Integrations
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
