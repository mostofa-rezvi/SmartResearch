"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book, Search, Filter, Globe, School, Award,
  ChevronRight, ExternalLink, Library as LibraryIcon,
  Bookmark, Info, RefreshCw, X, SlidersHorizontal, FileText, FileSearch,
  BookMarked
} from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useApi, useAuth } from "@/context/AuthContext";
import JournalPapersModal from "@/components/journal/JournalPapersModal";
import AllSavedPapersModal from "@/components/journal/AllSavedPapersModal";
import { PdfExtractor } from "@/components/library/PdfExtractor";
import KnowledgeLibrary from "@/components/library/KnowledgeLibrary";

// Decode OpenAlex inverted-index abstracts back into plain text (for library sync).
function decodeInverted(index: Record<string, number[]> | null | undefined): string {
  if (!index) return "";
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words.push([word, pos]);
  }
  return words.sort((a, b) => a[1] - b[1]).map(([w]) => w).join(" ");
}

// --- Types ---
interface Journal {
  id: number;
  name: string;
  issn: string;
  category: string;
  subcategory?: string;
  quality_tier: string;
  geography: string;
  publisher: string;
  rank?: number;
  sjr_score?: number;
  h_index?: number;
  total_docs?: number;
  impact_factor?: number;
  homepage_url?: string;
  is_open_access: boolean;
  year: number;
}

interface Metadata {
  categories: string[];
  tiers: string[];
  years: number[];
  regions: string[];
}

export default function LibraryPage() {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();

  // Top-level view: existing journal catalog vs. Knowledge Library items (Module 4)
  const [view, setView] = useState<"catalog" | "library">("catalog");

  const [journals, setJournals] = useState<Journal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  
  // Saved Journals State
  const [savedJournals, setSavedJournals] = useState<Journal[]>([]);
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  // Saved Papers State
  const [savedPapersCount, setSavedPapersCount] = useState(0);
  const [showSavedPapers, setShowSavedPapers] = useState(false);
  const [showPdfExtractor, setShowPdfExtractor] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({
    tier: "" as string,
    category: "" as string,
    year: "" as string,
    region: "" as string,
    isOpenAccess: false,
  });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const virtuosoRef = useRef(null);

  // --- Effects ---

  // Load saved journals from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("saved_journals");
    if (saved) setSavedJournals(JSON.parse(saved));
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("saved_journals", JSON.stringify(savedJournals));
  }, [savedJournals]);

  const toggleSave = (journal: Journal) => {
    setSavedJournals(prev => {
      const isSaved = prev.some(j => j.id === journal.id);
      if (isSaved) {
        return prev.filter(j => j.id !== journal.id);
      } else {
        return [...prev, journal];
      }
    });
  };

  const refreshSavedPapersCount = useCallback(() => {
    if (typeof window === "undefined") return;
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("saved_papers_")) {
          const list = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (Array.isArray(list)) {
            count += list.length;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSavedPapersCount(count);
  }, []);

  // #23 cleanup — persist locally-saved papers to the backend library so they
  // feed the recommender. Non-breaking: localStorage remains the source of truth,
  // and each paper is POSTed at most once (tracked in `library_synced_paper_ids`).
  const syncSavedPapersToLibrary = useCallback(async () => {
    if (typeof window === "undefined" || !token) return;

    let syncedIds: string[] = [];
    try {
      syncedIds = JSON.parse(localStorage.getItem("library_synced_paper_ids") ?? "[]");
    } catch { /* ignore */ }
    const syncedSet = new Set<string>(Array.isArray(syncedIds) ? syncedIds : []);

    const toSync: any[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("saved_papers_")) {
          const list = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (Array.isArray(list)) {
            for (const p of list) {
              if (p?.id && !syncedSet.has(p.id)) toSync.push(p);
            }
          }
        }
      }
    } catch { /* ignore */ }

    if (toSync.length === 0) return;

    for (const p of toSync) {
      try {
        const body = {
          item_type: "paper",
          title: p.title || "Untitled",
          abstract: decodeInverted(p.abstract_inverted_index) || undefined,
          authors: Array.isArray(p.authorships)
            ? p.authorships.map((a: any) => a?.author?.display_name).filter(Boolean).join(", ")
            : undefined,
          doi: p.doi || undefined,
          tags: Array.isArray(p.concepts)
            ? p.concepts.slice(0, 6).map((c: any) => c?.display_name).filter(Boolean)
            : [],
        };
        const res = await fetchWithAuth(API.library.items, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        // Mark as synced on success (or if already exists) to avoid re-posting.
        if (res.ok) syncedSet.add(p.id);
      } catch { /* best-effort, non-breaking */ }
    }

    try {
      localStorage.setItem("library_synced_paper_ids", JSON.stringify(Array.from(syncedSet)));
    } catch { /* ignore */ }
  }, [token, fetchWithAuth]);

  useEffect(() => {
    refreshSavedPapersCount();
    syncSavedPapersToLibrary();
  }, [refreshSavedPapersCount, syncSavedPapersToLibrary, selectedJournal]);

  const exportToCSV = () => {
    if (savedJournals.length === 0) return;
    
    const headers = ["Name", "ISSN", "Category", "Quality Tier", "Year", "Impact (SJR)", "Publisher", "Geography"];
    const rows = savedJournals.map(j => [
      `"${j.name}"`,
      j.issn,
      `"${j.category}"`,
      j.quality_tier,
      j.year,
      j.sjr_score,
      `"${j.publisher}"`,
      j.geography
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `research_collection_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial metadata fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(API.library.metadata);
        const json = await res.json();
        if (json.status === 'success') setMetadata(json.data);
      } catch (err) {
        console.error("Failed to fetch library metadata");
      }
    };
    fetchMetadata();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset and fetch when filters change
  useEffect(() => {
    setJournals([]);
    setPage(1);
    setHasMore(true);
    loadMore(1, true);
  }, [debouncedQuery, filters]);

  const loadMore = useCallback(async (pageNum: number, isReset = false) => {
    if (!hasMore && !isReset) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "50",
        query: debouncedQuery,
        tier: filters.tier,
        category: filters.category,
        year: filters.year,
        region: filters.region,
        isOpenAccess: filters.isOpenAccess.toString(),
      });

      const response = await fetch(`${API.library.journals}?${params.toString()}`);
      const json = await response.json();
      
      if (json.status === 'success') {
        const newJournals = json.data.journals;
        setJournals(prev => isReset ? newJournals : [...prev, ...newJournals]);
        setTotalCount(json.data.totalCount);
        setHasMore(json.data.page < json.data.totalPages);
        setPage(pageNum + 1);
      }
    } catch (err) {
      console.error("Failed to fetch journals", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, hasMore]);

  const resetFilters = () => {
    setFilters({
      tier: "",
      category: "",
      year: "",
      region: "",
      isOpenAccess: false,
    });
    setSearchQuery("");
  };

  // --- Render Helpers ---

  const JournalCard = ({ journal, index }: { journal: Journal; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index % 10 * 0.03, 0.3) }}
      className="mb-2 mx-4"
    >
      <div 
        onClick={() => setSelectedJournal(journal)}
        className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-primary flex flex-col md:flex-row gap-4 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[9px] font-black text-slate-400 tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded uppercase">
              {journal.issn || "NO-ISSN"}
            </span>
            {journal.is_open_access && (
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                <Globe size={9} /> OA
              </span>
            )}
            <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded uppercase">
              {journal.year}
            </span>
          </div>

          <h3 className="text-base font-serif font-black text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors truncate">
            {journal.name}
          </h3>

          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[150px] font-bold text-primary/70">{journal.category}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="truncate max-w-[150px]">{journal.publisher}</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Globe size={10} className="text-slate-300" />
              {journal.geography || "Intl"}
            </span>
          </div>
        </div>

        <div className="md:w-40 flex md:flex-row items-center justify-between gap-3 md:border-l border-slate-100 dark:border-slate-700/50 md:pl-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
             <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-black shadow-sm ring-1 transition-transform group-hover:scale-105 ${
                journal.quality_tier === 'Q1' ? 'bg-amber-400/10 text-amber-500 ring-amber-500/20' :
                journal.quality_tier === 'Q2' ? 'bg-slate-400/10 text-slate-500 ring-slate-500/20' :
                journal.quality_tier === 'Q3' ? 'bg-orange-400/10 text-orange-500 ring-orange-500/20' :
                'bg-slate-100 text-slate-400 ring-slate-200'
              }`}>
                <span className="text-[8px] opacity-60 leading-none">SJR</span>
                <span className="text-xs leading-none">{journal.quality_tier}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary leading-none">{Number(journal.sjr_score || 0).toFixed(3)}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Impact</p>
              </div>
          </div>

          <div className="flex items-center gap-1">
            <a 
              href={journal.homepage_url || `https://www.google.com/search?q=${encodeURIComponent(journal.name + ' journal')}`}
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </a>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSave(journal);
              }}
              className={`p-2 rounded-lg transition-all ${
                savedJournals.some(j => j.id === journal.id)
                ? 'bg-secondary text-white shadow-md shadow-secondary/20'
                : 'text-slate-400 hover:text-secondary hover:bg-secondary/5'
              }`}
            >
              <Bookmark size={16} fill={savedJournals.some(j => j.id === journal.id) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
      <Navbar />
      
      <main className="pt-24 h-screen flex flex-col max-w-[1600px] mx-auto px-4 md:px-8">
        {/* View Switcher: Journal Catalog vs. My Library (Knowledge Library items) */}
        <div className="flex items-center gap-2 mb-6 shrink-0">
          <button
            onClick={() => setView("catalog")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              view === "catalog"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-primary/40"
            }`}
          >
            <LibraryIcon size={16} /> Journal Catalog
          </button>
          <button
            onClick={() => setView("library")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              view === "library"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-primary/40"
            }`}
          >
            <BookMarked size={16} /> My Library
          </button>
        </div>

        {view === "library" ? (
          <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-black tracking-tight">My Library</h1>
              <p className="text-slate-500 font-medium italic">Your papers, datasets, notes &amp; literature reviews — searchable by meaning.</p>
            </div>
            <KnowledgeLibrary />
          </div>
        ) : (
        <>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
                  <LibraryIcon size={24} />
                </div>
                <h1 className="text-4xl font-serif font-black tracking-tight">The Library</h1>
              </div>
              <p className="text-slate-500 font-medium italic">{totalCount.toLocaleString()}+ Peer-Reviewed Holdings Across 25 Years</p>
            </div>

            <button 
              onClick={() => setShowSavedPopup(true)}
              className="group flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-secondary transition-all"
            >
              <div className="p-2 bg-secondary/10 text-secondary rounded-lg group-hover:bg-secondary group-hover:text-white transition-colors">
                <Bookmark size={18} fill={savedJournals.length > 0 ? "currentColor" : "none"} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">My Collection</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{savedJournals.length} Journals</p>
              </div>
            </button>

            <button 
              onClick={() => {
                refreshSavedPapersCount();
                setShowSavedPapers(true);
              }}
              className="group flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all"
            >
              <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                <FileText size={18} fill={savedPapersCount > 0 ? "currentColor" : "none"} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saved Papers</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{savedPapersCount} Papers</p>
              </div>
            </button>

            {/* PDF Extractor button */}
            <button
              onClick={() => setShowPdfExtractor(true)}
              className="group flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-400 transition-all"
            >
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <FileSearch size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">PDF Tool</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">Extract Text</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search journals, ISSN, or publishers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl hover:bg-slate-50 transition-all md:hidden">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden gap-8 pb-8">
          {/* Filters Sidebar */}
          <aside className="hidden md:flex flex-col w-80 shrink-0 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
            <div className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Filter size={14} /> Refine Archives
                </h3>
                <button onClick={resetFilters} className="text-[10px] font-bold text-primary hover:underline">Reset</button>
              </div>

              <div className="space-y-6">
                {/* SJR Tier */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Impact Tier (SJR)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(tier => (
                      <button
                        key={tier}
                        onClick={() => setFilters(f => ({ ...f, tier: f.tier === tier ? "" : tier }))}
                        className={`py-3 rounded-xl text-xs font-black border transition-all ${
                          filters.tier === tier 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-transparent hover:border-primary/30'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Categories */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Academic Field</label>
                  <select 
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold border-none outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="">All Disciplines</option>
                    {metadata?.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </section>

                {/* Year */}
                <section>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Dataset Year</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[2025, 2024, 2023, 2022].map(yr => (
                      <button
                        key={yr}
                        onClick={() => setFilters(f => ({ ...f, year: f.year === yr.toString() ? "" : yr.toString() }))}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                          filters.year === yr.toString() 
                          ? 'bg-secondary text-white shadow-md shadow-secondary/20' 
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-secondary hover:bg-secondary/5'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                  <select 
                    value={filters.year}
                    onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold border-none outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="">All Years (1999-2025)</option>
                    {metadata?.years.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </section>

                 {/* Open Access Toggle */}
                 <section className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Only Open Access</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={filters.isOpenAccess}
                        onChange={() => setFilters(f => ({ ...f, isOpenAccess: !f.isOpenAccess }))}
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors ${filters.isOpenAccess ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${filters.isOpenAccess ? 'translate-x-5' : ''}`} />
                      </div>
                    </div>
                  </label>
                </section>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Library Health</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">Live Entries</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{totalCount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-full animate-pulse" />
                </div>
              </div>
            </div>
          </aside>

          {/* Results List */}
          <div className="flex-1 flex flex-col min-w-0">
            {journals.length === 0 && loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <RefreshCw className="animate-spin text-primary" size={32} />
                <p className="font-serif italic text-lg">Unrolling the archives...</p>
              </div>
            ) : journals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-slate-800/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 mb-6">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-serif font-black mb-2">No matching holdings</h3>
                <p className="text-slate-500 max-w-md">Our library couldn't find any journals matching your current criteria. Try widening your search or resetting filters.</p>
                <button onClick={resetFilters} className="mt-6 px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Reset Filters</button>
              </div>
            ) : (
              <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={journals}
                endReached={() => loadMore(page)}
                increaseViewportBy={300}
                itemContent={(index, journal) => (
                  <JournalCard key={journal.id} journal={journal} index={index} />
                )}
                components={{
                  Footer: () => loading ? (
                    <div className="p-8 text-center">
                      <RefreshCw className="animate-spin inline-block text-primary mr-2" size={16} />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading more...</span>
                    </div>
                  ) : null
                }}
              />
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* Saved Journals Popup */}
      <AnimatePresence>
        {showSavedPopup && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSavedPopup(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-end p-4 md:p-8"
            >
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg h-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-slate-900 dark:text-white">My Collection</h2>
                    <p className="text-sm text-slate-500 font-medium">{savedJournals.length} Saved Journals</p>
                  </div>
                  <button 
                    onClick={() => setShowSavedPopup(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {savedJournals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-6">
                        <Bookmark size={40} />
                      </div>
                      <h3 className="text-xl font-serif font-black mb-2">No journals saved yet</h3>
                      <p className="text-slate-500">Click the bookmark icon on any journal to add it to your collection.</p>
                    </div>
                  ) : (
                    savedJournals.map(journal => (
                      <div key={`saved-${journal.id}`} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 group flex items-start gap-4 hover:border-secondary transition-all">
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex flex-col items-center justify-center font-black shadow-sm ring-1 ${
                          journal.quality_tier === 'Q1' ? 'bg-amber-400/10 text-amber-500 ring-amber-500/20' :
                          journal.quality_tier === 'Q2' ? 'bg-slate-400/10 text-slate-500 ring-slate-500/20' :
                          journal.quality_tier === 'Q3' ? 'bg-orange-400/10 text-orange-500 ring-orange-500/20' :
                          'bg-slate-100 text-slate-400 ring-slate-200'
                        }`}>
                          <span className="text-[10px] leading-none">{journal.quality_tier}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mb-1">{journal.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span>{journal.issn}</span>
                            <span>•</span>
                            <span>{journal.year}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <a 
                            href={journal.homepage_url || `https://www.google.com/search?q=${encodeURIComponent(journal.name + ' journal')}`}
                            target="_blank" rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button 
                            onClick={() => toggleSave(journal)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                   <button 
                    onClick={exportToCSV}
                    disabled={savedJournals.length === 0}
                    className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                   >
                    Export Collection (CSV)
                   </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
        {selectedJournal && (
          <JournalPapersModal 
            journal={selectedJournal} 
            onClose={() => setSelectedJournal(null)} 
          />
        )}
        {showSavedPapers && (
          <AllSavedPapersModal 
            onClose={() => setShowSavedPapers(false)}
            onRefreshCount={refreshSavedPapersCount}
          />
        )}
      </AnimatePresence>

      {/* PDF Extractor Slide-Over */}
      <AnimatePresence>
        {showPdfExtractor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPdfExtractor(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-500/10 rounded-xl flex items-center justify-center">
                    <FileSearch className="text-rose-500" size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">PDF Extractor</h2>
                    <p className="text-xs text-slate-400">Knowledge Library tool</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfExtractor(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <PdfExtractor />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
