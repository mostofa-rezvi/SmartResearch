"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Globe, BookOpen, TrendingUp, ExternalLink,
  ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Award,
  Database
} from "lucide-react";
import Navbar from "@/components/Navbar";
import AppPageHeader from "@/components/app/AppPageHeader";
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
  return { label: `${citations} citations`, color: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" };
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

      const results: Researcher[][] = [];
      
      // Sequential fetching to avoid overloading the backend/API and prevent timeouts
      for (let i = 0; i < pagesToFetch; i++) {
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
          // Increase individual timeout to 30s
          const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (res.ok) {
            const json = await res.json();
            results.push(json.data ?? json);
          }
        } catch (e) {
          console.error(`Sync batch fail: ${url}`, e);
          // Continue to next page even if one fails
        }
      }
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
    <div className="min-h-screen app-bg">
      <Navbar />

      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <AppPageHeader
          eyebrow="Global Expert Directory"
          title="Researchers"
          accent="Directory"
          subtitle={`Explore a curated pool of ${allResearchers.length.toLocaleString()} scholars. Your discovery order is preserved throughout your session for a professional browsing experience.`}
          actions={
            backgroundSyncing ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary dark:text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-primary/10">
                <RefreshCw size={12} className="animate-spin" /> Syncing Global Pool...
              </div>
            ) : undefined
          }
        />

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 flex items-center gap-3 neu-inset px-4 py-3">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name or institution..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="px-4 py-3 neu-inset text-sm font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            {DOMAIN_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 neu-inset px-4 py-3">
            <button
              onClick={() => { setSource("live"); syncResearchers(true); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "live" ? "bg-primary text-white shadow" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Wifi size={13} /> Live
            </button>
            <button
              onClick={() => { setSource("db"); syncResearchers(true); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "db" ? "bg-primary text-white shadow" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <Database size={13} /> Local
            </button>
          </div>

          <button
            onClick={() => { sessionStorage.removeItem(SESSION_SHUFFLE_KEY); syncResearchers(true); }}
            disabled={loading || backgroundSyncing}
            className="p-3 neu-btn text-slate-400 hover:text-primary transition-all disabled:opacity-50"
            title="Refresh Pool & Re-shuffle"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
             {loading ? (
               <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Preparing engine...</span>
             ) : (
               <>
                 <span>Showing <span className="font-black text-slate-900 dark:text-white">{filteredOrder.length.toLocaleString()}</span> scholars</span>
                 <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                 <span className="text-[10px] uppercase tracking-wider">Session Seed Locked</span>
               </>
             )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 rounded-3xl shadow-xl p-8 mb-6 text-center">
            <WifiOff size={32} className="text-red-300 dark:text-red-400 mx-auto mb-2" />
            <p className="text-red-600 dark:text-red-400 font-bold mb-1">Sync Problem</p>
            <p className="text-red-400 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-${i}`} className="glass-neu-card p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className="skeleton w-14 h-14 rounded-2xl" />
                    <div className="skeleton h-5 w-20 rounded-full" />
                  </div>
                  <div className="skeleton h-5 w-3/4 rounded mb-2" />
                  <div className="skeleton h-4 w-1/2 rounded mb-5" />
                  <div className="flex gap-1.5 mb-5">
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-5 w-14 rounded-full" />
                  </div>
                  <div className="skeleton h-16 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : displayResearchers.length === 0 ? (
            <div className="text-center py-24 glass-neu-card">
              <div className="w-16 h-16 neu-icon flex items-center justify-center text-primary dark:text-white mx-auto mb-5">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white mb-2">No researchers found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {debouncedQuery || domain !== "All Domains"
                  ? "Try adjusting your search term or domain filter."
                  : "The discovery pool is empty right now — try refreshing the sync."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayResearchers.map((r, idx) => {
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
                    className="glass-neu-card glass-neu-hover p-7 transition-all group flex flex-col cursor-pointer"
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                        <Award size={11} className="text-secondary dark:text-rose-300 shrink-0" /> {r.institution}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-5 mt-3">
                      {r.research_domains.slice(0, 2).map((d, di) => (
                        <span key={di} className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
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
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="p-3 neu-btn disabled:opacity-40 transition-all"
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
                      page === pageNum ? "bg-primary text-white shadow-lg shadow-primary/20" : "neu-btn text-slate-400"
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
              className="p-3 neu-btn disabled:opacity-40 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
