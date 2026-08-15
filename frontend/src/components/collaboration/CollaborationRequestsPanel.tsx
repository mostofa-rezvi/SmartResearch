"use client";

/**
 * CollaborationRequestsPanel — incoming research-collaboration proposals
 * (sent from Discovery's "Connect"). Accepting one auto-creates a shared
 * research team; the panel renders nothing when there are no pending requests.
 */

import React, { useState } from "react";
import useSWR from "swr";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Handshake, Check, X, Loader2, Building } from "lucide-react";

interface PendingRequest {
  id: number;
  proposal_title: string;
  proposal_message: string | null;
  created_at: string;
  requester_id: number;
  requester_name: string;
  requester_institution: string | null;
}

export default function CollaborationRequestsPanel({
  onAccepted,
}: {
  onAccepted?: (projectId: number | null) => void;
}) {
  const { fetchWithAuth } = useApi();
  const [busyId, setBusyId] = useState<number | null>(null);

  const { data: requests, mutate } = useSWR<PendingRequest[]>(API.collaborations.pending, async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  });

  const respond = async (id: number, action: "accept" | "decline") => {
    setBusyId(id);
    try {
      const res = await fetchWithAuth(API.collaborations.respond(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      await mutate();
      if (res.ok && action === "accept") {
        onAccepted?.(json.data?.project_id ?? null);
      }
    } catch {
      /* leave the request in place; user can retry */
    } finally {
      setBusyId(null);
    }
  };

  if (!requests || requests.length === 0) return null;

  return (
    <div className="glass-neu-card p-6 mb-8 border-l-4 border-l-secondary">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary dark:text-rose-300">
          <Handshake size={18} />
        </div>
        <div>
          <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white leading-tight">
            Collaboration Proposals
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Accepting a proposal creates a shared research team automatically.
          </p>
        </div>
        <span className="ml-auto badge badge-accent shrink-0">{requests.length} pending</span>
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shrink-0">
              {r.requester_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white break-words">{r.proposal_title}</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                {r.requester_name}
                {r.requester_institution && (
                  <>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <Building size={11} /> {r.requester_institution}
                  </>
                )}
              </p>
              {r.proposal_message && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">{r.proposal_message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {busyId === r.id ? (
                <span className="px-4 py-2 text-slate-400"><Loader2 size={18} className="animate-spin" /></span>
              ) : (
                <>
                  <button
                    onClick={() => respond(r.id, "accept")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white font-bold text-xs rounded-xl transition-all"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, "decline")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs rounded-xl transition-all"
                  >
                    <X size={14} /> Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
