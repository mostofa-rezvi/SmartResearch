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
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const { user, token, isLoading } = useAuth();

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API.discovery.search}?query=${query}`, {
        headers: { "x-auth-token": token || "" }
      });
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed");
      setResults([]);
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

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center italic text-slate-400">Loading discovery session...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
            <h1 className="text-5xl font-serif font-black text-primary dark:text-white mb-4 tracking-tight">
                The <span className="text-secondary italic">Discovery Engine</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto italic font-medium">"Leveraging your research profile to solve the cold-start problem in knowledge discovery."</p>
        </header>

        <form onSubmit={handleSearch} className="relative mb-16 max-w-3xl mx-auto group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary transition-colors">
            <Search size={24} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type DOI, Author, or natural language query (e.g. 'Recent advances in NLP')..."
            className="w-full pl-16 pr-40 py-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] focus:border-secondary transition-all outline-none text-lg"
          />
          <button 
            type="submit"
            className="absolute right-4 top-4 bottom-4 px-10 rounded-2xl bg-secondary text-white font-black hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 active:scale-95"
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
                                
                                <h2 className="text-2xl font-serif font-black mb-2 text-primary dark:text-white group-hover:text-secondary transition-colors leading-tight">{paper.title}</h2>
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
