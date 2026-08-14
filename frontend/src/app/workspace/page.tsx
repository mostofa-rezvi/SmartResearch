"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { KanbanBoard } from "@/components/kanban-board";
import { TimelineView } from "@/components/timeline-view";
import { TaskBoard } from "@/components/task-board";
import { NotificationsPanel } from "@/components/notifications-panel";
import useSWR, { useSWRConfig } from "swr";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Plus, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CreateTeamModal from "@/components/workspace/CreateTeamModal";
import InviteMembersPanel from "@/components/workspace/InviteMembersPanel";

interface Project {
  id: number;
  name: string;
  description: string;
  role: string;
  member_count: number;
}
interface Milestone {
  id: number;
  title: string;
  status: string;
}

export default function WorkspaceDashboard() {
  const { fetchWithAuth } = useApi();
  const { mutate } = useSWRConfig();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  // A team can deep-link here with ?project=<id> to open its board directly.
  // Read synchronously on first render so it's available before the projects
  // list resolves — otherwise the default "first project" selection can win.
  const [requestedProject] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("project")
  );

  // 1. Projects the user belongs to (drives the selector — no more hardcoded "1")
  const { data: projects } = useSWR<Project[]>(API.projects.list, async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  });

  // Choose which team's board to show, in priority order:
  //   1. ?project=<id> deep-link (e.g. the editor's back button, team hub)
  //   2. the last team the user worked in (persisted below) — so coming back
  //      from editing "ML" reopens ML, not the newest team
  //   3. the first team (fallback)
  // All checks require the user to actually be a member of that team.
  useEffect(() => {
    if (projectId || !projects || projects.length === 0) return;
    const isMember = (pid: string | null) => !!pid && projects.some((p) => String(p.id) === pid);
    const last = typeof window !== "undefined" ? localStorage.getItem("rb:lastProjectId") : null;
    const wanted = isMember(requestedProject)
      ? requestedProject!
      : isMember(last)
      ? last!
      : String(projects[0].id);
    setProjectId(wanted);
  }, [projects, projectId, requestedProject]);

  // Remember the active team so any later visit to /workspace reopens it.
  useEffect(() => {
    if (projectId && typeof window !== "undefined") localStorage.setItem("rb:lastProjectId", projectId);
  }, [projectId]);

  // 2. Milestones for the selected project (drives the task board's milestone picker)
  const { data: milestones } = useSWR<Milestone[]>(
    projectId ? API.projects.listMilestones(projectId) : null,
    async (url: string) => {
      const res = await fetchWithAuth(url);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    }
  );
  useEffect(() => {
    if (milestones && milestones.length > 0) setMilestoneId(milestones[0].id);
    else setMilestoneId(null);
  }, [milestones]);

  const selected = projects?.find((p) => String(p.id) === projectId);

  return (
    <div className="min-h-screen app-bg flex flex-col">
      <Navbar />

      <div className="fixed top-0 right-0 z-50 p-4 mr-20 flex items-center gap-4">
        <NotificationsPanel />
      </div>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-[1400px] w-full mx-auto flex flex-col">
        <header className="mb-10">
          {projectId && (
            <Link
              href={`/teams/${projectId}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-primary transition-colors mb-3"
            >
              <ArrowLeft size={16} /> Back to team hub
            </Link>
          )}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="bg-primary/10 text-primary dark:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              Workspace
            </span>
            {/* Project selector */}
            {projects && projects.length > 0 ? (
              <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-1.5 neu-inset text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-slate-400">No teams yet — create one to get started.</span>
            )}

            {/* Create a new research team */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all"
            >
              <Plus size={16} /> New Team
            </button>

            {/* Invite collaborators into the selected team */}
            {projectId && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 neu-btn text-slate-600 dark:text-slate-300 text-sm font-bold hover:border-primary/40 transition-all"
              >
                <UserPlus size={16} /> Invite
              </button>
            )}
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-2">
            {selected?.name || "Your Workspace"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {selected?.description || "Collaborative workspace and task tracking"}
          </p>
        </header>

        {projectId && (
          <>
            <TimelineView />

            <div className="mb-10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Milestones</h2>
              <KanbanBoard projectId={projectId} />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Tasks</h2>
                {milestones && milestones.length > 0 ? (
                  <select
                    value={milestoneId ?? ""}
                    onChange={(e) => setMilestoneId(Number(e.target.value))}
                    className="px-3 py-1.5 neu-inset text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-slate-400">Create a milestone above to add tasks.</span>
                )}
              </div>
              {milestoneId && <TaskBoard milestoneId={milestoneId} />}
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            await mutate(API.projects.list);
            setProjectId(String(id));
          }}
        />
      )}

      {showInvite && projectId && (
        <InviteMembersPanel projectId={projectId} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
