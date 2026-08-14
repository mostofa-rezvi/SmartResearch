"use client";

/**
 * InviteMembersPanel — add collaborators to a research team from the current
 * user's accepted connections. POSTs to /api/v1/projects/:id/invite (admin-only).
 * This is how connections become teammates.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { X, UserPlus, Check, Loader2, Users } from "lucide-react";
import Link from "next/link";

interface Connection {
  id: number;
  connected_user_id: number;
  connected_user_name: string;
  connected_user_institution?: string | null;
}

export default function InviteMembersPanel({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const { fetchWithAuth } = useApi();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<Record<number, "loading" | "done" | "error">>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(API.connections.list);
      const json = await res.json();
      setConnections(Array.isArray(json.data) ? json.data : []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (userId: number) => {
    setState((p) => ({ ...p, [userId]: "loading" }));
    try {
      const res = await fetchWithAuth(API.projects.invite(projectId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, role: "member" }),
      });
      setState((p) => ({ ...p, [userId]: res.ok ? "done" : "error" }));
    } catch {
      setState((p) => ({ ...p, [userId]: "error" }));
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-end p-4" onClick={onClose}>
      <div className="w-full max-w-md h-full glass-neu-card p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white">Invite Collaborators</h2>
            <p className="text-xs text-slate-400 mt-1">Add teammates from your connections.</p>
          </div>
          <button onClick={onClose} className="p-2 neu-btn text-slate-400" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Loading connections…
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">No connections yet</p>
            <p className="text-xs mt-1 max-w-[240px] mx-auto">
              Connect with researchers from their profiles, then come back to add them to your team.
            </p>
            <Link href="/researchers" className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-secondary transition-all">
              Find researchers
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
            {connections.map((c) => {
              const st = state[c.connected_user_id];
              return (
                <div key={c.id} className="glass-neu-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {c.connected_user_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.connected_user_name}</p>
                    {c.connected_user_institution && (
                      <p className="text-[11px] text-slate-400 truncate">{c.connected_user_institution}</p>
                    )}
                  </div>
                  <button
                    disabled={st === "loading" || st === "done"}
                    onClick={() => invite(c.connected_user_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      st === "done"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : st === "error"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-primary text-white hover:bg-secondary"
                    }`}
                  >
                    {st === "loading" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : st === "done" ? (
                      <><Check size={14} /> Added</>
                    ) : st === "error" ? (
                      <>Retry</>
                    ) : (
                      <><UserPlus size={14} /> Add</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
