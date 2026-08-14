"use client";

/**
 * SaveVersionDialog — name and save the current document as a version snapshot
 * (a Git-style commit) into the project's history. POSTs to
 * /api/v1/projects/:id/versions. Restorable later from Version History.
 */

import React, { useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";

export default function SaveVersionDialog({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { fetchWithAuth } = useApi();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.projects.createVersion(projectId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionName: name.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success ?? true)) {
        onSaved?.();
        onClose();
      } else {
        setError(
          json.error?.message ||
            json.message ||
            "Could not save this version. Add some content to the document first."
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-neu-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Save size={18} className="text-primary dark:text-white" /> Save version
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-ink-500 mb-5">
          Snapshot the current document into the version history — like a commit. You can restore any saved version later.
        </p>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-ink-400 mb-2">What changed?</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="e.g. Added methodology section"
              className="w-full neu-inset px-4 py-3 text-sm outline-none text-ink-900 placeholder-ink-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-semibold flex items-start gap-1.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2.5 neu-btn text-ink-600 text-sm font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save to history
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
