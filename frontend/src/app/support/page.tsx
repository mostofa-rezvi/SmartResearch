"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, Mail, MessageCircle, FileText, ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const faqs = [
    { q: "How do I verify my institutional status?", a: "Go to your Profile Settings > Verification and upload a copy of your staff/student ID or use your institutional email address." },
    { q: "What is an Impact Score?", a: "Impact Score is a real-time metric based on how many researchers saved your papers, replied to your discussions, and cited your verified data." },
    { q: "How can I create a private Lab Group?", a: "Private groups are available for professional and institutional accounts. Click 'Create Group' in the Groups Hub and select 'Private'." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-16 text-center">
            <h1 className="text-5xl font-serif font-black text-primary dark:text-white mb-6">
               Support <span className="text-secondary italic">Desk</span>
            </h1>
            <p className="text-slate-500 text-lg">How can we help your research today?</p>
          </header>

          <div className="relative mb-20 max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder="Search help articles (e.g. 'verification', 'billing')..."
              className="w-full pl-16 pr-6 py-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl text-center group hover:border-primary transition-all">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    <Mail size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email Support</h3>
                <p className="text-sm text-slate-500 mb-6">Response within 24 hours.</p>
                <button className="text-primary font-bold text-sm">Send Ticket →</button>
            </div>
            
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl text-center group hover:border-secondary transition-all">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-6 group-hover:bg-secondary group-hover:text-white transition-all">
                    <MessageCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Live Chat</h3>
                <p className="text-sm text-slate-500 mb-6">Available 9am-5pm EST.</p>
                <button className="text-secondary font-bold text-sm">Start Chat →</button>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl text-center group hover:border-accent transition-all">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mx-auto mb-6 group-hover:bg-accent group-hover:text-white transition-all">
                    <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Knowledge Base</h3>
                <p className="text-sm text-slate-500 mb-6">Detailed documentation.</p>
                <button className="text-accent font-bold text-sm">Read Guides →</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-10 flex items-center gap-3">
                <HelpCircle className="text-primary" /> Popular Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="pb-6 border-b border-slate-50 dark:border-white/5 last:border-0 last:pb-0">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">{faq.q}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">{faq.a}</p>
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
