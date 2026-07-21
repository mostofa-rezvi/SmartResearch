"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";

interface Task {
  id: number;
  milestone_id: number;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  assignee_id: number | null;
  assignee_name?: string | null;
}

const COLUMNS: { key: Task["status"]; label: string; accent: string }[] = [
  { key: "TODO", label: "To Do", accent: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", accent: "bg-blue-500" },
  { key: "REVIEW", label: "Review", accent: "bg-amber-500" },
  { key: "DONE", label: "Done", accent: "bg-emerald-500" },
];

const NEXT: Record<Task["status"], Task["status"]> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  REVIEW: "DONE",
  DONE: "TODO",
};

/**
 * Task board (Module 3) — a kanban over the real /api/v1/tasks API, scoped to a
 * milestone. Create tasks, advance their status, delete. Complements the
 * milestone tracker (which tracks whole milestones).
 */
export function TaskBoard({ milestoneId }: { milestoneId: number | string }) {
  const { fetchWithAuth } = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(API.tasks.listByMilestone(milestoneId));
      const json = await res.json();
      setTasks(json.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [milestoneId, fetchWithAuth]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetchWithAuth(API.tasks.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestone_id: Number(milestoneId), title: newTitle.trim(), status: "TODO" }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((t) => [...t, json.data]);
      setNewTitle("");
    }
  };

  const advance = async (task: Task) => {
    const status = NEXT[task.status];
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status } : x))); // optimistic
    const res = await fetchWithAuth(API.tasks.update(task.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) load(); // rollback on failure
  };

  const remove = async (task: Task) => {
    setTasks((t) => t.filter((x) => x.id !== task.id));
    await fetchWithAuth(API.tasks.remove(task.id), { method: "DELETE" });
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary outline-none text-sm"
        />
        <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all">
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-3 min-h-[140px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{col.label}</span>
                <span className="ml-auto text-[10px] text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((task) => (
                  <div key={task.id} className="group bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-800 dark:text-slate-100">{task.title}</p>
                      <button onClick={() => remove(task)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {task.status !== "DONE" && (
                      <button onClick={() => advance(task)} className="mt-2 text-[10px] font-bold text-primary hover:underline">
                        Move to {COLUMNS.find((c) => c.key === NEXT[task.status])?.label} →
                      </button>
                    )}
                  </div>
                ))}
                {loading && items.length === 0 && <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
