"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw, Quote, AlertTriangle, MessageCircleQuestion } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

// Backend contract:
// POST /assistant/paper-qa { item_id, question }
//   -> { data: { answer, supporting_quotes:[{quote,score}], degraded } }

interface SupportingQuote {
  quote: string;
  score: number;
}

interface PaperQAResult {
  answer: string;
  supporting_quotes: SupportingQuote[];
  degraded: boolean;
}

interface PaperQAPanelProps {
  itemId: string | number;
  title: string;
}

export default function PaperQAPanel({ itemId, title }: PaperQAPanelProps) {
  const { fetchWithAuth } = useApi();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaperQAResult | null>(null);
  const [askedQuestion, setAskedQuestion] = useState<string>("");

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAskedQuestion(q);
    try {
      const res = await fetchWithAuth(API.assistant.paperQa, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, question: q }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to answer the question");
      }
      setResult(json.data as PaperQAResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-primary/10 text-primary dark:text-white rounded-lg">
          <MessageCircleQuestion size={16} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Ask this paper</h4>
          <p className="text-[11px] text-slate-400 truncate">{title}</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What dataset did they use?"
          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="p-2.5 bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>

      {/* States */}
      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400 italic">
            <RefreshCw className="animate-spin text-primary dark:text-white" size={14} />
            Reading the paper...
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {askedQuestion && (
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Q: {askedQuestion}
                </p>
              )}

              {result.degraded && (
                <div className="flex items-start gap-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>Limited mode — showing the most relevant passages rather than a synthesized answer.</span>
                </div>
              )}

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {result.answer}
              </p>

              {result.supporting_quotes?.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Quote size={11} /> Supporting quotes
                  </h5>
                  {result.supporting_quotes.map((sq, i) => (
                    <blockquote
                      key={i}
                      className="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-secondary/40 pl-3 py-1"
                    >
                      &ldquo;{sq.quote}&rdquo;
                    </blockquote>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
