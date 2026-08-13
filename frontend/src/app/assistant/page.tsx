"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Plus, Trash2, RefreshCw, AlertTriangle,
  FileText, Users, MessageSquare, BookOpen, ArrowRight, Bot, User as UserIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useApi, useAuth } from "@/context/AuthContext";

// Backend contract:
// POST /assistant/chat { query, session_id? }
//   -> { data: { session_id, answer, sources:[{id,type,title,snippet,score}], followups:[string], degraded? } }
// GET /assistant/sessions -> { data: [{ id, title, updated_at }] }
// GET /assistant/sessions/:id/messages -> { data: [{ id, role, content, sources, created_at }] }
// DELETE /assistant/sessions/:id

interface Source {
  id: string | number;
  type: string;
  title: string;
  snippet?: string;
  score?: number;
}

interface ChatMessage {
  id?: string | number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  followups?: string[];
  degraded?: boolean;
}

interface SessionSummary {
  id: string | number;
  title: string;
  updated_at: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  paper: { label: "Paper", icon: <FileText size={11} />, cls: "bg-primary-50 text-primary dark:text-white" },
  researcher: { label: "Researcher", icon: <Users size={11} />, cls: "bg-secondary-50 text-secondary dark:text-rose-300" },
  post: { label: "Post", icon: <MessageSquare size={11} />, cls: "bg-accent-50 text-accent-700" },
  journal: { label: "Journal", icon: <BookOpen size={11} />, cls: "bg-info-surface text-info" },
};

function SourceChip({ source }: { source: Source }) {
  const meta = TYPE_META[source.type] || {
    label: source.type || "Source",
    icon: <FileText size={11} />,
    cls: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  };
  return (
    <div className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
      <span className={`shrink-0 mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${meta.cls}`}>
        {meta.icon} {meta.label}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{source.title}</p>
        {source.snippet && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2">{source.snippet}</p>
        )}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  // Load session list
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.assistant.sessions);
      const json = await res.json();
      if (res.ok) setSessions((json.data as SessionSummary[]) || []);
    } catch {
      /* non-blocking */
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (token) loadSessions();
  }, [token, loadSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const openSession = useCallback(
    async (id: string | number) => {
      setActiveSessionId(id);
      setError(null);
      setLoadingThread(true);
      setMessages([]);
      try {
        const res = await fetchWithAuth(API.assistant.sessionMessages(id));
        const json = await res.json();
        if (res.ok) {
          const msgs = (json.data as any[]) || [];
          setMessages(
            msgs.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              sources: m.sources || [],
            }))
          );
        } else {
          throw new Error(json?.message || "Failed to load conversation");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setLoadingThread(false);
      }
    },
    [fetchWithAuth]
  );

  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setInput("");
  };

  const deleteSession = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetchWithAuth(API.assistant.deleteSession(id), { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) newChat();
      }
    } catch {
      /* ignore */
    }
  };

  const sendQuery = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query || sending) return;
      setError(null);
      setSending(true);
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: query }]);

      try {
        const body: Record<string, unknown> = { query };
        if (activeSessionId != null) body.session_id = activeSessionId;

        const res = await fetchWithAuth(API.assistant.chat, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "The assistant could not answer");

        const data = json.data as {
          session_id: string | number;
          answer: string;
          sources?: Source[];
          followups?: string[];
          degraded?: boolean;
        };

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer,
            sources: data.sources || [],
            followups: data.followups || [],
            degraded: data.degraded,
          },
        ]);

        // Track / refresh the session so it appears in the sidebar.
        if (data.session_id != null && data.session_id !== activeSessionId) {
          setActiveSessionId(data.session_id);
        }
        loadSessions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSending(false);
      }
    },
    [sending, activeSessionId, fetchWithAuth, loadSessions]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const isEmpty = messages.length === 0 && !loadingThread;

  return (
    <div className="min-h-screen app-bg text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="pt-20 h-screen flex max-w-[1600px] mx-auto gap-4 px-4 md:px-6 pb-4">
        {/* Sidebar — sessions */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 my-3 glass-neu-card p-4">
          <button
            onClick={newChat}
            className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary hover:scale-[1.02] transition-all"
          >
            <Plus size={18} /> New chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-8 px-4">
                No conversations yet. Ask something to get started.
              </p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openSession(s.id)}
                  className={`group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    activeSessionId === s.id
                      ? "bg-primary/10 text-primary dark:text-white"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold">
                    {s.title || "Untitled chat"}
                  </span>
                  <span
                    onClick={(e) => deleteSession(s.id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-slate-500 hover:text-secondary transition-all"
                  >
                    <Trash2 size={14} />
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main pane */}
        <section className="flex-1 flex flex-col min-w-0 my-3 glass-neu-card overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 neu-icon text-primary dark:text-white flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="mono-academic text-[10px] font-black tracking-[0.2em] text-secondary dark:text-rose-300 uppercase block mb-0.5">
                Research Companion
              </span>
              <h1 className="text-lg md:text-xl font-serif font-black text-primary dark:text-white leading-tight tracking-tight">
                AI Research <span className="text-secondary dark:text-rose-300 italic">Assistant</span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block mt-0.5">
                Grounded, cited answers across papers, researchers &amp; the community.
              </p>
            </div>
            {/* Mobile new-chat */}
            <button
              onClick={newChat}
              className="md:hidden ml-auto w-9 h-9 neu-btn text-primary dark:text-white flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Thread */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
            {loadingThread ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-3">
                <RefreshCw className="animate-spin text-primary dark:text-white" size={28} />
                <p className="font-serif italic">Loading conversation...</p>
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                <div className="w-16 h-16 neu-icon text-primary dark:text-white flex items-center justify-center mb-5">
                  <Bot size={30} />
                </div>
                <span className="mono-academic text-[10px] font-black tracking-[0.2em] text-secondary dark:text-rose-300 uppercase block mb-2">
                  Ask Anything
                </span>
                <h2 className="text-2xl font-serif font-black text-primary dark:text-white mb-2">
                  How can I help your <span className="text-secondary dark:text-rose-300 italic">research</span>?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Ask about papers, find researchers, or explore what the community is discussing.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  {[
                    "Who works on low-resource NLP?",
                    "Summarize recent work on graph neural networks",
                    "What are people discussing about reproducibility?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendQuery(s)}
                      className="flex items-center justify-between gap-2 px-4 py-3 neu-btn text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-all"
                    >
                      {s} <ArrowRight size={15} className="shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((m, i) => (
                  <div key={m.id ?? i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-white flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                    )}
                    <div className={`min-w-0 ${m.role === "user" ? "max-w-[80%]" : "max-w-[85%] flex-1"}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          m.role === "user"
                            ? "bg-primary text-white rounded-tr-sm"
                            : "glass-neu-card text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-line">{m.content}</p>
                      </div>

                      {/* Degraded note */}
                      {m.role === "assistant" && m.degraded && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle size={12} /> Limited mode — answer built directly from retrieved sources.
                        </div>
                      )}

                      {/* Sources panel */}
                      {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                            Sources
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {m.sources.map((src, si) => (
                              <SourceChip key={`${src.id}-${si}`} source={src} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up chips */}
                      {m.role === "assistant" && m.followups && m.followups.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {m.followups.map((f, fi) => (
                            <button
                              key={fi}
                              onClick={() => sendQuery(f)}
                              disabled={sending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/10 text-secondary dark:text-rose-300 text-xs font-bold rounded-full hover:bg-secondary/20 transition-colors disabled:opacity-50"
                            >
                              {f} <ArrowRight size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                        <UserIcon size={16} />
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex gap-3 justify-start">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-white flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-3 glass-neu-card">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-4 md:mx-8 mb-2 flex items-center gap-2 text-xs font-medium text-error bg-error-surface border border-error/20 rounded-2xl px-4 py-2.5"
              >
                <AlertTriangle size={14} className="shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="px-4 md:px-8 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0"
          >
            <div className="max-w-3xl mx-auto flex items-end gap-2 neu-inset p-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about research..."
                className="flex-1 px-3.5 py-2.5 bg-transparent border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="p-3 bg-primary text-white rounded-xl hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {sending ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </section>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
