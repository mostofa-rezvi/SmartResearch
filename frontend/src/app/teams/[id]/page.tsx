"use client";

/**
 * Team hub — a single research team.
 * Shows the topic, members (+invite from your connections), the shared research
 * document (open the realtime collaborative editor), and a GitHub-like version
 * history log of every saved revision of the paper.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import {
  Users, UserPlus, FileText, ArrowLeft, Crown, History, GitCommitHorizontal,
  ArrowRight, Loader2, Clock, KanbanSquare,
} from "lucide-react";
import InviteMembersPanel from "@/components/workspace/InviteMembersPanel";

interface Member { id: number; name: string; role: string }
interface Team {
  id: number; name: string; description: string; status: string;
  creator_id: number; created_at: string; members: Member[];
}
interface Version {
  id: number; version_name: string; preview_text: string | null;
  created_at: string; creator_name: string | null;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TeamHubPage() {
  const { id } = useParams();
  const teamId = String(id);
  const { fetchWithAuth } = useApi();
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.projects.getProject(teamId));
      if (!res.ok) { setNotFound(true); return; }
      const json = await res.json();
      setTeam(json.data || null);
    } catch {
      setNotFound(true);
    }
  }, [fetchWithAuth, teamId]);

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.projects.listVersions(teamId));
      if (res.ok) {
        const json = await res.json();
        setVersions(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* ignore */ }
  }, [fetchWithAuth, teamId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadTeam(), loadVersions()]);
      setLoading(false);
    })();
  }, [loadTeam, loadVersions]);

  const myRole = team?.members?.find((m) => String(m.id) === String(user?.id))?.role;
  const isAdmin = myRole === "admin";

  if (loading) {
    return (
      <div className="min-h-screen app-bg">
        <Navbar />
        <div className="pt-40 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading team…
        </div>
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <div className="min-h-screen app-bg">
        <Navbar />
        <div className="pt-40 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">This team doesn&apos;t exist or you&apos;re not a member.</p>
          <Link href="/teams" className="text-primary dark:text-white font-bold hover:underline">← Back to teams</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        <Link href="/teams" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> All teams
        </Link>

        {/* Header */}
        <div className="glass-neu-card p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex gap-5 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-black text-2xl shrink-0">
                {team.name?.[0]?.toUpperCase() || "T"}
              </div>
              <div className="min-w-0">
                <span className="mono-academic text-[11px] font-black tracking-[0.2em] text-secondary dark:text-rose-300 uppercase">Research Team</span>
                <h1 className="text-2xl md:text-3xl font-serif font-black text-primary dark:text-white leading-tight">{team.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">{team.description || "No description yet."}</p>
                <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><Users size={13} /> {team.members.length} members</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Created {timeAgo(team.created_at)}</span>
                </div>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all shrink-0"
              >
                <UserPlus size={16} /> Invite
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main: research document + version log */}
          <div className="space-y-6 min-w-0">
            {/* Research document */}
            <div className="glass-neu-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-primary dark:text-white" /> Research Document
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Co-write the team&apos;s paper in real time. Everyone&apos;s edits merge live, and you can save named
                versions to keep a full revision history.
              </p>
              <Link
                href={`/workspace/document/${team.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all"
              >
                Open collaborative editor <ArrowRight size={16} />
              </Link>
            </div>

            {/* Project workspace — milestones, tasks, kanban board */}
            <div className="glass-neu-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KanbanSquare size={18} className="text-primary dark:text-white" /> Project Workspace
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Plan the research: track milestones on a timeline, manage tasks across a kanban board
                (To&nbsp;Do → In&nbsp;Progress → Review → Done), and assign work to teammates.
              </p>
              <Link
                href={`/workspace?project=${team.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 neu-btn text-slate-700 dark:text-slate-200 font-bold"
              >
                Open workspace board <ArrowRight size={16} />
              </Link>
            </div>

            {/* Version log — GitHub-like */}
            <div className="glass-neu-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History size={18} className="text-primary dark:text-white" /> Version History
                </h2>
                <span className="text-xs font-bold text-slate-400">{versions.length} saved</span>
              </div>

              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <GitCommitHorizontal size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">No versions saved yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Open the editor and use <b>Version History → Save</b> to snapshot the paper. Each snapshot is logged
                    here with who saved it and when — like commits.
                  </p>
                </div>
              ) : (
                <ol className="relative border-l-2 border-slate-100 dark:border-slate-700/60 ml-2 space-y-5">
                  {versions.map((v) => (
                    <li key={v.id} className="ml-5 relative">
                      <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                        <GitCommitHorizontal size={10} className="text-white" />
                      </span>
                      <div className="glass-panel p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-black text-slate-900 dark:text-white break-words">{v.version_name}</p>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
                            <Clock size={11} /> {timeAgo(v.created_at)}
                          </span>
                        </div>
                        {v.preview_text && v.preview_text !== "Empty Document" && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 font-mono">
                            {v.preview_text.replace(/<[^>]+>/g, " ").slice(0, 160)}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-slate-400">
                          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-[9px]">
                            {v.creator_name?.[0]?.toUpperCase() || "?"}
                          </span>
                          {v.creator_name || "Unknown"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <Link
                href={`/workspace/document/${team.id}`}
                className="inline-flex items-center gap-1.5 mt-5 text-xs font-bold text-primary dark:text-white hover:underline"
              >
                Manage & restore versions in the editor <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Sidebar: members */}
          <aside>
            <div className="glass-neu-card p-6 lg:sticky lg:top-28">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Users size={15} /> Members
                </h2>
                {isAdmin && (
                  <button onClick={() => setShowInvite(true)} className="text-xs font-bold text-primary dark:text-white hover:underline flex items-center gap-1">
                    <UserPlus size={13} /> Add
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {team.members.map((m) => (
                  <Link key={m.id} href={`/profile/${m.id}`} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {m.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{m.name}</p>
                    </div>
                    {m.role === "admin" ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Crown size={10} /> Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full capitalize">{m.role}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showInvite && (
        <InviteMembersPanel projectId={teamId} onClose={() => { setShowInvite(false); loadTeam(); }} />
      )}
    </div>
  );
}
