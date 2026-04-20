"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search as SearchIcon, FileText, User, ChevronRight, Hash, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    // Simulation of engine activation
    setTimeout(() => {
        window.location.href = `/register?intent=search&q=${encodeURIComponent(query)}`;
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-16 text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-black text-primary dark:text-white mb-6">
               The <span className="text-secondary italic">DOI Engine</span>
            </h1>
            <p className="text-slate-500 text-lg italic max-w-2xl mx-auto">"Instant lookup and contextual discovery across 250 million records."</p>
          </header>

          <form onSubmit={handleSearch} className="relative mb-24 group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary transition-colors">
              <SearchIcon size={28} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste DOI (10.1037/0003-066X.59.1.29), arXiv ID, or paper title..."
              className="w-full pl-16 pr-44 py-7 rounded-[32px] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] focus:border-secondary transition-all outline-none text-xl font-medium"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-3 top-3 bottom-3 px-10 rounded-2xl bg-secondary text-white font-black hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 active:scale-95 disabled:opacity-50"
            >
              {isSearching ? "Consulting..." : "Search"}
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
             <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Supported Identifiers</h3>
                <div className="flex flex-wrap gap-3">
                   {['DOI', 'arXiv', 'PMID', 'ISBN', 'URL', 'Orcid'].map(id => (
                      <span key={id} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500">{id}</span>
                   ))}
                </div>
             </div>
             <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/10">
                <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Pro Tip</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "Searching by DOI allows ResearchBridge to instantly map citation networks and suggest related methodologies."
                </p>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
