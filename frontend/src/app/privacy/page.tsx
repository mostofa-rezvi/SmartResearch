"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Eye className="text-blue-500" />,
      title: "What we collect",
      content: "We collect information you provide directly to us: name, institutional affiliation, research interests, and profile data. We also collect usage data (papers read, posts made) to improve your discovery engine."
    },
    {
      icon: <Lock className="text-secondary" />,
      title: "How we protect it",
      content: "Your data is encrypted at rest and in transit. Private lab spaces use end-to-end encryption for dataset sharing. We conduct regular security audits and penetration testing."
    },
    {
      icon: <Server className="text-amber-500" />,
      title: "Data Sovereignty",
      content: "You own your research data. You can export or delete your personal data at any time. We will never sell your research findings or personal information to third parties."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-20 text-center">
             <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield size={32} />
             </div>
             <h1 className="text-5xl font-serif font-black text-primary dark:text-white mb-4">Privacy <span className="text-emerald-600 italic">Protocol</span></h1>
             <p className="text-slate-500 font-medium">Last updated: May 15, 2026</p>
          </header>

          <div className="space-y-16 mb-24">
            {sections.map((s, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{s.title}</h3>
                  <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    {s.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-white/5">
             <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Compliance Standards</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['GDPR', 'CCPA', 'HIPAA', 'FERPA'].map(std => (
                   <div key={std} className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center font-black text-xs tracking-widest text-slate-400 border border-slate-100 dark:border-white/5 uppercase">
                      {std} Ready
                   </div>
                ))}
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
