"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Search, Filter, Globe, School, Award, ChevronRight, ExternalLink, Library as LibraryIcon, Bookmark, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";

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
      const response = await fetch(API.library.categories);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories");
      setCategories([]);
    }
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      let url = `${API.library.journals}?`;
      if (selectedTier) url += `tier=${selectedTier}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      
      const response = await fetch(url);
      const data = await response.json();
      setJournals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch journals");
      setJournals([]);
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
            <h1 className="text-4xl font-serif font-black text-primary dark:text-white mb-2 flex items-center gap-3">
              <LibraryIcon size={32} className="text-secondary" /> The Library
            </h1>
            <p className="text-slate-500 text-sm italic font-medium leading-relaxed">
              "Unifying Global Knowledge from Student to Professor."
            </p>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Award size={14} className="text-secondary" /> Journal Ranking (SJR)
              </h4>
              <div className="flex flex-wrap gap-2">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                    className={`flex-1 min-w-[60px] py-3 rounded-xl text-xs font-black transition-all border ${
                      selectedTier === tier 
                      ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-100 dark:border-slate-700 hover:border-secondary/50'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Globe size={14} className="text-primary" /> Geographic Axis
              </h4>
              <select 
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                defaultValue="all"
              >
                <option value="all">Global Reach</option>
                <option value="bd">Bangladesh (Local)</option>
                <option value="eu">Europe</option>
                <option value="na">North America</option>
                <option value="asia">Asia-Pacific</option>
              </select>
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
                    className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-secondary/5 transition-all group border-l-8 border-l-primary flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className="mono-academic text-[10px] text-slate-400 font-bold tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-md">
                        {journal.issn || 'NO-ISSN-DATA'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ring-1 ${
                          journal.quality_tier === 'Q1' ? 'bg-secondary/10 text-secondary ring-secondary/20' :
                          journal.quality_tier === 'Q2' ? 'bg-accent/10 text-accent ring-accent/20' :
                          'bg-slate-100 text-slate-500 ring-slate-200'
                        }`}>
                          {journal.quality_tier}
                        </div>
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-300 hover:text-secondary transition-all">
                          <Bookmark size={20} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-2xl font-serif font-black mb-2 text-primary dark:text-white leading-tight transition-colors group-hover:text-secondary">{journal.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-[10px] font-black text-secondary bg-secondary/5 px-2 py-1 rounded uppercase tracking-wider">
                        {journal.category}
                      </span>
                      {journal.subcategory && (
                        <span className="text-[10px] font-black text-primary/60 bg-primary/5 px-2 py-1 rounded uppercase tracking-wider">
                          {journal.subcategory}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50 dark:border-slate-700 my-4">
                      <div className="space-y-1">
                        <p className="mono-academic text-[9px] text-slate-400 font-bold">Impact Factor</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">{journal.impact_factor || '0.000'}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="mono-academic text-[9px] text-slate-400 font-bold text-right">Geography</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 truncate">{journal.geography || 'Global Reach'}</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <School size={14} className="text-slate-300" /> {journal.institutional_group || 'Independent'}
                      </div>
                      <a 
                        href={journal.website_url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all text-xs font-bold"
                      >
                        Source <ExternalLink size={14} />
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
