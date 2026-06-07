"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { API } from "@/config/api";
import { useApi, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  meta: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  connection_request:  "🤝",
  connection_accepted: "✅",
  mentorship_accepted: "🎓",
  mentorship_rejected: "❌",
  forum_reply:         "💬",
  match:               "🔍",
};

const TYPE_LABELS: Record<string, string> = {
  connection_request:  "Connection Request",
  connection_accepted: "Connection Accepted",
  mentorship_accepted: "Mentorship Accepted",
  mentorship_rejected: "Mentorship Update",
  forum_reply:         "Forum Reply",
  match:               "New Match",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const { fetchWithAuth } = useApi();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API.notifications.list}?limit=50`);
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const markRead = async (id: number) => {
    await fetchWithAuth(API.notifications.markRead(String(id)), { method: "POST" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await fetchWithAuth(API.notifications.markAllRead, { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Bell className="text-primary" size={28} />
              Notifications
            </h1>
            {unread > 0 && (
              <p className="text-slate-500 mt-1 text-sm">{unread} unread</p>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-colors"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">All caught up!</h2>
            <p className="text-slate-500">You have no notifications yet. Connect with researchers to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer group ${
                  n.is_read
                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-70 hover:opacity-100"
                    : "bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/40 shadow-sm"
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 shrink-0 flex items-center justify-center text-2xl rounded-2xl ${
                  n.is_read ? "bg-slate-100 dark:bg-slate-800" : "bg-indigo-50 dark:bg-indigo-900/30"
                }`}>
                  {TYPE_ICONS[n.type] || "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block">
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <p className={`font-semibold text-sm leading-snug ${n.is_read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{n.body}</p>}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(n.created_at)}</span>
                  </div>
                </div>

                {/* Unread indicator */}
                {!n.is_read && (
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
