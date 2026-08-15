"use client";

/**
 * Teams — the dedicated place for research collaboration teams.
 * List the teams you belong to and create a new one around a research topic.
 * A "team" is a project workspace: shared paper, version history, members.
 */

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useApi } from "@/context/AuthContext";
import { useAppRouter } from "@/lib/useAppRouter";
import { API } from "@/config/api";
import { Users, Plus, FileText, ArrowRight, Crown } from "lucide-react";
import CreateTeamModal from "@/components/workspace/CreateTeamModal";
import CollaborationRequestsPanel from "@/components/collaboration/CollaborationRequestsPanel";

interface Team {
  id: number;
  name: string;
  description: string;
  role: string;
  member_count: number;
  collaborator_count?: number;
}

export default function TeamsPage() {
  const { fetchWithAuth } = useApi();
  const router = useAppRouter();
  const [showCreate, setShowCreate] = useState(false);

  const { data: teams, isLoading, mutate } = useSWR<Team[]>(API.projects.list, async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  });

  return (
    <div className="min-h-screen app-bg">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary dark:text-rose-300 uppercase mb-1 block">
              Collaboration
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-primary dark:text-white">
              Research <span className="text-secondary dark:text-rose-300 italic">Teams</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              Form a team around a topic, co-write the paper, and track every change like version control.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-secondary transition-all shrink-0"
          >
            <Plus size={18} /> Create Team
          </button>
        </div>

        {/* Incoming collaboration proposals (from Discovery "Connect") */}
        <CollaborationRequestsPanel
          onAccepted={async (projectId) => {
            await mutate();
            if (projectId) router.push(`/teams/${projectId}`);
          }}
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-neu-card p-6">
                <div className="skeleton w-12 h-12 rounded-2xl mb-4" />
                <div className="skeleton h-5 w-2/3 rounded mb-2" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="glass-neu-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-white mx-auto mb-5">
              <Users size={30} />
            </div>
            <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white mb-2">No teams yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Create a research team around a topic. Invite your connections, co-write the paper together, and keep a full history of every revision.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-secondary transition-all"
            >
              <Plus size={18} /> Create your first team
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="glass-neu-card glass-neu-hover p-6 group flex flex-col border-l-4 border-l-primary transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-black text-lg shrink-0">
                    {t.name?.[0]?.toUpperCase() || "T"}
                  </div>
                  {t.role === "admin" && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                      <Crown size={11} /> Admin
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-1 group-hover:text-primary dark:group-hover:text-rose-300 transition-colors line-clamp-1">
                  {t.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">
                  {t.description || "No description yet."}
                </p>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Users size={14} /> {t.member_count} {Number(t.member_count) === 1 ? "member" : "members"}
                    {Number(t.collaborator_count) > 0 && (
                      <> · {t.collaborator_count} {Number(t.collaborator_count) === 1 ? "collaborator" : "collaborators"}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-primary dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            await mutate();
            router.push(`/teams/${id}`);
          }}
        />
      )}
    </div>
  );
}
