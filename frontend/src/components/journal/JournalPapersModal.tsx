"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, BookOpen, ExternalLink, Bookmark, Download,
  ChevronDown, ChevronUp, Globe, Quote,
  Filter, ArrowUpDown, BookMarked, FileText, Users,
  Calendar, TrendingUp, Unlock, Lock, Tag, Trash2
} from "lucide-react";
import { OPENALEX_BASE, OPENALEX_EMAIL, API } from "@/config/api";
import { useApi, useAuth } from "@/context/AuthContext";


// ---------- Types ----------

interface Journal {
  id: number;
  name: string;
  issn: string;
  category: string;
  quality_tier: string;
  publisher: string;
  sjr_score?: number;
  is_open_access: boolean;
  year: number;
  homepage_url?: string;
}

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

type SortOption = "cited_by_count:desc" | "publication_year:desc" | "publication_year:asc";

interface Props {
  journal: Journal;
  onClose: () => void;
}

// ---------- Helpers ----------

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

function formatIssnForOpenAlex(issn?: string): string | null {
  if (!issn) return null;
  const parts = issn.split(/[\s,;/]+/);
  const formattedParts = parts.map(part => {
    const clean = part.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return part;
  }).filter(Boolean);

  return formattedParts.length > 0 ? formattedParts.join('|') : null;
}

function getPaperUrl(paper: Paper): string {
  return paper.open_access?.oa_url
    ?? paper.primary_location?.landing_page_url
    ?? (paper.doi ? `https://doi.org/${paper.doi.replace("https://doi.org/", "")}` : "");
}

function exportPapersToCSV(papers: Paper[], journalName: string) {
  const headers = [
    "Title", "Authors", "Year", "DOI", "Journal",
    "Citations", "Open Access", "OA URL", "Type", "Abstract", "Concepts"
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = papers.map(p => [
    escape(p.title),
    escape(formatAuthors(p.authorships)),
    p.publication_year ?? "",
    escape(p.doi ?? ""),
    escape(journalName),
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
  link.setAttribute("download", `${journalName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_papers_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


function PaperCard({
  paper,
  isSaved,
  onToggleSave,
  onTrackView,
}: {
  paper: Paper;
  isSaved: boolean;
  onToggleSave: (p: Paper) => void;
  onTrackView: (p: Paper) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const abstract = decodeAbstract(paper.abstract_inverted_index);
  const url = getPaperUrl(paper);
  const topConcepts = paper.concepts?.filter(c => c.score > 0.3).slice(0, 4) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 hover:border-primary/30 hover:shadow-lg transition-all"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {paper.publication_year && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded uppercase">
                <Calendar size={8} /> {paper.publication_year}
              </span>
            )}
            {paper.open_access?.is_oa ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                <Unlock size={8} /> Open Access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded uppercase">
                <Lock size={8} /> Closed
              </span>
            )}
            {paper.type && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded uppercase">
                <FileText size={8} /> {paper.type}
              </span>
            )}
            {paper.cited_by_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                <Quote size={8} /> {paper.cited_by_count.toLocaleString()} citations
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="hover:underline underline-offset-2" onClick={() => onTrackView(paper)}>
                {paper.title || "Untitled"}
              </a>
            ) : (
              paper.title || "Untitled"
            )}
          </h4>

          {/* Authors */}
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Users size={9} className="shrink-0" />
            {formatAuthors(paper.authorships)}
          </p>

          {/* Abstract toggle */}
          {abstract && (
            <div className="mb-2">
              <p className={`text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
                {abstract}
              </p>
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors"
              >
                {expanded ? <><ChevronUp size={10} /> Less</> : <><ChevronDown size={10} /> Read abstract</>}
              </button>
            </div>
          )}

          {/* Concepts */}
          {topConcepts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {topConcepts.map(c => (
                <span key={c.display_name} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  <Tag size={7} /> {c.display_name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
              title="Open paper"
              onClick={() => onTrackView(paper)}
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => onToggleSave(paper)}
            className={`p-2 rounded-lg transition-all ${isSaved
                ? "bg-secondary text-white shadow-md shadow-secondary/20"
                : "text-slate-400 hover:text-secondary hover:bg-secondary/5"
              }`}
            title={isSaved ? "Remove from saved" : "Save paper"}
          >
            <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------- Saved Papers Panel ----------

function SavedPapersPanel({
  papers,
  journalName,
  onRemove,
  onClose,
  onTrackView,
  onTrackDownload,
}: {
  papers: Paper[];
  journalName: string;
  onRemove: (id: string) => void;
  onClose: () => void;
  onTrackView: (p: Paper) => void;
  onTrackDownload: (p: Paper) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookMarked size={20} className="text-secondary" />
            Saved Papers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{papers.length} paper{papers.length !== 1 ? "s" : ""} saved</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {papers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Bookmark size={28} />
            </div>
            <p className="text-sm font-bold text-slate-500">No papers saved yet</p>
            <p className="text-xs text-slate-400 mt-1">Click the bookmark icon on any paper</p>
          </div>
        ) : (
          papers.map(p => (
            <div key={p.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-secondary/30 transition-all">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 mb-1">
                  {getPaperUrl(p) ? (
                    <a href={getPaperUrl(p)} target="_blank" rel="noreferrer" className="hover:underline" onClick={() => onTrackView(p)}>
                      {p.title || "Untitled"}
                    </a>
                  ) : (
                    p.title || "Untitled"
                  )}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span>{p.publication_year}</span>
                  {p.cited_by_count > 0 && <><span>•</span><span>{p.cited_by_count.toLocaleString()} citations</span></>}
                  {p.open_access?.is_oa && <span className="text-emerald-500">OA</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {getPaperUrl(p) && (
                  <a href={getPaperUrl(p)} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-primary transition-colors" onClick={() => onTrackView(p)}>
                    <ExternalLink size={12} />
                  </a>
                )}
                <button onClick={() => onRemove(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
        <button
          onClick={() => {
            exportPapersToCSV(papers, journalName);
            papers.forEach(p => onTrackDownload(p));
          }}
          disabled={papers.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary to-secondary text-white text-sm font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Download size={16} />
          Download CSV ({papers.length} papers)
        </button>
        {papers.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`Remove all ${papers.length} saved papers?`)) papers.forEach(p => onRemove(p.id));
            }}
            className="w-full py-2.5 text-xs font-bold text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            Clear all saved papers
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Main Modal ----------

export default function JournalPapersModal({ journal, onClose }: Props) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [oaOnly, setOaOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("cited_by_count:desc");

  // Saved papers (stored in localStorage per journal ISSN)
  const savedKey = `saved_papers_${journal.issn || journal.id}`;
  const [savedPapers, setSavedPapers] = useState<Paper[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(savedKey) ?? "[]"); }
    catch { return []; }
  });
  const [showSaved, setShowSaved] = useState(false);

  const { fetchWithAuth } = useApi();
  const { token } = useAuth();

  const trackPaperEvent = useCallback(async (paper: Paper, action: 'view' | 'bookmark' | 'download') => {
    if (!token) return;
    try {
      await fetchWithAuth(API.users.history, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: paper.id,
          paper_title: paper.title || "Untitled",
          paper_doi: paper.doi || "",
          action
        })
      });
    } catch (err) {
      console.error("Failed to track paper action:", err);
    }
  }, [token, fetchWithAuth]);

  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync saved to localStorage
  useEffect(() => {
    localStorage.setItem(savedKey, JSON.stringify(savedPapers));
  }, [savedPapers, savedKey]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch papers
  const fetchPapers = useCallback(async (pageNum: number, isReset = false) => {
    const formattedIssn = formatIssnForOpenAlex(journal.issn);
    if (!formattedIssn) {
      setError("This journal has no valid ISSN — cannot look up papers.");
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    isReset ? setLoading(true) : setLoadingMore(true);
    setError(null);

    try {
      const filters: string[] = [`primary_location.source.issn:${formattedIssn}`];
      if (oaOnly) filters.push("is_oa:true");
      if (yearFilter) filters.push(`publication_year:${yearFilter}`);

      const params = new URLSearchParams({
        filter: filters.join(","),
        "per-page": "20",
        page: pageNum.toString(),
        sort,
        select: "id,doi,title,publication_year,cited_by_count,open_access,authorships,abstract_inverted_index,concepts,type,primary_location",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (OPENALEX_EMAIL) params.set("mailto", OPENALEX_EMAIL);

      const res = await fetch(`${OPENALEX_BASE}/works?${params}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`OpenAlex returned ${res.status}`);
      const json = await res.json();

      const newPapers: Paper[] = json.results ?? [];
      const total: number = json.meta?.count ?? 0;

      setPapers(prev => isReset ? newPapers : [...prev, ...newPapers]);
      setTotalCount(total);
      setHasMore(pageNum * 20 < total);
      setPage(pageNum + 1);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Failed to load papers. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [journal.issn, debouncedSearch, oaOnly, yearFilter, sort]);

  // Reset & fetch when filters change
  useEffect(() => {
    setPapers([]);
    setPage(1);
    setHasMore(true);
    fetchPapers(1, true);
  }, [debouncedSearch, oaOnly, yearFilter, sort, journal.issn]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      fetchPapers(page);
    }
  }, [loadingMore, hasMore, page, fetchPapers]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => { if (el) el.removeEventListener("scroll", handleScroll); };
  }, [handleScroll]);

  // Keyboard dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleSavePaper = (paper: Paper) => {
    setSavedPapers(prev => {
      const exists = prev.some(p => p.id === paper.id);
      return exists ? prev.filter(p => p.id !== paper.id) : [...prev, paper];
    });
  };

  const removeSavedPaper = (id: string) => {
    setSavedPapers(prev => prev.filter(p => p.id !== id));
  };

  const yearButtons = ["2025", "2024", "2023", "2022", "2021"];

  const sortLabels: Record<SortOption, string> = {
    "cited_by_count:desc": "Most Cited",
    "publication_year:desc": "Newest",
    "publication_year:asc": "Oldest",
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="journal-papers-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200]"
      />

      {/* Panel */}
      <motion.div
        key="journal-papers-panel"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        className="fixed top-0 right-0 h-full w-full md:w-2/3 z-[201] flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] shadow-2xl"
        style={{ borderRadius: "2rem 0 0 2rem" }}
      >
        <AnimatePresence mode="wait">
          {showSaved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex flex-col h-full"
            >
              <SavedPapersPanel
                papers={savedPapers}
                journalName={journal.name}
                onRemove={removeSavedPaper}
                onClose={() => setShowSaved(false)}
                onTrackView={(p) => trackPaperEvent(p, 'view')}
                onTrackDownload={(p) => trackPaperEvent(p, 'download')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* ---- Header ---- */}
              <div className="shrink-0 p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-tl-[2rem]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                        ISSN {journal.issn || "N/A"}
                      </span>
                      {journal.is_open_access && (
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Globe size={8} /> Open Access
                        </span>
                      )}
                      <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded uppercase">
                        {journal.quality_tier}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                      {journal.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {loading ? "Searching archives..." : `${totalCount.toLocaleString()} papers found`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Saved counter */}
                    <button
                      onClick={() => setShowSaved(true)}
                      className="relative flex items-center gap-2 px-3 py-2 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-colors text-xs font-bold"
                    >
                      <BookMarked size={14} />
                      <span>{savedPapers.length}</span>
                      {savedPapers.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-secondary text-white text-[8px] font-black rounded-full flex items-center justify-center">
                          {savedPapers.length > 9 ? "9+" : savedPapers.length}
                        </span>
                      )}
                    </button>

                    {/* Close */}
                    <button
                      onClick={onClose}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-3">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                    size={15}
                  />
                  <input
                    type="text"
                    placeholder="Search papers by title, author, or keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Year quick buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                      <Calendar size={9} /> Year:
                    </span>
                    {yearButtons.map(yr => (
                      <button
                        key={yr}
                        onClick={() => setYearFilter(f => f === yr ? "" : yr)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${yearFilter === yr
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5"
                          }`}
                      >
                        {yr}
                      </button>
                    ))}
                    {yearFilter && (
                      <button onClick={() => setYearFilter("")} className="text-[10px] font-bold text-red-400 hover:text-red-500 ml-1">
                        Clear
                      </button>
                    )}
                  </div>

                  {/* OA toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                    <span className="text-[10px] font-bold text-slate-500">OA only</span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={oaOnly} onChange={() => setOaOnly(v => !v)} />
                      <div className={`w-8 h-4 rounded-full transition-colors ${oaOnly ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform shadow ${oaOnly ? "translate-x-4" : ""}`} />
                      </div>
                    </div>
                  </label>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={e => setSort(e.target.value as SortOption)}
                      className="appearance-none pl-7 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 rounded-lg border-none outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {(Object.entries(sortLabels) as [SortOption, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <ArrowUpDown size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ---- Paper List ---- */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              >
                {/* Error state */}
                {error && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-400 mb-4">
                      <X size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{error}</p>
                    <button
                      onClick={() => fetchPapers(1, true)}
                      className="mt-3 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Initial loading skeleton */}
                {loading && papers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm font-semibold text-slate-400">Searching Archives...</p>
                  </div>
                )}

                {/* Empty state */}
                {!loading && !error && papers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                      <BookOpen size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">No papers found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                  </div>
                )}

                {/* Paper cards */}
                {papers.map(paper => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isSaved={savedPapers.some(p => p.id === paper.id)}
                    onToggleSave={toggleSavePaper}
                    onTrackView={(p) => trackPaperEvent(p, 'view')}
                  />
                ))}

                {/* Loading more */}
                {loadingMore && (
                  <div className="py-6 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading more...</span>
                  </div>
                )}

                {/* All loaded */}
                {!hasMore && papers.length > 0 && !loadingMore && (
                  <div className="py-6 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      All {totalCount.toLocaleString()} papers loaded
                    </p>
                  </div>
                )}
              </div>

              {/* ---- Footer: Quick Save CTA ---- */}
              {savedPapers.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="shrink-0 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {savedPapers.length} paper{savedPapers.length !== 1 ? "s" : ""} saved
                    </p>
                    <p className="text-[10px] text-slate-400">Ready to download as CSV</p>
                  </div>
                  <button
                    onClick={() => setShowSaved(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white text-xs font-black rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
                  >
                    <BookMarked size={13} /> View & Download
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </>
  );
}
