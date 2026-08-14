"use client";

/**
 * CreateTeamModal — create a new research team (project workspace).
 * POSTs to /api/v1/projects; the creator becomes the team admin and a default
 * collaborative document is created server-side.
 */

import React, { useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { X, Users, Loader2 } from "lucide-react";

export default function CreateTeamModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const { fetchWithAuth } = useApi();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.projects.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      const created = json.data || json;
      if (res.ok && created?.id) {
        onCreated(created.id);
        onClose();
      } else {
        setError(json.message || "Could not create team");
      }
    } catch {
      setError("Network error");
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
              <Users size={20} />
            </div>
            <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white">New Research Team</h2>
          </div>
          <button onClick={onClose} className="p-2 neu-btn text-slate-400" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Team Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Neural Retrieval Lab"
              className="w-full neu-inset px-4 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Focus / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this team working on?"
              className="w-full neu-inset px-4 py-3 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />} Create Team
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            You&apos;ll be the team admin. Invite collaborators from your connections next.
          </p>
        </form>
      </div>
    </div>
  );
}
