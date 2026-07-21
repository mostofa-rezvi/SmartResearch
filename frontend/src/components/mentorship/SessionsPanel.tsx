"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, CalendarPlus, CheckCircle2, Circle, Clock } from "lucide-react";

interface Session {
  id: number;
  scheduled_at?: string | null;
  notes?: string | null;
  status?: string; // e.g. 'scheduled' | 'completed'
  completed?: boolean;
}

interface SessionsPanelProps {
  mentorshipId: number;
}

export function SessionsPanel({ mentorshipId }: SessionsPanelProps) {
  const { fetchWithAuth } = useApi();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      const res = await fetchWithAuth(API.mentorship.sessions(mentorshipId));
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorshipId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.mentorship.sessions(mentorshipId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to schedule session");
      }
      setScheduledAt("");
      setNotes("");
      await loadSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (sessionId: number) => {
    setCompletingId(sessionId);
    setError(null);
    try {
      const res = await fetchWithAuth(API.mentorship.completeSession(sessionId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to mark session complete");
      }
      await loadSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const isCompleted = (s: Session) => s.completed === true || s.status === "completed";

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
      <h5 className="text-sm font-bold uppercase tracking-wide text-slate-400">Sessions</h5>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Schedule form */}
      <form onSubmit={handleSchedule} className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Schedule at</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agenda / topic"
            className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg disabled:opacity-50 shrink-0"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
          Schedule
        </button>
      </form>

      {/* Sessions list */}
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin h-5 w-5 text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-slate-400">No sessions scheduled yet.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const done = isCompleted(s);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-start gap-2 min-w-0">
                  {done ? (
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-slate-300 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {s.scheduled_at
                        ? new Date(s.scheduled_at).toLocaleString()
                        : "Time to be decided"}
                    </p>
                    {s.notes && <p className="text-xs text-slate-500 mt-0.5 truncate">{s.notes}</p>}
                  </div>
                </div>
                {done ? (
                  <span className="text-xs font-bold text-emerald-600 shrink-0">Completed</span>
                ) : (
                  <button
                    onClick={() => handleComplete(s.id)}
                    disabled={completingId === s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 shrink-0"
                  >
                    {completingId === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    Mark complete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
