"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Bookmark, ExternalLink, Trash2, Download, FileText, Calendar, Quote } from "lucide-react";

interface Author {
  author: { display_name: string };
}

interface Concept {
  display_name: string;
  score: number;
}

interface OAInfo {
  is_oa: boolean;
  oa_url: string | null;
}

interface Paper {
  id: string;
  doi: string | null;
  title: string;
  publication_year: number;
  cited_by_count: number;
  open_access: OAInfo;
  authorships: Author[];
  abstract_inverted_index?: Record<string, number[]> | null;
  concepts: Concept[];
  type: string;
  primary_location?: {
    source?: { display_name?: string };
    landing_page_url?: string | null;
  };
}

interface SavedPaperItem {
  paper: Paper;
  journalKey: string;
}

interface Props {
  onClose: () => void;
  onRefreshCount: () => void;
}

function decodeAbstract(index: Record<string, number[]> | null | undefined): string {
  if (!index) return "";
  const words: [string, number][] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) {
      words.push([word, pos]);
    }
  }
  return words.sort((a, b) => a[1] - b[1]).map(([w]) => w).join(" ");
}

function formatAuthors(authorships: Author[]): string {
  if (!authorships || authorships.length === 0) return "Unknown authors";
  const names = authorships.slice(0, 3).map(a => a.author?.display_name ?? "Unknown");
  return authorships.length > 3 ? `${names.join(", ")} et al.` : names.join(", ");
}

function getPaperUrl(paper: Paper): string {
  return paper.open_access?.oa_url
    ?? paper.primary_location?.landing_page_url
    ?? (paper.doi ? `https://doi.org/${paper.doi.replace("https://doi.org/", "")}` : "");
}

export default function AllSavedPapersModal({ onClose, onRefreshCount }: Props) {
  // Load papers from localStorage
  const loadPapers = (): SavedPaperItem[] => {
    if (typeof window === "undefined") return [];
    const items: SavedPaperItem[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("saved_papers_")) {
          const list = JSON.parse(localStorage.getItem(key) ?? "[]");
          if (Array.isArray(list)) {
            list.forEach((p: Paper) => {
              items.push({ paper: p, journalKey: key });
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to load saved papers", err);
    }
    return items;
  };

  const [savedItems, setSavedItems] = useState<SavedPaperItem[]>(loadPapers);

  const handleRemove = (paperId: string, journalKey: string) => {
    try {
      const list = JSON.parse(localStorage.getItem(journalKey) ?? "[]");
      if (Array.isArray(list)) {
        const updated = list.filter((p: Paper) => p.id !== paperId);
        if (updated.length === 0) {
          localStorage.removeItem(journalKey);
        } else {
          localStorage.setItem(journalKey, JSON.stringify(updated));
        }
        // Reload list
        const reloaded = loadPapers();
        setSavedItems(reloaded);
        onRefreshCount();
      }
    } catch (err) {
      console.error("Failed to remove paper", err);
    }
  };

  const handleExport = () => {
    if (savedItems.length === 0) return;
    const headers = [
      "Title", "Authors", "Year", "DOI", "Journal",
      "Citations", "Open Access", "OA URL", "Type", "Abstract", "Concepts"
    ];

    const escape = (v: unknown) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = savedItems.map(({ paper: p }) => [
      escape(p.title),
      escape(formatAuthors(p.authorships)),
      p.publication_year ?? "",
      escape(p.doi ?? ""),
      escape(p.primary_location?.source?.display_name ?? ""),
      p.cited_by_count ?? 0,
      p.open_access?.is_oa ? "Yes" : "No",
      escape(p.open_access?.oa_url ?? ""),
      escape(p.type ?? ""),
      escape(decodeAbstract(p.abstract_inverted_index)),
      escape(p.concepts?.slice(0, 5).map(c => c.display_name).join("; ") ?? ""),
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `all_saved_papers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (!window.confirm("Are you sure you want to clear all saved papers?")) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("saved_papers_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      setSavedItems([]);
      onRefreshCount();
    } catch (err) {
      console.error("Failed to clear all papers", err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="relative h-full w-full md:w-2/3 bg-[#F8FAFC] dark:bg-[#0F172A] shadow-2xl flex flex-col z-[201]"
        style={{ borderRadius: "2rem 0 0 2rem" }}
      >
        {/* Header */}
        <div className="shrink-0 p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-tl-[2rem] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark size={20} className="text-primary" />
              Saved Papers Library
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {savedItems.length} paper{savedItems.length !== 1 ? "s" : ""} saved across all journals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {savedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Bookmark size={28} />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No saved papers found</p>
              <p className="text-xs text-slate-400 mt-1">Open a journal and bookmark papers to populate this list</p>
            </div>
          ) : (
            savedItems.map(({ paper: p, journalKey }) => (
              <div 
                key={p.id} 
                className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-primary transition-colors">
                    {getPaperUrl(p) ? (
                      <a href={getPaperUrl(p)} target="_blank" rel="noreferrer" className="hover:underline">
                        {p.title || "Untitled"}
                      </a>
                    ) : (
                      p.title || "Untitled"
                    )}
                  </h4>

                  {/* Authors */}
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {formatAuthors(p.authorships)}
                  </p>

                  {/* Badges / Source info */}
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-slate-400">
                    {p.primary_location?.source?.display_name && (
                      <span className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-primary/70">
                        {p.primary_location.source.display_name}
                      </span>
                    )}
                    {p.publication_year && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded uppercase">
                        <Calendar size={8} /> {p.publication_year}
                      </span>
                    )}
                    {p.cited_by_count > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded uppercase">
                        <Quote size={8} /> {p.cited_by_count.toLocaleString()} citations
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {getPaperUrl(p) && (
                    <a 
                      href={getPaperUrl(p)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                      title="Open Paper"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleRemove(p.id, journalKey)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedItems.length > 0 && (
          <div className="shrink-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-bl-[2rem] flex items-center gap-3">
            <button
              onClick={handleClearAll}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black rounded-xl transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Download size={14} />
              Export Saved Papers to CSV ({savedItems.length})
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
