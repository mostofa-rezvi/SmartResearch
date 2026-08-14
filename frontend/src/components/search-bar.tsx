"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Users, FileText, FolderGit2, MessageSquare, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/context/authStorage";
import PaperPreviewModal, { type PaperPreview } from "@/components/discovery/PaperPreviewModal";

interface Suggestion {
  id: string | number | null;
  title: string;
  subtitle?: string;
  type: string; // Researcher | Paper | Project | Discussion | Result
  index?: string;
  abstract?: string;
  authors?: string;
  doi?: string;
  tags?: string[];
}

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Researcher: Users,
  Paper: FileText,
  Project: FolderGit2,
  Discussion: MessageSquare,
};

const TYPE_BADGE: Record<string, string> = {
  Researcher: "bg-indigo-500/10 text-indigo-500",
  Paper: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Project: "bg-primary/10 text-primary dark:text-white",
  Discussion: "bg-purple-500/10 text-purple-500",
};

/** Where selecting a suggestion navigates. Internal entities go direct; the rest
 *  land on the full search results LIST (/results), never the DOI-only engine. */
function linkFor(s: Suggestion): string {
  switch (s.type) {
    case "Project":
      return s.id ? `/teams/${s.id}` : "/teams";
    case "Discussion":
      return s.id ? `/community/${s.id}` : "/community";
    case "Researcher":
      return s.id ? `/researchers/${s.id}` : `/results?q=${encodeURIComponent(s.title)}`;
    case "Paper":
    default:
      return `/results?q=${encodeURIComponent(s.title)}`;
  }
}

export function SearchBar({
  onQueryChange,
  suggestions: enableSuggestions = true,
  variant = "hero",
  placeholder = "Search researchers, papers, topics...",
}: {
  onQueryChange?: (q: string) => void;
  suggestions?: boolean;
  variant?: "hero" | "nav";
  placeholder?: string;
} = {}) {
  const router = useRouter();
  const isNav = variant === "nav";
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [previewPaper, setPreviewPaper] = useState<PaperPreview | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Report query up (Discovery swaps its feed for results).
  useEffect(() => {
    onQueryChange?.(debouncedQuery);
  }, [debouncedQuery, onQueryChange]);

  useEffect(() => {
    if (!enableSuggestions || !debouncedQuery.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const token = getStoredToken();
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
          setIsOpen(true);
          setActive(-1);
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery, enableSuggestions]);

  // Short queries return loose semantic matches — keep only ones that actually
  // contain what the user typed so the dropdown stays relevant.
  const q = debouncedQuery.trim().toLowerCase();
  const visible =
    q.length > 0 && q.length < 4
      ? suggestions.filter((s) => `${s.title} ${s.subtitle || ""}`.toLowerCase().includes(q))
      : suggestions;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const go = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  // Papers preview inline; everything else navigates.
  const select = (s: Suggestion) => {
    if (s.type === "Paper") {
      setIsOpen(false);
      setPreviewPaper({ id: s.id, title: s.title, authors: s.authors, abstract: s.abstract, doi: s.doi, tags: s.tags });
      return;
    }
    go(linkFor(s));
  };

  const searchAll = () => query.trim() && go(`/results?q=${encodeURIComponent(query.trim())}`);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, visible.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && visible[active]) select(visible[active]);
      else searchAll();
    } else if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <>
    <div className={isNav ? "relative flex-1 max-w-md min-w-0" : "relative w-full max-w-2xl"} ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className={`absolute ${isNav ? "left-3" : "left-4"} text-slate-400`} size={isNav ? 15 : 18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => enableSuggestions && query.trim() && visible.length > 0 && setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={
            isNav
              ? "w-full pl-9 pr-9 h-9 rounded-lg neu-inset text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary transition-all"
              : "w-full pl-12 pr-12 py-3 neu-inset focus:ring-2 focus:ring-primary outline-none transition-all"
          }
          aria-label="Search"
        />
        {isLoading && <Loader2 className={`absolute ${isNav ? "right-3" : "right-4"} text-primary dark:text-white animate-spin`} size={isNav ? 15 : 18} />}
      </div>

      {enableSuggestions && isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-[color:var(--color-border)] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="max-h-80 overflow-y-auto custom-scrollbar py-1">
            {visible.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                {isLoading ? "Searching…" : `No matches for “${query.trim()}”`}
              </div>
            ) : (
              visible.map((s, i) => {
                const Icon = TYPE_ICON[s.type] || Search;
                return (
                  <button
                    key={`${s.type}-${s.id ?? i}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(s)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      active === i ? "bg-ink-50" : "hover:bg-ink-50"
                    }`}
                  >
                    <span className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg ${TYPE_BADGE[s.type] || "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">{s.title}</span>
                      {s.subtitle && <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{s.subtitle}</span>}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{s.type}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Full-search footer */}
          <button
            type="button"
            onClick={searchAll}
            className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[color:var(--color-border)] bg-ink-50 text-sm font-bold text-primary dark:text-white hover:bg-ink-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search size={14} /> Search everything for “{query.trim()}”
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <CornerDownLeft size={12} /> Enter
            </span>
          </button>
        </div>
      )}
    </div>

    {previewPaper && <PaperPreviewModal paper={previewPaper} onClose={() => setPreviewPaper(null)} />}
    </>
  );
}
