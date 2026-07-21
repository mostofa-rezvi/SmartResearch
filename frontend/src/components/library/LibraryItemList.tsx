"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw, ExternalLink, FileText, Users, Calendar, Inbox,
} from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";
import { LibraryItem, ITEM_TYPE_ORDER, ITEM_TYPE_META, typeLabel } from "./libraryTypes";

export function LibraryItemList({ refreshKey }: { refreshKey: number }) {
  const { fetchWithAuth } = useApi();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.library.items);
      const json = await res.json();
      if (json.success) {
        setItems(Array.isArray(json.data) ? json.data : []);
      } else {
        setError(json.message || "Failed to load your library.");
      }
    } catch {
      setError("Network error while loading your library.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of items) c[it.item_type] = (c[it.item_type] || 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter(i => i.item_type === filter)),
    [items, filter],
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Inbox className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Library</h2>
            <p className="text-sm text-slate-500">{items.length} item{items.length === 1 ? "" : "s"} saved</p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
            filter === "all"
              ? "bg-primary text-white border-primary"
              : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:border-primary/30"
          }`}
        >
          All ({items.length})
        </button>
        {ITEM_TYPE_ORDER.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
              filter === t
                ? "bg-primary text-white border-primary"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:border-primary/30"
            }`}
          >
            {ITEM_TYPE_META[t].label} ({counts[t] || 0})
          </button>
        ))}
      </div>

      {error && (
        <p className="text-center text-red-500 text-sm py-6">{error}</p>
      )}

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
          <RefreshCw className="animate-spin text-primary" size={28} />
          <p className="text-sm font-medium">Loading your library...</p>
        </div>
      ) : visible.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Inbox size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Nothing here yet</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            {filter === "all"
              ? "Add a paper, dataset, note or literature review to start building your library."
              : `You haven't saved any ${typeLabel(filter).toLowerCase()} items yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(item => {
            const meta = ITEM_TYPE_META[item.item_type];
            return (
              <div
                key={item.id}
                className={`bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 border-l-4 ${meta?.accent || "border-l-primary"} hover:shadow-sm transition-all`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${meta?.badge || ""}`}>
                    {typeLabel(item.item_type)}
                  </span>
                  {item.created_at && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{item.title}</h3>

                {item.authors && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Users size={11} className="shrink-0" /> {item.authors}
                  </p>
                )}
                {item.abstract && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">{item.abstract}</p>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((tag, ti) => (
                      <span key={ti} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2.5">
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText size={12} /> PDF
                    </a>
                  )}
                  {item.doi && (
                    <a
                      href={`https://doi.org/${item.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-slate-500 hover:text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> DOI
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
