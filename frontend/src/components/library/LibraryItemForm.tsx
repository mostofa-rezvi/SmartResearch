"use client";

import React, { useRef, useState } from "react";
import {
  Plus, Loader2, AlertCircle, CheckCircle2, Upload, FileText, X,
} from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";
import { ITEM_TYPE_ORDER, ITEM_TYPE_META, LibraryItem } from "./libraryTypes";

export function LibraryItemForm({ onCreated }: { onCreated: (item: LibraryItem) => void }) {
  const { fetchWithAuth } = useApi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [itemType, setItemType] = useState<string>("paper");
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [authors, setAuthors] = useState("");
  const [doi, setDoi] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setTitle("");
    setAbstract("");
    setAuthors("");
    setDoi("");
    setTags("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File exceeds the 50MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    const tagsArr = tags.split(",").map(t => t.trim()).filter(Boolean);

    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("item_type", itemType);
        fd.append("title", title.trim());
        if (abstract.trim()) fd.append("abstract", abstract.trim());
        if (authors.trim()) fd.append("authors", authors.trim());
        if (doi.trim()) fd.append("doi", doi.trim());
        tagsArr.forEach(t => fd.append("tags", t));
        fd.append("file", file);
        res = await fetchWithAuth(API.library.items, { method: "POST", body: fd });
      } else {
        res = await fetchWithAuth(API.library.items, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_type: itemType,
            title: title.trim(),
            abstract: abstract.trim() || undefined,
            authors: authors.trim() || undefined,
            doi: doi.trim() || undefined,
            tags: tagsArr,
          }),
        });
      }

      const json = await res.json();
      if (json.success && json.data) {
        setSuccess(true);
        onCreated(json.data);
        reset();
        setTimeout(() => setSuccess(false), 2500);
      } else {
        setError(json.message || "Failed to add item to your library.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Plus className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add to Library</h2>
          <p className="text-sm text-slate-500">Save a paper, dataset, note or literature review</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Type</label>
          <select
            value={itemType}
            onChange={e => setItemType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {ITEM_TYPE_ORDER.map(t => (
              <option key={t} value={t}>{ITEM_TYPE_META[t].label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter a title..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Abstract */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Abstract / Summary</label>
          <textarea
            value={abstract}
            onChange={e => setAbstract(e.target.value)}
            rows={4}
            placeholder="Optional abstract or notes..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/40 resize-y"
          />
        </div>

        {/* Authors */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Authors</label>
          <input
            value={authors}
            onChange={e => setAuthors(e.target.value)}
            placeholder="e.g. Jane Doe, John Smith"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* DOI */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">DOI</label>
          <input
            value={doi}
            onChange={e => setDoi(e.target.value)}
            placeholder="10.xxxx/xxxxx (optional)"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tags</label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="Comma-separated, e.g. nlp, transformers"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Optional PDF */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Attach PDF (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2.5">
              <FileText size={18} className="text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:border-primary/40 hover:text-primary transition-all"
            >
              <Upload size={16} /> Choose a PDF
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl">
            <CheckCircle2 size={16} className="shrink-0" />
            Added to your library.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 bg-primary hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-primary/20 disabled:opacity-60"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Plus size={18} /> Add Item</>}
        </button>
      </form>
    </div>
  );
}
