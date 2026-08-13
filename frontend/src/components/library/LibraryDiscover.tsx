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
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    // Wrap everything: a dropped connection makes fetch reject with a network
    // TypeError ("Failed to fetch"), which would otherwise bubble up as an
    // unhandled promise rejection instead of failing gracefully here.
    setDownloadingId(id);
    setError(null);
    try {
      const res = await fetchWithAuth(API.library.downloadItem(id));
      if (!res.ok) {
        setError("Download failed — the file may no longer be available.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9._-]+/gi, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="glass-neu-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-primary dark:text-white" />
        <h3 className="font-black text-slate-900 dark:text-white">Discover shared research</h3>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Semantic search across everyone's uploads…"
            className="w-full pl-9 pr-3 py-2.5 neu-inset focus:ring-2 focus:ring-primary outline-none text-sm"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2.5 neu-inset text-sm outline-none"
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

      {error && (
        <div className="mb-4 px-3 py-2 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading && <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />}
        {!loading && items.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">No shared items found.</p>
        )}
        {items.map((it) => {
          const meta = ITEM_TYPE_META[it.item_type] || ITEM_TYPE_META.paper;
          return (
            <div key={it.id} className={`glass-neu-card p-4 border-l-4 ${meta.accent}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badge}`}>{meta.label}</span>
                    {typeof it._score === "number" && (
                      <span className="text-[10px] text-slate-400">match {it._score.toFixed(2)}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{it.title}</h4>
                  {it.abstract && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{it.abstract}</p>}
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
                    <User size={12} /> {it.owner_name || "Unknown"}
                    {it.authors ? <span className="truncate">· {it.authors}</span> : null}
                  </div>
                </div>
                {it.file_url && (
                  <button
                    onClick={() => download(it.id, it.title)}
                    disabled={downloadingId === it.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 neu-btn text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={13} /> {downloadingId === it.id ? "…" : "PDF"}
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
