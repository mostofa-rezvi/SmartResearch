"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Globe, BookOpen, TrendingUp, ExternalLink,
  ChevronLeft, ChevronRight, Wifi, WifiOff, RefreshCw, Award
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Researcher {
  id?: number;
  openalex_id: string;
  name: string;
  institution?: string;
  country_code?: string;
  citation_count: number;
  works_count: number;
  h_index?: number;
  research_domains: string[];
  profile_url?: string;
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

const TIER_COLORS: Record<string, string> = {
  "1000+": "bg-secondary/10 text-secondary ring-secondary/20",
  "500+": "bg-accent/10 text-accent ring-accent/20",
  "default": "bg-slate-100 text-slate-500 ring-slate-200",
};

function getCitationBadge(citations: number) {
  if (citations >= 10000) return { label: "Highly Cited", color: "bg-secondary text-white" };
  if (citations >= 1000) return { label: "Well Cited", color: "bg-accent/20 text-accent" };
  return { label: `${citations} citations`, color: "bg-slate-100 text-slate-500" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResearchersPage() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"db" | "live">("live"); // live = OpenAlex proxy
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All Domains");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const fetchResearchers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (source === "live") {
        // OpenAlex live proxy
        const params = new URLSearchParams({
          per_page: "25",
          page: String(page),
          min_citations: "300",
        });
        if (domain !== "All Domains") params.set("domain", domain.toLowerCase());
        url = `${API.researchers.liveSearch}?${params}`;
      } else {
        // Local DB
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (domain !== "All Domains") params.set("domain", domain);
        url = `${API.researchers.list}?${params}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) throw new Error(json?.error?.error || "Failed to fetch");

      // Handle both envelope formats
      const data: Researcher[] = json.data ?? json;
      const meta = json.meta;

      // Normalize research_domains (may come as JSON string or array)
      const normalized = data.map((r: any) => ({
        ...r,
        research_domains: Array.isArray(r.research_domains)
          ? r.research_domains
          : (typeof r.research_domains === "string"
              ? JSON.parse(r.research_domains || "[]")
              : []),
      }));

      setResearchers(normalized);
      setTotalCount(meta?.total ?? normalized.length);
      setTotalPages(meta?.pages ?? Math.ceil((meta?.total ?? normalized.length) / 25));
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setResearchers([]);
    } finally {
      setLoading(false);
    }
  }, [source, page, domain, debouncedQuery]);

  useEffect(() => {
    setPage(1);
  }, [domain, debouncedQuery, source]);

  useEffect(() => {
    fetchResearchers();
  }, [fetchResearchers]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-10">
          <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary mb-2 block uppercase">
            OpenAlex · ORCID · 250M+ Works
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-primary dark:text-white mb-3">
            Global <span className="text-secondary italic">Researchers</span>
          </h1>
          <p className="text-slate-500 max-w-xl font-medium">
            Discover researchers and professors worldwide. Data sourced live from
            OpenAlex — the world's open scholarly graph with 250M+ works.
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
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

          {/* Domain filter */}
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
          >
            {DOMAIN_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Source toggle */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-sm">
            <button
              onClick={() => setSource("live")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "live"
                  ? "bg-primary text-white shadow"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Wifi size={13} /> Live API
            </button>
            <button
              onClick={() => setSource("db")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                source === "db"
                  ? "bg-primary text-white shadow"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <WifiOff size={13} /> Local DB
            </button>
          </div>

          <button
            onClick={fetchResearchers}
            disabled={loading}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Count bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 font-medium">
            {loading ? "Searching..." : (
              <>
                <span className="font-black text-slate-900 dark:text-white">{totalCount.toLocaleString()}</span>
                {" "}researchers found via{" "}
                <span className="text-secondary font-bold">{source === "live" ? "OpenAlex Live" : "Local DB"}</span>
              </>
            )}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-6 text-center">
            <WifiOff size={32} className="text-red-300 mx-auto mb-2" />
            <p className="text-red-600 font-bold mb-1">Could not load researchers</p>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchResearchers}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Researcher Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-7 animate-pulse">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-4" />
                <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {researchers.map((r, idx) => {
                const badge = getCitationBadge(r.citation_count);
                const initials = r.name.split(" ").map(n => n[0]).slice(0, 2).join("");
                return (
                  <motion.div
                    key={r.openalex_id || idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/10 transition-all group flex flex-col"
                  >
                    {/* Avatar + Badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {initials}
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Name + Institution */}
                    <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors leading-tight">
                      {r.name}
                    </h3>
                    {r.institution && (
                      <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <Award size={11} className="text-secondary shrink-0" /> {r.institution}
                      </p>
                    )}
                    {r.country_code && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                        <Globe size={10} /> {r.country_code}
                      </p>
                    )}

                    {/* Domains */}
                    {r.research_domains.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {r.research_domains.slice(0, 3).map((d, di) => (
                          <span key={di} className="text-[9px] font-black bg-primary/5 text-primary px-2 py-1 rounded uppercase tracking-wider">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-50 dark:border-slate-700 mt-auto mb-4">
                      <div className="text-center">
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {r.citation_count.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Citations</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {r.works_count.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Works</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {r.h_index ?? "—"}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">H-Index</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {r.profile_url && (
                        <a
                          href={r.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <BookOpen size={13} /> OpenAlex
                        </a>
                      )}
                      {r.orcid_url && (
                        <a
                          href={r.orcid_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-secondary/5 hover:bg-secondary text-secondary hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <ExternalLink size={13} /> ORCID
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Empty state */}
        {!loading && !error && researchers.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <Users size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No researchers found for this query.</p>
            <button
              onClick={() => { setQuery(""); setDomain("All Domains"); }}
              className="text-primary text-sm font-bold underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
