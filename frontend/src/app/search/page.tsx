"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search as SearchIcon, FileText, User, ChevronRight, Hash, Send, AlertTriangle, ExternalLink, Calendar, Users, FileType, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "@/config/api";

interface PaperMetadata {
  id: string;
  doi: string;
  title: string;
  publication_year: number;
  publication_date: string;
  authors: { name: string; institutions: string[] }[];
  abstract: string | null;
  journal: string | null;
  is_open_access: boolean;
  oa_url: string | null;
  citation_count: number;
  concepts: { display_name: string; score: number }[];
}

export default function PublicSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaperMetadata | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      // For now, only support resolving via our DOI endpoint.
      // A more robust app might regex-check the input and route to different endpoints.
      const response = await fetch(API.discovery.searchDoi(query));
      const json = await response.json();

      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setError(json.message || "Failed to resolve identifier.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <header className="mb-16 text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-black text-primary dark:text-white mb-6">
               The <span className="text-secondary italic">DOI Engine</span>
            </h1>
            <p className="text-slate-500 text-lg italic max-w-2xl mx-auto">"Instant lookup and contextual discovery across 250 million records."</p>
          </header>

          <form onSubmit={handleSearch} className="relative mb-12 group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary transition-colors">
              <SearchIcon size={28} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste DOI (10.1037/0003-066X.59.1.29)..."
              className="w-full pl-16 pr-44 py-7 rounded-[32px] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] focus:border-secondary transition-all outline-none text-xl font-medium"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-3 top-3 bottom-3 px-10 rounded-2xl bg-secondary text-white font-black hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resolving
                </>
              ) : (
                "Search"
              )}
            </button>
          </form>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-3xl mb-12 flex items-start gap-4 text-red-700 dark:text-red-400"
              >
                <AlertTriangle className="shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold mb-1">Resolution Failed</h4>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mb-12"
              >
                <div className="p-8 md:p-10 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-primary/10 text-primary font-black text-xs uppercase tracking-widest rounded-lg flex items-center gap-1">
                      <FileType size={14} /> Publication
                    </span>
                    {result.is_open_access && (
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest rounded-lg flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/50">
                        <CheckCircle2 size={14} /> Open Access
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-400 font-mono">
                      DOI: {result.doi}
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif font-black text-slate-900 dark:text-white mb-6 leading-tight">
                    {result.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                    {result.journal && (
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">{result.journal}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      <span>{result.publication_date || result.publication_year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      <span>{result.authors?.length || 0} Authors</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10 bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                      {result.abstract && (
                        <div>
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Abstract</h3>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {result.abstract}
                          </p>
                        </div>
                      )}

                      {result.authors && result.authors.length > 0 && (
                        <div>
                          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Authors & Institutions</h3>
                          <div className="space-y-4">
                            {result.authors.slice(0, 5).map((author, idx) => (
                              <div key={idx} className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{author.name}</span>
                                {author.institutions && author.institutions.length > 0 && (
                                  <span className="text-xs text-slate-500">{author.institutions.join(", ")}</span>
                                )}
                              </div>
                            ))}
                            {result.authors.length > 5 && (
                              <p className="text-xs font-bold text-primary italic">+ {result.authors.length - 5} more authors</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                          <h4 className="text-4xl font-black text-primary mb-1">{result.citation_count}</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Citations</p>
                       </div>

                       {result.oa_url && (
                         <a 
                          href={result.oa_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all"
                         >
                           Read Open Access PDF <ExternalLink size={18} />
                         </a>
                       )}

                       {result.concepts && result.concepts.length > 0 && (
                         <div>
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Key Concepts</h4>
                           <div className="flex flex-wrap gap-2">
                             {result.concepts.slice(0, 8).map(concept => (
                               <span key={concept.display_name} className="px-3 py-1 bg-primary/5 text-primary text-xs font-bold rounded-lg border border-primary/10">
                                 {concept.display_name}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !error && !isSearching && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32 opacity-80 hover:opacity-100 transition-opacity">
               <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Supported Identifiers</h3>
                  <div className="flex flex-wrap gap-3">
                     {['DOI'].map(id => (
                        <span key={id} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500">{id}</span>
                     ))}
                  </div>
               </div>
               <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/10">
                  <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Pro Tip</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "Searching by DOI allows ResearchBridge to instantly resolve publication metadata, including abstracts, citations, and Open Access PDF availability."
                  </p>
               </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
