"use client";

import React, { useState, useEffect, useCallback } from "react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  X,
  Plus,
  Loader2,
  Undo2,
  Calendar,
  User,
  Eye,
  CheckCircle2,
  FileText,
  FileCode,
} from "lucide-react";

interface Version {
  id: number;
  version_name: string;
  preview_text: string | null;
  created_name: string; // From LEFT JOIN users
  creator_name?: string; // fallback
  created_at: string;
}

interface VersionHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
  currentDocText?: string;
}

export default function VersionHistorySidebar({
  isOpen,
  onClose,
  projectId,
  currentDocText = "",
}: VersionHistorySidebarProps) {
  const { token } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState<number | null>(null);
  const [versionName, setVersionName] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API.projects.listVersions(String(projectId)), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load version snapshots");
      const data = await res.json();
      setVersions(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    if (isOpen && token) {
      fetchVersions();
    }
  }, [isOpen, token, fetchVersions]);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionName.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(API.projects.createVersion(String(projectId)), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ versionName: versionName.trim() }),
      });

      if (!res.ok) throw new Error("Failed to create snapshot");
      
      setVersionName("");
      await fetchVersions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async (version: Version) => {
    if (!window.confirm(`Are you sure you want to revert the methodology document to "${version.version_name}"? All unsaved active changes will be overwritten.`)) {
      return;
    }

    try {
      setReverting(version.id);
      const res = await fetch(API.projects.revertVersion(String(projectId), String(version.id)), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to revert document version");
      
      // Close sidebar since re-sync happens automatically
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReverting(null);
    }
  };

  // Extract raw text from Yjs XML representation for clean preview
  const getCleanPreview = (xmlText: string | null) => {
    if (!xmlText) return "Empty Content";
    // Strip XML/HTML tags
    return xmlText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "Empty Content";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40 backdrop-blur-sm"
          />

          {/* Sidebar drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-white dark:bg-slate-900 z-50 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <History className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Version History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main content split: List vs. Visual Comparison */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Create Snapshot Form */}
              <form onSubmit={handleCreateSnapshot} className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Save Current State
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g. Draft before feedback, Milestone 1..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-primary/10 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Snapshot
                  </button>
                </div>
              </form>

              {/* Selected Snapshot Preview Area */}
              {selectedVersion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <FileText size={14} /> Previewing Snapshot
                    </span>
                    <button
                      onClick={() => setSelectedVersion(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider"
                    >
                      Clear Preview
                    </button>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {selectedVersion.version_name}
                  </h4>
                  <div className="max-h-[160px] overflow-y-auto border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 bg-white dark:bg-slate-900 text-xs text-slate-500 font-serif leading-relaxed">
                    {getCleanPreview(selectedVersion.preview_text)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleRevert(selectedVersion)}
                      disabled={reverting === selectedVersion.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 transition-all disabled:opacity-50"
                    >
                      {reverting === selectedVersion.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Undo2 size={14} />
                      )}
                      Restore/Revert to this Version
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Version History List */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Snapshot History
                </label>
                {loading ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Loading history...</span>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <History size={36} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">No snapshots saved for this document.</p>
                    <p className="text-[10px] mt-1">Snapshots are permanent points in time you can revert back to.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((ver) => (
                      <div
                        key={ver.id}
                        className={`border rounded-2xl p-4 flex flex-col gap-2 transition-all cursor-pointer ${
                          selectedVersion?.id === ver.id
                            ? "bg-primary/5 border-primary/30"
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                        onClick={() => setSelectedVersion(ver)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            {ver.version_name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {ver.id}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <User size={12} /> {ver.creator_name || ver.created_name || "Platform user"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(ver.created_at).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Quick preview icon */}
                        <div className="flex items-center justify-end pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                          <button
                            type="button"
                            className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                          >
                            <Eye size={12} /> View Snapshot Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                🛡️ Immutable Snapshots · Restore is instant and real-time
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
