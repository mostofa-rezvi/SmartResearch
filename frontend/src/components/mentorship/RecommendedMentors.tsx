"use client";

import React, { useEffect, useState } from "react";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, Sparkles, Send, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { TrustTierBadge } from "./TrustTierBadge";

interface Recommendation {
  slot_id: number;
  domain: string;
  title: string;
  mentor_id: number;
  mentor_name: string;
  mentor_avatar?: string;
  trust_tier?: string;
  match_score: number; // 0-100
}

export function RecommendedMentors() {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-slot request UI state
  const [openFor, setOpenFor] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API.mentorship.recommend);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        }
      } catch (err) {
        console.error("Failed to load mentor recommendations:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, fetchWithAuth]);

  const handleRequest = async (rec: Recommendation) => {
    setSendingId(rec.slot_id);
    setError(null);
    try {
      const res = await fetchWithAuth(API.mentorship.request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentor_id: rec.mentor_id,
          slot_id: rec.slot_id,
          message: message.trim() || `Hi ${rec.mentor_name}, I'd love your mentorship on ${rec.domain}.`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to send request");
      }
      setSentIds((prev) => new Set(prev).add(rec.slot_id));
      setOpenFor(null);
      setMessage("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin h-7 w-7 text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500">
        No mentor recommendations yet. Check back after completing your profile.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((rec) => {
          const sent = sentIds.has(rec.slot_id);
          return (
            <div
              key={rec.slot_id}
              className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {rec.mentor_avatar ? (
                    <Image
                      src={rec.mentor_avatar}
                      alt={rec.mentor_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                      {rec.mentor_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{rec.mentor_name}</h4>
                    <TrustTierBadge tier={rec.trust_tier} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{rec.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.domain}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-black">
                    <Sparkles size={12} />
                    {Math.round(rec.match_score)}% match
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {sent ? (
                  <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                    <CheckCircle2 size={16} /> Request sent
                  </div>
                ) : openFor === rec.slot_id ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      rows={3}
                      placeholder={`Hi ${rec.mentor_name}, I'd love your mentorship on ${rec.domain}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(rec)}
                        disabled={sendingId === rec.slot_id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg disabled:opacity-50"
                      >
                        {sendingId === rec.slot_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Send Request
                      </button>
                      <button
                        onClick={() => {
                          setOpenFor(null);
                          setMessage("");
                        }}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOpenFor(rec.slot_id);
                      setMessage("");
                      setError(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg"
                  >
                    <Send size={16} /> Request Mentorship
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
