"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Globe, BookOpen, TrendingUp, ExternalLink,
  ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Award,
  Database, Zap
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";

// ─── Types & Constants ─────────────────────────────────────────────────────────
interface Researcher {
  id?: string | number;
  openalex_id: string;
  name: string;
  institution?: string;
  country_code?: string;
  citation_count: number;
  works_count: number;
  h_index?: number;
  research_domains: string[];
  avatar_url?: string;
  orcid_url?: string;
}

const DOMAIN_OPTIONS = [
  "All Domains",
  "Machine Learning",
  "Biomedical",
  "Environmental Science",
  "Physics",
  "Economics",
  "Engineering",
  "Psychology",
  "Mathematics",
];

const ITEMS_PER_PAGE = 20;
const CACHE_KEY = "smart_researchers_v2_pool";
const SESSION_SHUFFLE_KEY = "smart_researchers_session_order";
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

// ─── Utils ────────────────────────────────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getCitationBadge(citations: number) {
  if (citations >= 10000) return { label: "Highly Cited", color: "bg-secondary text-white" };
  if (citations >= 1000) return { label: "Well Cited", color: "bg-accent/20 text-accent" };
  return { label: `${citations} citations`, color: "bg-slate-100 text-slate-500" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResearchersPage() {
  const router = useRouter();
  
  // Core Data Pool (The Source of Truth)
  const [allResearchers, setAllResearchers] = useState<Researcher[]>([]);
  const [displayOrder, setDisplayOrder] = useState<string[]>([]); // Array of OpenAlex IDs in shuffled order
  
  const [loading, setLoading] = useState(true);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [source, setSource] = useState<"db" | "live">("live");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All Domains");
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 1. Initial Load from Persistent Cache
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const sessionOrder = sessionStorage.getItem(SESSION_SHUFFLE_KEY);
    
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          setAllResearchers(data);
          
          // Use session order if available to keep the list stable during browsing
          if (sessionOrder) {
            setDisplayOrder(JSON.parse(sessionOrder));
          } else {
            const newOrder = shuffleArray(data.map((r: any) => r.openalex_id));
            setDisplayOrder(newOrder);
            sessionStorage.setItem(SESSION_SHUFFLE_KEY, JSON.stringify(newOrder));
          }
          setLoading(false);
        }
      } catch (e) {
        console.error("Cache load error", e);
      }
    }
    
    // Always trigger sync to keep data fresh, but it won't jump the UI
    syncResearchers();
  }, []);

  // 2. High-Performance Sync (Merging Logic)
  const syncResearchers = async (isManual = false) => {
    if (backgroundSyncing) return;
    if (isManual) setLoading(true);
    else setBackgroundSyncing(true);

    try {
      const pagesToFetch = source === "live" ? 8 : 1; 
      const batchSize = source === "live" ? 50 : 1000;

      const fetchPromises = Array.from({ length: pagesToFetch }).map(async (_, i) => {
        const params = new URLSearchParams({
          page: String(i + 1),
          min_citations: "300",
        });
        
        if (source === "live") {
          params.set("per_page", String(batchSize));
          if (domain !== "All Domains") params.set("domain", domain.toLowerCase());
        } else {
          params.set("limit", String(batchSize));
          if (domain !== "All Domains") params.set("domain", domain);
        }
        
        const endpoint = source === "live" ? API.researchers.liveSearch : API.researchers.list;
        const url = `${endpoint}?${params}`;
        
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!res.ok) return [];
          const json = await res.json();
          return json.data ?? json;
        } catch (e) {
          console.error(`Sync batch fail: ${url}`, e);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const newBatches = results.flat().filter(Boolean);

      // --- Merging Strategy ---
      // We merge new data into the existing pool to avoid the "shrinking" issue
      setAllResearchers(prev => {
        const map = new Map(prev.map(r => [r.openalex_id, r]));
        newBatches.forEach((r: any) => {
          if (!r.openalex_id) return;
          const normalized = {
            ...r,
            research_domains: Array.isArray(r.research_domains)
              ? r.research_domains
              : (typeof r.research_domains === "string" ? JSON.parse(r.research_domains || "[]") : [])
          };
          map.set(r.openalex_id, normalized);
        });

        const mergedPool = Array.from(map.values());
        
        // Update Local Storage Cache
        if (mergedPool.length > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: mergedPool,
            timestamp: Date.now()
          }));
        }

        // Handle Display Order
        setDisplayOrder(currentOrder => {
          // If we have a current order, just append new IDs to the end (randomized)
          const existingIds = new Set(currentOrder);
          const newIds = mergedPool
            .map(r => r.openalex_id)
            .filter(id => !existingIds.has(id));
          
          if (newIds.length === 0) return currentOrder;
          
          const updatedOrder = [...currentOrder, ...shuffleArray(newIds)];
          sessionStorage.setItem(SESSION_SHUFFLE_KEY, JSON.stringify(updatedOrder));
          return updatedOrder;
        });

        return mergedPool;
      });

      setError(null);
    } catch (err: any) {
      console.error("Critical Sync Error", err);
      if (isManual) setError("Sync failed. Check your connection.");
    } finally {
      setLoading(false);
      setBackgroundSyncing(false);
    }
  };

  // 3. Search & Page Generation
  const filteredOrder = useMemo(() => {
    const researchersMap = new Map(allResearchers.map(r => [r.openalex_id, r]));
    
    return displayOrder.filter(id => {
      const r = researchersMap.get(id);
      if (!r) return false;

      // Filter by Query
      if (debouncedQuery) {
        const q = debouncedQuery.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !r.institution?.toLowerCase().includes(q)) return false;
      }

      // Filter by Domain
      if (domain !== "All Domains") {
        const d = domain.toLowerCase();
        if (!r.research_domains.some(rd => rd.toLowerCase().includes(d))) return false;
      }

      return true;
    });
  }, [allResearchers, displayOrder, debouncedQuery, domain]);

  const displayResearchers = useMemo(() => {
    const researchersMap = new Map(allResearchers.map(r => [r.openalex_id, r]));
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredOrder.slice(start, start + ITEMS_PER_PAGE)
      .map(id => researchersMap.get(id)!)
      .filter(Boolean);
  }, [allResearchers, filteredOrder, page]);

  const totalPages = Math.ceil(filteredOrder.length / ITEMS_PER_PAGE);

  // 4. Interaction Effects
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, domain, source]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary mb-2 block uppercase flex items-center gap-2">
              <Zap size={14} className="fill-secondary" /> Persistent Discovery Engine · Verified Data
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black text-primary dark:text-white mb-3">
              Global <span className="text-secondary italic">Researchers</span>
            </h1>
            <p className="text-slate-500 max-w-xl font-medium">
              Explore a curated pool of {allResearchers.length.toLocaleString()} scholars. Your discovery order is preserved throughout your session for a professional browsing experience.
            </p>
          </div>

          {backgroundSyncing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-primary/10">
              <RefreshCw size={12} className="animate-spin" /> Syncing Global Pool...
            </div>
          )}
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name or institution..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
            />
          </div>

          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-medium outline-none shadow-sm cursor-pointer"
          >
            {DOMAIN_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <button
              onClick={() => { setSource("live"); syncResearchers(true); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "live" ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Wifi size={13} /> Live
            </button>
            <button
              onClick={() => { setSource("db"); syncResearchers(true); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "db" ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Database size={13} /> Local
            </button>
          </div>

          <button
            onClick={() => { sessionStorage.removeItem(SESSION_SHUFFLE_KEY); syncResearchers(true); }}
            disabled={loading || backgroundSyncing}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-50"
            title="Refresh Pool & Re-shuffle"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
             {loading ? (
               <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Preparing engine...</span>
             ) : (
               <>
                 <span>Showing <span className="font-black text-slate-900 dark:text-white">{filteredOrder.length.toLocaleString()}</span> scholars</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                 <span className="text-[10px] uppercase tracking-wider">Session Seed Locked</span>
               </>
             )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6 text-center">
            <WifiOff size={32} className="text-red-300 mx-auto mb-2" />
            <p className="text-red-600 font-bold mb-1">Sync Problem</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-${i}`} className="bg-white dark:bg-slate-800 rounded-3xl p-7 animate-pulse border border-slate-100 dark:border-slate-700">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-4" />
                  <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                </div>
              ))
            ) : (
              displayResearchers.map((r, idx) => {
                const badge = getCitationBadge(r.citation_count);
                const initials = r.name.split(" ").map(n => n[0]).slice(0, 2).join("");
                const cleanId = typeof r.openalex_id === 'string' && r.openalex_id.startsWith('http') 
                  ? r.openalex_id.split('/').pop() 
                  : (r.openalex_id || r.id);

                return (
                  <motion.div
                    key={r.openalex_id || idx}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/10 transition-all group flex flex-col cursor-pointer"
                    onClick={() => { if (cleanId) router.push(`/researchers/${cleanId}`); }}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors leading-tight">
                      {r.name}
                    </h3>
                    {r.institution && (
                      <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <Award size={11} className="text-secondary shrink-0" /> {r.institution}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-5 mt-3">
                      {r.research_domains.slice(0, 2).map((d, di) => (
                        <span key={di} className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">
                          {d}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-50 dark:border-slate-700 mt-auto">
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{r.citation_count.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Citations</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{r.works_count.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Works</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{r.h_index ?? "—"}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">H-Index</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </AnimatePresence>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum = page;
                if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === pageNum ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
