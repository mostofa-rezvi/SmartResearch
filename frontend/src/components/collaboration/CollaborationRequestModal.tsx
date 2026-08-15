"use client";

/**
 * CollaborationRequestModal — send a research proposal to a recommended
 * collaborator from Discovery. If the researcher has a platform account they
 * receive a request to accept (which auto-creates a shared team); if they
 * don't, the team is created immediately with them attached as an external
 * collaborator.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { X, Handshake, Loader2, Users, ArrowRight, Send } from "lucide-react";

interface TargetResearcher {
  id?: string; // OpenAlex author id
  name: string;
  institution?: string;
  internalUserId?: string | number | null;
}

export default function CollaborationRequestModal({
  researcher,
  onClose,
  onSent,
}: {
  researcher: TargetResearcher;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { fetchWithAuth } = useApi();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ autoCreated: boolean; projectId?: number } | null>(null);

  const hasAccount = researcher.internalUserId != null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.collaborations.request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_user_id: researcher.internalUserId ?? null,
          researcher_id: researcher.id ? String(researcher.id).replace("https://openalex.org/", "") : null,
          researcher_name: researcher.name,
          researcher_institution: researcher.institution || null,
          title: title.trim(),
          message: message.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setResult({ autoCreated: !!json.data?.auto_created, projectId: json.data?.project_id });
        onSent?.();
      } else {
        setError(json.message || "Could not send the collaboration request");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-neu-card p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary dark:text-white">
              <Handshake size={20} />
            </div>
            <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white">Propose Collaboration</h2>
          </div>
          <button onClick={onClose} className="p-2 neu-btn text-slate-400" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Users size={26} />
            </div>
            {result.autoCreated ? (
              <>
                <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-2">Team created!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {researcher.name} doesn&apos;t have a platform account yet, so they were added to your new team as a collaborator.
                </p>
                <Link
                  href={result.projectId ? `/teams/${result.projectId}` : "/teams"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all"
                >
                  Open your team <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-2">Proposal sent!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {researcher.name} has been notified. When they accept, a shared research team will be created automatically.
                </p>
                <button onClick={onClose} className="px-6 py-3 neu-btn text-slate-700 dark:text-slate-300 font-bold text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Target researcher summary */}
            <div className="flex items-center gap-3 neu-inset p-3 rounded-xl mb-5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shrink-0">
                {researcher.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{researcher.name}</p>
                <p className="text-xs text-slate-400 truncate">{researcher.institution || "Independent researcher"}</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Research Topic / Team Name</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="e.g. Contrastive Learning for Bio-signals"
                  className="w-full neu-inset px-4 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Research Proposal</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe the research idea, why you'd like to collaborate, and what you bring to the team…"
                  className="w-full neu-inset px-4 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {hasAccount ? "Send Proposal" : "Create Team & Add Collaborator"}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                {hasAccount
                  ? "They'll get a notification — accepting creates a shared research team for you both."
                  : "This researcher isn't on the platform yet, so your team will be created right away with them listed as a collaborator."}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
