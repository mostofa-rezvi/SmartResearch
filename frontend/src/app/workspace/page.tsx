"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { KanbanBoard } from "@/components/kanban-board";
import { TimelineView } from "@/components/timeline-view";
import { TaskBoard } from "@/components/task-board";
import { NotificationsPanel } from "@/components/notifications-panel";
import useSWR from "swr";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";

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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<number | null>(null);

  // 1. Projects the user belongs to (drives the selector — no more hardcoded "1")
  const { data: projects } = useSWR<Project[]>(API.projects.list, async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  });

  // default-select the first project
  useEffect(() => {
    if (!projectId && projects && projects.length > 0) setProjectId(String(projects[0].id));
  }, [projects, projectId]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col">
      <Navbar />

      <div className="fixed top-0 right-0 z-50 p-4 mr-20 flex items-center gap-4">
        <NotificationsPanel />
      </div>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-[1400px] w-full mx-auto flex flex-col">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              Workspace
            </span>
            {/* Project selector */}
            {projects && projects.length > 0 ? (
              <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-slate-400">No projects yet — create one to get started.</span>
            )}
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-2">
            {selected?.name || "Your Workspace"}
          </h1>
          <p className="text-slate-500 font-medium">
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
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
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
    </div>
  );
}
