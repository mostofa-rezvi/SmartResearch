"use client";

import React, { useState } from "react";
import { Quote, Copy, Check, Loader2, Sparkles } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

type CitationFormat = "bibtex" | "apa" | "ieee";

const FORMAT_LABELS: Record<CitationFormat, string> = {
  bibtex: "BibTeX",
  apa: "APA 7th",
  ieee: "IEEE",
};

export function CitationGenerator() {
  const { fetchWithAuth } = useApi();
  const [format, setFormat] = useState<CitationFormat>("bibtex");
  const [form, setForm] = useState({
    title: "",
    authors: "",
    journal: "",
    year: "",
    doi: "",
    volume: "",
    issue: "",
    pages: "",
  });
  const [citation, setCitation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const savedCitation = localStorage.getItem("publication_generated_citation");
    if (savedCitation) {
      setCitation(savedCitation);
    }
    const savedForm = localStorage.getItem("publication_citation_form");
    if (savedForm) {
      try {
        setForm(JSON.parse(savedForm));
      } catch (e) {}
    }
    const savedFormat = localStorage.getItem("publication_citation_format");
    if (savedFormat) {
      setFormat(savedFormat as CitationFormat);
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const generate = async () => {
    if (!form.title.trim() || !form.authors.trim()) {
      setError("Title and authors are required.");
      return;
    }
    setLoading(true);
    setError(null);
    setCitation(null);
    try {
      const payload = {
        title: form.title,
        authors: form.authors.split(",").map(a => a.trim()).filter(Boolean),
        journal: form.journal || undefined,
        year: form.year ? parseInt(form.year) : undefined,
        doi: form.doi || undefined,
        volume: form.volume || undefined,
        issue: form.issue || undefined,
        pages: form.pages || undefined,
        format,
      };
      const res = await fetchWithAuth(API.publications.cite, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data?.citation) {
        const text = json.data.citation;
        setCitation(text);
        localStorage.setItem("publication_generated_citation", text);
        localStorage.setItem("publication_citation_form", JSON.stringify(form));
        localStorage.setItem("publication_citation_format", format);
        window.dispatchEvent(new Event("publication_citation_changed"));
      } else {
        setError(json.message || "Generation failed. Is the ML service running?");
      }
    } catch {
      setError("Network error. Ensure the ML service is running with GEMINI_API_KEY set.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!citation) return;
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <Quote className="text-indigo-500" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Citation Generator</h2>
          <p className="text-sm text-slate-500">AI-powered citation formatting via Gemini</p>
        </div>
      </div>

      {/* Format selector */}
      <div className="flex gap-2">
        {(Object.keys(FORMAT_LABELS) as CitationFormat[]).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
              format === f
                ? "bg-indigo-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {FORMAT_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Paper Title *</label>
          <input
            value={form.title}
            onChange={e => handleChange("title", e.target.value)}
            placeholder="e.g. Attention Is All You Need"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Authors * <span className="normal-case font-normal">(comma-separated)</span></label>
          <input
            value={form.authors}
            onChange={e => handleChange("authors", e.target.value)}
            placeholder="e.g. Vaswani, Ashish, Shazeer, Noam, Parmar, Niki"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Journal / Conference</label>
          <input
            value={form.journal}
            onChange={e => handleChange("journal", e.target.value)}
            placeholder="e.g. Advances in Neural Information Processing Systems"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">DOI</label>
          <input
            value={form.doi}
            onChange={e => handleChange("doi", e.target.value)}
            placeholder="e.g. 10.48550/arXiv.1706.03762"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Year</label>
          <input
            type="number"
            value={form.year}
            onChange={e => handleChange("year", e.target.value)}
            placeholder="e.g. 2017"
            min="1900" max="2099"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pages</label>
          <input
            value={form.pages}
            onChange={e => handleChange("pages", e.target.value)}
            placeholder="e.g. 6000–6010"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-indigo-500/20"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Generating with Gemini...</>
        ) : (
          <><Sparkles size={18} /> Generate {FORMAT_LABELS[format]} Citation</>
        )}
      </button>

      {/* Output */}
      {citation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Generated Citation</span>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
          <pre className="bg-slate-950 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
            {citation}
          </pre>
        </div>
      )}
    </div>
  );
}
