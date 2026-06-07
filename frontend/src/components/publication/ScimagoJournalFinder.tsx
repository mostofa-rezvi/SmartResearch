"use client";

import React, { useState, useEffect } from "react";
import { Search, ExternalLink, Star, Globe, Lock, BookOpen, Loader2 } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

interface Journal {
  title: string;
  issn: string;
  subject: string;
  sjr: number;
  h_index: number;
  country: string;
  publisher: string;
  quartile: string;
  open_access: boolean;
}

const TIER_COLORS: Record<string, string> = {
  Q1: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Q2: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Q3: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Q4: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function ScimagoJournalFinder() {
  const { fetchWithAuth } = useApi();
  const [query, setQuery] = useState("");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  // Load default list and saved target on mount
  useEffect(() => {
    search();
    const saved = localStorage.getItem("publication_target_journal");
    if (saved) {
      try {
        setSelectedJournal(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSelectTarget = (journal: Journal) => {
    setSelectedJournal(prev => {
      const isTarget = prev?.issn === journal.issn;
      const next = isTarget ? null : journal;
      if (next) {
        localStorage.setItem("publication_target_journal", JSON.stringify(next));
      } else {
        localStorage.removeItem("publication_target_journal");
      }
      // Trigger a custom event so other components (like Checklist) can know the selection changed
      window.dispatchEvent(new Event("publication_target_journal_changed"));
      return next;
    });
  };

  const search = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const q = searchQuery !== undefined ? searchQuery : query;
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q);
      if (openAccessOnly) params.set("open_access", "true");
      params.set("limit", "20");

      const res = await fetchWithAuth(`${API.publications.scimago}?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setJournals(json.data);
        setSearched(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
          <BookOpen className="text-emerald-500" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Scimago Journal Finder</h2>
          <p className="text-sm text-slate-500">Find target journals ranked by SJR impact score</p>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, subject area, or publisher..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Filter */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div
          onClick={() => setOpenAccessOnly(v => !v)}
          className={`w-10 h-5 rounded-full transition-colors ${openAccessOnly ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${openAccessOnly ? "translate-x-5" : "translate-x-1"}`} />
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Access Only</span>
      </label>

      {/* Results */}
      {loading && !searched ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {journals.length === 0 && searched && (
            <p className="text-center text-slate-400 text-sm py-8">No journals found. Try a broader search.</p>
          )}
          {journals.map((j, i) => (
            <div
              key={`${j.issn}-${i}`}
              className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group"
            >
              {/* SJR Badge */}
              <div className="text-center w-14 shrink-0">
                <div className="text-lg font-black text-slate-900 dark:text-white">{j.sjr.toFixed(2)}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">SJR</div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{j.title}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${TIER_COLORS[j.quartile] || ""}`}>
                    {j.quartile}
                  </span>
                  {j.open_access && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Globe size={9} /> OA
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  <span>{j.subject}</span>
                  <span>H-Index: {j.h_index}</span>
                  <span>{j.country}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{j.publisher}</p>
              </div>

              {/* ISSN & External link */}
              <div className="text-right shrink-0 flex flex-col items-end">
                <a
                  href={`https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(j.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-500 hover:text-emerald-700 font-bold flex items-center gap-1 group-hover:underline"
                >
                  View <ExternalLink size={11} />
                </a>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{j.issn}</p>
                <button
                  onClick={() => handleSelectTarget(j)}
                  type="button"
                  className={`mt-2.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                    selectedJournal?.issn === j.issn
                      ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {selectedJournal?.issn === j.issn ? "Selected" : "Select Target"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
