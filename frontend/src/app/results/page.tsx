"use client";

/**
 * Global search results — the list view behind the top-bar search box.
 * Pressing Enter (or "Search everything") lands here with ?q=… and shows every
 * matching paper, researcher, discussion and project from the hybrid discovery
 * search. Papers open an inline preview (with "Save to Library"); everything
 * else links to its page. (Resolving a specific DOI still lives at /search.)
 */

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, FileText, Users, MessageSquare, FolderGit2, ArrowRight,
  Hash, AlertTriangle, Compass,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";
import PaperPreviewModal, { type PaperPreview } from "@/components/discovery/PaperPreviewModal";

interface Hit {
  id: string | number;
  _index?: string;
  result_type?: "paper" | "researcher" | "post" | "project";
  title?: string;
  name?: string;
  abstract?: string;
  content?: string;
  authors?: string;
  institution?: string;
  doi?: string;
  tags?: unknown;
}

const parseTags = (t: unknown): string[] => {
  if (Array.isArray(t)) return t as string[];
  if (typeof t === "string") {
    try { const p = JSON.parse(t); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

const KIND = {
  paper: { label: "Papers", Icon: FileText, badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  researcher: { label: "Researchers", Icon: Users, badge: "bg-indigo-500/10 text-indigo-500" },
  post: { label: "Discussions", Icon: MessageSquare, badge: "bg-purple-500/10 text-purple-500" },
  project: { label: "Projects", Icon: FolderGit2, badge: "bg-primary/10 text-primary dark:text-white" },
} as const;

function ResultsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { fetchWithAuth } = useApi();

  const [input, setInput] = useState(q);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PaperPreview | null>(null);

  useEffect(() => setInput(q), [q]);

  const runSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) { setHits([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(
        `${API.discovery.search}?query=${encodeURIComponent(term)}`,
        { skipPreloader: true }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Search failed");
      setHits(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => { runSearch(q); }, [q, runSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = input.trim();
    if (term) router.push(`/results?q=${encodeURIComponent(term)}`);
  };

  const kindOf = (h: Hit): keyof typeof KIND =>
    (h.result_type as keyof typeof KIND) ||
    (h._index === "papers" ? "paper" : h._index === "users" ? "researcher"
      : h._index === "posts" ? "post" : "project");

  const titleOf = (h: Hit) => (h.title || h.name || "Untitled").trim();

  const openPaper = (h: Hit) =>
    setPreview({
      id: h.id, title: titleOf(h), authors: h.authors,
      abstract: h.abstract, doi: h.doi, tags: parseTags(h.tags),
    });

  const linkOf = (h: Hit, kind: keyof typeof KIND): string => {
    if (kind === "researcher") return `/researchers/${h.id}`;
    if (kind === "post") return `/community/${h.id}`;
    if (kind === "project") return `/teams/${h.id}`;
    return "#";
  };

  // De-duplicate by kind + normalized title (several seeds can index the same
  // paper), keeping the first — highest-relevance — occurrence.
  const seen = new Set<string>();
  const deduped = hits.filter((h) => {
    const key = `${kindOf(h)}:${titleOf(h).toLowerCase().replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by kind, preserving relevance order within each group.
  const groups: Record<keyof typeof KIND, Hit[]> = { paper: [], researcher: [], post: [], project: [] };
  for (const h of deduped) groups[kindOf(h)].push(h);
  const order: (keyof typeof KIND)[] = ["paper", "researcher", "post", "project"];
  const hasResults = hits.length > 0;

  return (
    <div className="min-h-screen app-bg text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-6 max-w-5xl mx-auto">
        <header className="mb-8">
          <span className="mono-academic text-[10px] font-black tracking-[0.2em] text-secondary dark:text-rose-300 uppercase block mb-1">
            Search Results
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-primary dark:text-white">
            {q ? <>Results for <span className="text-secondary dark:text-rose-300 italic">“{q}”</span></> : "Search everything"}
          </h1>
        </header>

        {/* Search box */}
        <form onSubmit={submit} className="relative mb-8 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search papers, researchers, topics…"
            className="w-full pl-12 pr-28 py-3.5 neu-inset focus:ring-2 focus:ring-primary outline-none transition-all"
            aria-label="Search"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-colors">
            Search
          </button>
        </form>

        {/* States */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-error bg-error-surface border border-error/20 rounded-2xl px-4 py-3">
            <AlertTriangle size={16} /> {error}
          </div>
        ) : !hasResults ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 neu-icon text-primary dark:text-white flex items-center justify-center">
              <Compass size={26} />
            </div>
            <p className="text-lg font-serif font-black text-slate-700 dark:text-slate-200 mb-1">
              {q ? `No matches for “${q}”` : "Type something to search"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try a broader term, or{" "}
              <Link href="/search" className="text-primary dark:text-white font-semibold hover:underline">resolve a DOI</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {order.filter((k) => groups[k].length > 0).map((kind) => {
              const { label, Icon, badge } = KIND[kind];
              return (
                <section key={kind}>
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                    <Icon size={15} /> {label}
                    <span className="text-slate-300 dark:text-slate-600">· {groups[kind].length}</span>
                  </h2>
                  <div className="space-y-2.5">
                    {groups[kind].map((h) => {
                      const title = titleOf(h);
                      const subtitle = kind === "paper" ? (h.authors || "")
                        : kind === "researcher" ? (h.institution || "")
                        : (h.abstract || h.content || "");
                      const tags = parseTags(h.tags).slice(0, 4);
                      const inner = (
                        <div className="flex items-start gap-3 p-4 glass-neu-card hover:shadow-md transition-shadow cursor-pointer">
                          <span className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl ${badge}`}>
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{title}</p>
                            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{subtitle}</p>}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {tags.map((t, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-white">
                                    <Hash size={9} />{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ArrowRight size={16} className="shrink-0 text-slate-300 dark:text-slate-600 mt-1" />
                        </div>
                      );
                      return kind === "paper" ? (
                        <button key={`${kind}-${h.id}`} type="button" onClick={() => openPaper(h)} className="w-full text-left">
                          {inner}
                        </button>
                      ) : (
                        <Link key={`${kind}-${h.id}`} href={linkOf(h, kind)} className="block">
                          {inner}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {preview && <PaperPreviewModal paper={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen app-bg" />}>
      <ResultsInner />
    </Suspense>
  );
}
