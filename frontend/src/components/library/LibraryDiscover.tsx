"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search, Download, User, Sparkles } from "lucide-react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { ITEM_TYPE_META, ITEM_TYPE_ORDER, typeLabel } from "./libraryTypes";

interface DiscoverItem {
  id: string | number;
  item_type: string;
  title: string;
  abstract?: string | null;
  authors?: string | null;
  owner_name?: string | null;
  file_url?: string | null;
  _score?: number;
}

/**
 * Discover shared library content across ALL users (Module 4 "upload and discover").
 * Browses recent shared items or runs a semantic full-text search, with owner
 * attribution and an authenticated PDF download.
 */
export function LibraryDiscover() {
  const { fetchWithAuth } = useApi();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      const res = await fetchWithAuth(`${API.library.discover}?${params.toString()}`);
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, type, fetchWithAuth]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const download = async (id: string | number, title: string) => {
    // The stored PDF isn't a public URL — stream it through the authenticated backend.
    const res = await fetchWithAuth(API.library.downloadItem(id));
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9._-]+/gi, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-black text-slate-900 dark:text-white">Discover shared research</h3>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Semantic search across everyone's uploads…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none text-sm"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm outline-none"
        >
          <option value="">All types</option>
          {ITEM_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>{typeLabel(t)}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90">
          Search
        </button>
      </form>

      <div className="space-y-3">
        {loading && <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">No shared items found.</p>
        )}
        {items.map((it) => {
          const meta = ITEM_TYPE_META[it.item_type] || ITEM_TYPE_META.paper;
          return (
            <div key={it.id} className={`bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 border-l-4 ${meta.accent} shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badge}`}>{meta.label}</span>
                    {typeof it._score === "number" && (
                      <span className="text-[10px] text-slate-400">match {it._score.toFixed(2)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{it.title}</h4>
                  {it.abstract && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{it.abstract}</p>}
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                    <User size={12} /> {it.owner_name || "Unknown"}
                    {it.authors ? <span className="truncate">· {it.authors}</span> : null}
                  </div>
                </div>
                {it.file_url && (
                  <button
                    onClick={() => download(it.id, it.title)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <Download size={13} /> PDF
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
