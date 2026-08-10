"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, Layers, Star, AlertTriangle } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

// Backend contract:
// POST /assistant/summarize { scope, journal?, ids?[] }
//   -> { data: { overview, themes:[{theme,summary,papers:[]}], notable:[{id,title,why}], doc_count, degraded } }

type SummaryScope = "my_library" | "all" | "journal" | "ids";

interface Theme {
  theme: string;
  summary: string;
  papers: (string | number)[];
}

interface Notable {
  id: string | number;
  title: string;
  why: string;
}

interface SummaryResult {
  overview: string;
  themes: Theme[];
  notable: Notable[];
  doc_count: number;
  degraded: boolean;
}

interface VolumeSummaryProps {
  onClose: () => void;
  scope?: SummaryScope;
  journal?: string;
  ids?: number[];
}

export default function VolumeSummary({
  onClose,
  scope = "my_library",
  journal,
  ids,
}: VolumeSummaryProps) {
  const { fetchWithAuth } = useApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);

  const scopeLabel =
    scope === "my_library"
      ? "My Library"
      : scope === "all"
      ? "All Papers"
      : scope === "journal"
      ? journal || "Journal"
      : "Selected Papers";

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { scope };
      if (scope === "journal" && journal) body.journal = journal;
      if (scope === "ids" && ids) body.ids = ids;

      const res = await fetchWithAuth(API.assistant.summarize, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to generate summary");
      }
      setResult(json.data as SummaryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, scope, journal, ids]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white">
                  Volume Summary
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {scopeLabel}
                  {result ? ` · ${result.doc_count} document${result.doc_count === 1 ? "" : "s"}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary rounded-2xl transition-all"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                <RefreshCw className="animate-spin text-primary" size={32} />
                <p className="font-serif italic text-lg">Reading across your collection...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">
                  Couldn&apos;t build the summary
                </h3>
                <p className="text-slate-500 max-w-md mb-6">{error}</p>
                <button
                  onClick={loadSummary}
                  className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  Try again
                </button>
              </div>
            ) : result ? (
              <>
                {result.degraded && (
                  <div className="flex items-start gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Limited mode — the AI model was unavailable, so this is an extractive summary
                      built directly from your documents.
                    </span>
                  </div>
                )}

                {result.doc_count === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                    <Layers size={40} className="mb-4 text-slate-300" />
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">
                      Nothing to summarize yet
                    </h3>
                    <p className="max-w-md">
                      Add papers to your library and try again to get an AI-generated overview.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Overview */}
                    {result.overview && (
                      <section>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          Overview
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {result.overview}
                        </p>
                      </section>
                    )}

                    {/* Themes */}
                    {result.themes?.length > 0 && (
                      <section>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <Layers size={13} /> Themes
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {result.themes.map((t, i) => (
                            <div
                              key={`${t.theme}-${i}`}
                              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                            >
                              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                                {t.theme}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                                {t.summary}
                              </p>
                              {t.papers?.length > 0 && (
                                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide">
                                  {t.papers.length} paper{t.papers.length === 1 ? "" : "s"}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Notable */}
                    {result.notable?.length > 0 && (
                      <section>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <Star size={13} /> Notable Works
                        </h3>
                        <div className="space-y-2">
                          {result.notable.map((n, i) => (
                            <div
                              key={`${n.id}-${i}`}
                              className="p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 border-l-4 border-l-secondary"
                            >
                              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                                {n.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {n.why}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
