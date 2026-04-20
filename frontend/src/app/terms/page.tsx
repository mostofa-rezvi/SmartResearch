"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Gavel, CheckCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing ResearchBridge, you agree to be bound by these terms. If you are using the platform on behalf of an institution, that institution also agrees to these terms."
    },
    {
      title: "2. Researcher Conduct",
      content: "You are responsible for all activity on your account. You must be a human, at least 13 years of age, and provide accurate academic credentials during verification."
    },
    {
      title: "3. Intellectual Property",
      content: "You retain all rights to your research. By posting public content, you grant ResearchBridge a non-exclusive license to display it for discovery purposes."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-20 text-center">
             <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gavel size={32} />
             </div>
             <h1 className="text-5xl font-serif font-black text-primary dark:text-white mb-4">Terms of <span className="text-blue-600 italic">Service</span></h1>
             <p className="text-slate-500 font-medium italic">"Governing the bridge between theory and breakthrough."</p>
          </header>

          <div className="space-y-12 mb-24">
            {sections.map((s, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">{s.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center text-slate-400 text-sm italic">
            <p>Questions about our terms? <Link href="/contact" className="text-primary underline">Contact Legal</Link></p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import Link from "next/link";
