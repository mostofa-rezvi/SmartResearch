"use client";

import React, { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";
import { LibrarySearchResult } from "./libraryTypes";

export function LibrarySemanticSearch() {
  const { fetchWithAuth } = useApi();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LibrarySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: "20" });
      const res = await fetchWithAuth(`${API.library.searchItems}?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data || []);
        setSearched(true);
      }
    } catch {
      // silent — keep prior results
    } finally {
      setLoading(false);
    }
  };

  const scorePct = (s?: number) => {
    if (s == null) return null;
    // _score may be a raw relevance value; clamp to a readable 0-100 for display.
    const pct = s <= 1 ? s * 100 : Math.min(s, 100);
    return `${Math.round(pct)}%`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
          <Sparkles className="text-violet-500" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Semantic Search</h2>
          <p className="text-sm text-slate-500">Search your library by meaning, not just keywords</p>
        </div>
      </div>

      <form onSubmit={search} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. transformer models for protein folding..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-6">No matching items in your library yet.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-violet-200 dark:hover:border-violet-900/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-all"
            >
              {r._score != null && (
                <div className="text-center w-12 shrink-0">
                  <div className="text-sm font-black text-violet-600 dark:text-violet-400">{scorePct(r._score)}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Match</div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{r.title}</h3>
                {r.authors && <p className="text-xs text-slate-500 mt-0.5">{r.authors}</p>}
                {r.abstract && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.abstract}</p>
                )}
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.tags.map((tag, ti) => (
                      <span key={ti} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
