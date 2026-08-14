"use client";

/**
 * PaperPreviewModal — inline preview of a paper/library item found via search.
 * Shows title, authors, abstract and tags without leaving the page; offers a
 * link to the DOI source and to the Library when available.
 */

import React, { useState } from "react";
import { X, FileText, ExternalLink, BookOpen, Tag, BookmarkPlus, Check, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

export interface PaperPreview {
  id?: string | number | null;
  title: string;
  authors?: string;
  abstract?: string;
  doi?: string;
  tags?: string[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function PaperPreviewModal({
  paper,
  onClose,
}: {
  paper: PaperPreview;
  onClose: () => void;
}) {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const doiUrl = paper.doi
    ? paper.doi.startsWith("http")
      ? paper.doi
      : `https://doi.org/${paper.doi.replace(/^doi:/i, "")}`
    : null;

  const saveToLibrary = async () => {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const res = await fetchWithAuth(API.library.items, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type: "paper",
          title: paper.title,
          abstract: paper.abstract || "",
          authors: paper.authors || "",
          doi: paper.doi || "",
          tags: paper.tags || [],
        }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col glass-neu-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[color:var(--color-border)]">
          <div className="flex gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Paper</span>
              <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white leading-snug">{paper.title}</h2>
              {paper.authors && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{paper.authors}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Abstract</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {paper.abstract && paper.abstract.trim() ? paper.abstract : "No abstract available for this paper."}
            </p>
          </div>

          {paper.tags && paper.tags.length > 0 && (
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Tag size={12} /> Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {paper.tags.map((t, i) => (
                  <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary dark:text-white">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {paper.doi && (
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">DOI</h3>
              <p className="text-sm font-mono text-slate-600 dark:text-slate-300 break-all">{paper.doi}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-t border-[color:var(--color-border)]">
          {token && (
            <button
              onClick={saveToLibrary}
              disabled={saveState === "saving" || saveState === "saved"}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-colors disabled:cursor-default ${
                saveState === "saved"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary text-white hover:bg-primary-700 disabled:opacity-70"
              }`}
            >
              {saveState === "saved" ? (
                <><Check size={15} /> Saved to Library</>
              ) : saveState === "saving" ? (
                <><Loader2 size={15} className="animate-spin" /> Saving…</>
              ) : (
                <><BookmarkPlus size={15} /> Save to Library</>
              )}
            </button>
          )}
          {doiUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 neu-btn text-ink-700 text-sm font-bold"
            >
              <ExternalLink size={15} /> View full paper
            </a>
          )}
          <Link
            href="/library"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 neu-btn text-ink-700 text-sm font-bold"
          >
            <BookOpen size={15} /> Browse Library
          </Link>
          {saveState === "error" && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-error ml-auto">
              <AlertTriangle size={13} /> Couldn’t save. Try again.
            </span>
          )}
          {saveState === "saved" && (
            <Link
              href="/library"
              onClick={onClose}
              className="text-xs font-semibold text-primary dark:text-white ml-auto hover:underline"
            >
              View in your Library →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
