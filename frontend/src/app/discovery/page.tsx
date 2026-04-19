"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Filter, Bookmark, Share2, User, ChevronRight, Hash, FileText, Send, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

export default function DiscoveryEnginePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const [savedIds, setSavedIds] = useState<number[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API.discovery.search}?query=${query}`, {
        headers: { "x-auth-token": token || "" }
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (paper: any) => {
    if (!token) return;
    try {
      await fetch(API.discovery.save, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ title: paper.title, doi: paper.doi, journal: paper.journal })
      });
      setSavedIds(prev => [...prev, paper.id]);
    } catch (err) {
      console.error("Save failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                Personalized <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Discovery</span>
            </h1>
            <p className="text-slate-500 text-lg">Leveraging your research profile to find what truly matters.</p>
        </header>

        <form onSubmit={handleSearch} className="relative mb-16 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={22} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search authors, methodologies, DOIs or titles..."
            className="w-full pl-16 pr-32 py-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-2xl focus:border-primary outline-none text-lg transition-all"
          />
          <button 
            type="submit"
            className="absolute right-3 top-3 bottom-3 px-8 rounded-2xl bg-primary text-white font-bold hover:bg-secondary transition-all shadow-lg hover:shadow-primary/25"
          >
            Explore
          </button>
        </form>

        <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Results ranked by relevance</h3>
                {user?.research_interests && (
                    <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                        <Sparkles size={12} /> Adaptive Filters Active
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 italic text-slate-400 animate-pulse">Consulting the discovery engine...</div>
            ) : (
                <AnimatePresence>
                    {results.map((paper, idx) => (
                        <motion.div
                            key={paper.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl group hover:border-primary/30 transition-all flex flex-col md:flex-row gap-8"
                        >
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {paper.matchedInterest && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/5 px-2 py-1 rounded-md border border-accent/10">
                                            <Sparkles size={10} /> RECOMMENDED: MATCHES YOUR {paper.matchedInterest.toUpperCase()} INTEREST
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md">
                                        {paper.journal} • {paper.tier}
                                    </span>
                                </div>
                                
                                <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{paper.title}</h2>
                                <p className="text-slate-500 text-sm mb-6 flex items-center gap-4">
                                    <span className="flex items-center gap-1"><User size={14} /> {paper.authors.join(', ')}</span>
                                    <span className="h-4 w-px bg-slate-200" />
                                    <span>{paper.year}</span>
                                    <span className="h-4 w-px bg-slate-200" />
                                    <span>{paper.citations} Citations</span>
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {(paper.tags || []).map((tag: string) => (
                                        <span key={tag} className="text-[10px] font-bold text-slate-400">#{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-3 justify-center">
                                <button 
                                    onClick={() => handleSave(paper)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                        savedIds.includes(paper.id) 
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-primary hover:bg-white'
                                    }`}
                                >
                                    {savedIds.includes(paper.id) ? <CheckCircle2 size={24} /> : <Bookmark size={24} />}
                                </button>
                                <button className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center hover:text-primary hover:bg-white transition-all">
                                    <Share2 size={24} />
                                </button>
                                <button className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center hover:text-primary hover:bg-white transition-all">
                                    <Send size={24} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}

            {!loading && results.length === 0 && query && (
                <div className="text-center py-20 italic text-slate-400">No results found for your query. Try broadening your terms.</div>
            )}
        </div>
      </main>
    </div>
  );
}
