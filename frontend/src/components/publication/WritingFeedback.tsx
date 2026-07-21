"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Star, AlertCircle } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

interface FeedbackItem {
  dimension: string;
  score: number;
  comment: string;
  suggestions: string[];
}

interface FeedbackData {
  overall_score: number;
  summary: string;
  items: FeedbackItem[];
  generated_by: string;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
  return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className={`text-xs font-black w-6 text-right ${SCORE_COLOR(score).split(" ")[0]}`}>
        {score}
      </span>
    </div>
  );
}

export function WritingFeedback() {
  const { fetchWithAuth } = useApi();
  const [abstract, setAbstract] = useState("");
  const [title, setTitle] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const savedFeedback = localStorage.getItem("publication_ai_feedback");
    if (savedFeedback) {
      try {
        setFeedback(JSON.parse(savedFeedback));
      } catch (e) {}
    }
    const savedInputs = localStorage.getItem("publication_feedback_inputs");
    if (savedInputs) {
      try {
        const parsed = JSON.parse(savedInputs);
        if (parsed.abstract) setAbstract(parsed.abstract);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.researchArea) setResearchArea(parsed.researchArea);
      } catch (e) {}
    }
  }, []);

  const submit = async () => {
    if (abstract.trim().length < 50) {
      setError("Please enter at least 50 characters of your abstract.");
      return;
    }
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetchWithAuth(API.publications.feedback, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abstract,
          title: title || undefined,
          research_area: researchArea || undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFeedback(json.data);
        localStorage.setItem("publication_ai_feedback", JSON.stringify(json.data));
        localStorage.setItem(
          "publication_feedback_inputs",
          JSON.stringify({ abstract, title, researchArea })
        );
        window.dispatchEvent(new Event("publication_feedback_changed"));
      } else {
        setError(json.message || "Feedback generation failed.");
      }
    } catch {
      setError("Network error. Ensure the ML service is running with HF_API_TOKEN set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
          <Sparkles className="text-violet-500" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Writing Feedback</h2>
          <p className="text-sm text-slate-500">Get structured peer-review style AI feedback</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Paper Title <span className="normal-case font-normal">(optional)</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Your paper title..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Research Area <span className="normal-case font-normal">(optional)</span></label>
          <input
            value={researchArea}
            onChange={e => setResearchArea(e.target.value)}
            placeholder="e.g. Machine Learning, Bioinformatics, Physics..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Abstract *</label>
          <textarea
            value={abstract}
            onChange={e => { setAbstract(e.target.value); setError(null); }}
            rows={7}
            placeholder="Paste your abstract here (minimum 50 characters)..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{abstract.length} characters</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-violet-500/20"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Analyzing…</>
        ) : (
          <><Sparkles size={18} /> Get AI Feedback</>
        )}
      </button>

      {/* Feedback Results */}
      {feedback && (
        <div className="space-y-5 pt-2">
          {/* Overall Score */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${SCORE_COLOR(feedback.overall_score)}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl ${SCORE_COLOR(feedback.overall_score).split(" ").slice(1).join(" ")}`}>
              {feedback.overall_score}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Overall Score</p>
              <p className="font-semibold text-sm leading-snug">{feedback.summary}</p>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="space-y-4">
            {feedback.items.map(item => (
              <div key={item.dimension} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.dimension}</h4>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${SCORE_COLOR(item.score)}`}>
                    {item.score}/10
                  </span>
                </div>
                <ScoreBar score={item.score} />
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.comment}</p>
                {item.suggestions.length > 0 && (
                  <ul className="space-y-1.5">
                    {item.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-500">
                        <span className="text-violet-500 font-bold mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-slate-400">
            Feedback generated by {feedback.generated_by} · For guidance only — always seek domain expert review
          </p>
        </div>
      )}
    </div>
  );
}
