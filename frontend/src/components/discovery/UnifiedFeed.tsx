"use client";

import React, { useEffect, useState } from "react";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, Users, FileText, FolderKanban, Building, Sparkles } from "lucide-react";

interface Collaborator {
  id: string | number;
  name: string;
  institution?: string;
  similarityScore?: number;
  internalUserId?: string | number | null;
  [key: string]: any;
}

interface Paper {
  id: string | number;
  title: string;
  abstract?: string;
  _score?: number;
}

interface Project {
  id: string | number;
  name: string;
  description?: string;
  status?: string;
  member_count?: number;
}

interface FeedData {
  collaborators: Collaborator[];
  papers: Paper[];
  projects: Project[];
}

const SectionHeader = ({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold font-serif text-lg">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
      {count}
    </span>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
    {label}
  </div>
);

export function UnifiedFeed() {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const [data, setData] = useState<FeedData>({ collaborators: [], papers: [], projects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API.discovery.feed);
        const json = await res.json();
        if (json.success && json.data) {
          setData({
            collaborators: json.data.collaborators || [],
            papers: json.data.papers || [],
            projects: json.data.projects || [],
          });
        }
      } catch (err) {
        console.error("Failed to load unified feed:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, fetchWithAuth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <Loader2 className="animate-spin mb-3 text-primary" size={28} />
        <p className="text-sm">Building your unified discovery feed...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Collaborators */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
        <SectionHeader
          icon={<Users size={18} />}
          title="Collaborators"
          count={data.collaborators.length}
        />
        {data.collaborators.length === 0 ? (
          <EmptyState label="No collaborator suggestions yet." />
        ) : (
          <div className="space-y-3">
            {data.collaborators.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {c.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {c.name}
                      </h4>
                      {typeof c.similarityScore === "number" && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                          <Sparkles size={9} />
                          {Math.round(c.similarityScore)}%
                        </span>
                      )}
                    </div>
                    {c.institution && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Building size={11} /> {c.institution}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Papers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
        <SectionHeader icon={<FileText size={18} />} title="Papers" count={data.papers.length} />
        {data.papers.length === 0 ? (
          <EmptyState label="No paper recommendations yet." />
        ) : (
          <div className="space-y-3">
            {data.papers.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
              >
                <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {p.title}
                </h4>
                {p.abstract && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{p.abstract}</p>
                )}
                {typeof p._score === "number" && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full">
                    relevance {p._score.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open Projects */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
        <SectionHeader
          icon={<FolderKanban size={18} />}
          title="Open Projects"
          count={data.projects.length}
        />
        {data.projects.length === 0 ? (
          <EmptyState label="No open projects right now." />
        ) : (
          <div className="space-y-3">
            {data.projects.map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {pr.name}
                  </h4>
                  {pr.status && (
                    <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                      {pr.status}
                    </span>
                  )}
                </div>
                {pr.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{pr.description}</p>
                )}
                {typeof pr.member_count === "number" && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                    <Users size={11} /> {pr.member_count} member{pr.member_count === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
