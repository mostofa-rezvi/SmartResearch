"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Search, Filter, Globe, School, Award, ChevronRight, ExternalLink, Library as LibraryIcon, Bookmark, Info } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function JournalDirectoryPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchJournals();
  }, [selectedTier, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/journals/categories");
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      let url = "http://localhost:5000/api/journals?";
      if (selectedTier) url += `tier=${selectedTier}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      
      const response = await fetch(url);
      const data = await response.json();
      setJournals(data);
    } catch (err) {
      console.error("Failed to fetch journals");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-72 shrink-0 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <LibraryIcon className="text-primary" /> The Library
            </h1>
            <p className="text-slate-500 text-sm">Our curated directory of academic publications.</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award size={14} /> Quality Tiers
              </h4>
              <div className="flex flex-col gap-1">
                {['Q1', 'Q2', 'Q3'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                    className={`flex items-center justify-between px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTier === tier 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Section {tier}</span>
                    <ChevronRight size={14} className={selectedTier === tier ? 'opacity-100' : 'opacity-30'} />
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Book size={14} /> Disciplines
              </h4>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === cat 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {categories.length === 0 && <p className="text-xs italic text-slate-400 px-4">Loading categories...</p>}
              </div>
            </section>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Search className="text-slate-400 ml-3" size={20} />
            <input 
              type="text" 
              placeholder="Quick search by ISSN or Journal Name..." 
              className="w-full bg-transparent border-none outline-none text-sm py-2"
            />
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-4">
              {journals.length} Holdings
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 italic text-slate-400 animate-pulse">Consulting the library archives...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {journals.map((journal, idx) => (
                  <motion.div
                    key={journal.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/10 transition-all border-l-4 border-l-primary"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
                        ISSN: {journal.issn || 'N/A'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-100">
                          {journal.quality_tier}
                        </span>
                        <Bookmark size={18} className="text-slate-300 hover:text-primary cursor-pointer transition-colors" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white leading-snug">{journal.name}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                      {journal.category} {journal.subcategory && <><ChevronRight size={10} /> {journal.subcategory}</>}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50 dark:border-slate-700 mt-auto">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Impact Factor</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{journal.impact_factor || '0.000'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Geography</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{journal.geography || 'Global'}</p>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                        <School size={12} /> {journal.institutional_group || 'Independent Publisher'}
                      </div>
                      <a 
                        href={journal.website_url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400 hover:text-primary transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && journals.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300"><Info size={32} /></div>
              <p className="text-slate-500 font-medium">No results found in this section of the library.</p>
              <button onClick={() => { setSelectedTier(null); setSelectedCategory(null); }} className="text-primary text-sm font-bold underline">Rest Filters</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
