"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Bell, Check, CheckCheck, X, User2 } from "lucide-react";
import { io } from "socket.io-client";
import { API, API_BASE } from "@/config/api";
import { useAuth, useApi } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  meta: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  connection_request:  "bg-indigo-500/10 text-indigo-500",
  connection_accepted: "bg-emerald-500/10 text-emerald-500",
  mentorship_accepted: "bg-amber-500/10 text-amber-500",
  mentorship_rejected: "bg-red-500/10 text-red-500",
  forum_reply:         "bg-purple-500/10 text-purple-500",
  match:               "bg-blue-500/10 text-blue-500",
};

const TYPE_ICONS: Record<string, string> = {
  connection_request:  "🤝",
  connection_accepted: "✅",
  mentorship_accepted: "🎓",
  mentorship_rejected: "❌",
  forum_reply:         "💬",
  match:               "🔍",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const { token } = useAuth();
  const { fetchWithAuth } = useApi();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchWithAuth(API.notifications.unreadCount);
      const json = await res.json();
      if (json.success) setUnreadCount(json.data.count);
    } catch { /* silent */ }
  }, [fetchWithAuth, token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API.notifications.list}?limit=10`);
      const json = await res.json();
      if (json.success) setNotifications(json.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [fetchWithAuth, token]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Real-time notifications via Socket.IO.
  // Backend emits `notification:new` to room `user_${userId}` and auto-joins
  // the authenticated user's room on connect (see backend notification.service.js).
  useEffect(() => {
    if (!token) return;
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : token;

    const socket = io(API_BASE, {
      transports: ["websocket"],
      auth: { token: authToken },
    });

    socket.on("notification:new", (notification: Notification) => {
      // Prepend the new notification and bump the unread badge instantly.
      setNotifications(prev => {
        if (notification?.id != null && prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off("notification:new");
      socket.disconnect();
    };
  }, [token]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markOneRead = async (id: number) => {
    try {
      await fetchWithAuth(API.notifications.markRead(String(id)), { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth(API.notifications.markAllRead, { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:text-primary/80 transition-colors"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <Bell size={28} className="mx-auto mb-3 opacity-30" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`group flex gap-3 px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${!n.is_read ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}
                  onClick={() => !n.is_read && markOneRead(n.id)}
                >
                  {/* Icon */}
                  <span className={`w-9 h-9 shrink-0 flex items-center justify-center text-lg rounded-xl ${TYPE_COLORS[n.type] || "bg-slate-100 dark:bg-slate-800"}`}>
                    {TYPE_ICONS[n.type] || "🔔"}
                  </span>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug truncate ${!n.is_read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">{n.body}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
