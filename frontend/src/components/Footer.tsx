"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#020617] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-serif font-black shadow-lg shadow-primary/20">RB</div>
              <span className="text-2xl font-serif font-black text-primary dark:text-white">ResearchBridge</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed italic font-medium">
              "Unifying Global Knowledge from Student to Professor. Escaping academic isolation through structured discovery."
            </p>
            <div className="flex gap-4">
               <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded border border-emerald-100 dark:border-emerald-800 uppercase tracking-widest">Email Verified</div>
               <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded border border-blue-100 dark:border-blue-800 uppercase tracking-widest">Data Protected</div>
            </div>
          </div>
          
          <div>
            <h4 className="mono-academic font-black text-primary dark:text-slate-400 mb-8 uppercase text-xs tracking-[0.2em]">The Library</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><Link href="/library?tier=Q1" className="hover:text-secondary transition-colors">Q1 Publications</Link></li>
              <li><Link href="/library?tier=Q2" className="hover:text-secondary transition-colors">Q2 Publications</Link></li>
              <li><Link href="/library" className="hover:text-secondary transition-colors">Journal Directory</Link></li>
              <li><Link href="/onboarding" className="hover:text-secondary transition-colors">Calibration Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mono-academic font-black text-primary dark:text-slate-400 mb-8 uppercase text-xs tracking-[0.2em]">The Living Room</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><Link href="/community" className="hover:text-secondary transition-colors">Methodology Feed</Link></li>
              <li><Link href="/groups" className="hover:text-secondary transition-colors">Private Lab Groups</Link></li>
              <li><Link href="/community?filter=thought" className="hover:text-secondary transition-colors">Knowledge Streams</Link></li>
              <li><Link href="/community?filter=question" className="hover:text-secondary transition-colors">Q&A Exchange</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mono-academic font-black text-primary dark:text-slate-400 mb-8 uppercase text-xs tracking-[0.2em]">The Discovery Engine</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <li><Link href="/discovery" className="hover:text-secondary transition-colors">Semantic Search</Link></li>
              <li><Link href="/search" className="hover:text-secondary transition-colors">DOI Lookup</Link></li>
              <li><Link href="/dashboard" className="hover:text-secondary transition-colors">My Research Lab</Link></li>
              <li><Link href="/support" className="hover:text-secondary transition-colors">Support Desk</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-medium">
          <p>© 2026 ResearchBridge Ecosystem. Built with Antigravity for the Global Research Community.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-secondary transition-colors">Terms</Link>
            <Link href="/blog" className="hover:text-secondary transition-colors">Blog</Link>
            <Link href="/careers" className="hover:text-secondary transition-colors">Careers</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
