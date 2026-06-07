"use client";

import React, { useState, useRef } from "react";
import {
  FileText, Upload, Loader2, AlertCircle, Copy, Check,
  BookOpen, FileSearch, Layers, Hash, ChevronDown, ChevronUp
} from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

interface ExtractionResult {
  title: string | null;
  abstract: string | null;
  full_text: string;
  page_count: number;
  word_count: number;
  char_count: number;
}

function StatChip({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
      <span className="text-slate-500">{icon}</span>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function PdfExtractor() {
  const { fetchWithAuth } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState<"abstract" | "full" | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("File exceeds the 50MB limit.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithAuth(API.library.extractPdf, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
      } else {
        setError(json.message || "Extraction failed. Ensure the ML service is running.");
      }
    } catch {
      setError("Network error. Check that the ML service is running.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (type: "abstract" | "full") => {
    const text = type === "abstract" ? result?.abstract : result?.full_text;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
          <FileSearch className="text-rose-500" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">PDF Text Extractor</h2>
          <p className="text-sm text-slate-500">Extract title, abstract &amp; full text from research PDFs</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? "border-rose-400 bg-rose-50 dark:bg-rose-900/10"
            : file
            ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10"
            : "border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/20 dark:hover:bg-rose-900/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            file ? "bg-emerald-500/10" : "bg-slate-100 dark:bg-slate-800"
          }`}>
            {file ? (
              <FileText className="text-emerald-500" size={28} />
            ) : (
              <Upload className="text-slate-400" size={28} />
            )}
          </div>
          {file ? (
            <>
              <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB — click to change</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Drop a PDF here or click to browse</p>
              <p className="text-xs text-slate-400">PDF files only — max 50MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {file && !loading && (
        <button
          onClick={extract}
          className="w-full flex items-center justify-center gap-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-rose-500/20"
        >
          <FileSearch size={18} /> Extract Text from PDF
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 size={32} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium text-slate-500">Extracting text — this may take a moment for large PDFs...</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 pt-2">
          {/* Stats row */}
          <div className="flex flex-wrap gap-2">
            <StatChip label="pages" value={result.page_count} icon={<Layers size={13} />} />
            <StatChip label="words" value={result.word_count.toLocaleString()} icon={<Hash size={13} />} />
            <StatChip label="chars" value={result.char_count.toLocaleString()} icon={<BookOpen size={13} />} />
          </div>

          {/* Title */}
          {result.title && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detected Title</p>
              <p className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{result.title}</p>
            </div>
          )}

          {/* Abstract */}
          {result.abstract && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abstract</p>
                <button
                  onClick={() => copyText("abstract")}
                  className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  {copied === "abstract" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700">
                {result.abstract}
              </div>
            </div>
          )}

          {/* Full text toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFullText(v => !v)}
                className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {showFullText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showFullText ? "Hide" : "Show"} Full Text
              </button>
              {showFullText && (
                <button
                  onClick={() => copyText("full")}
                  className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                >
                  {copied === "full" ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
                </button>
              )}
            </div>
            {showFullText && (
              <textarea
                readOnly
                value={result.full_text}
                rows={20}
                className="w-full bg-slate-950 text-slate-300 text-xs font-mono p-4 rounded-xl border border-slate-800 resize-y leading-relaxed focus:outline-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
