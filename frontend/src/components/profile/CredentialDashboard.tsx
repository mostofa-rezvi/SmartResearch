"use client";

import React, { useState, useEffect, useCallback } from "react";
import { API } from "@/config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Lock,
  Star,
  Zap,
  BookOpen,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number;
  action: string;
  changed_fields: string[];
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface AchievementThreshold {
  level: "bronze" | "silver" | "gold" | "platinum";
  min: number;
}

interface Achievement {
  type: string;
  label: string;
  description: string;
  icon: string;
  current_count: number;
  earned_level: string | null;
  computed_level: string | null;
  awarded_at: string | null;
  next_threshold: { level: string; required: number } | null;
  thresholds: AchievementThreshold[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  bronze: "from-amber-600 to-amber-400",
  silver: "from-slate-400 to-slate-300",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-indigo-400 to-cyan-300",
};

const LEVEL_BG: Record<string, string> = {
  bronze: "bg-amber-50 border-amber-200",
  silver: "bg-slate-50 border-slate-200",
  gold: "bg-yellow-50 border-yellow-200",
  platinum: "bg-indigo-50 border-indigo-200",
};

const LEVEL_TEXT: Record<string, string> = {
  bronze: "text-amber-700",
  silver: "text-slate-600",
  gold: "text-yellow-700",
  platinum: "text-indigo-600",
};

const ACTION_LABELS: Record<string, string> = {
  profile_update: "Profile Updated",
  avatar_update: "Avatar Changed",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Display Name",
  bio: "Biography",
  institution_id: "Institution",
  personal_website: "Personal Website",
  linkedin_url: "LinkedIn",
  google_scholar_url: "Google Scholar",
  researchgate_url: "ResearchGate",
  educational_status: "Academic Status",
  research_interests: "Research Interests",
  avatar_url: "Profile Photo",
  skills: "Skills",
  domains: "Research Domains",
  goals: "Collaboration Goals",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AchievementCard({ ach }: { ach: Achievement }) {
  const earned = ach.earned_level;
  const LEVELS = ["bronze", "silver", "gold", "platinum"];
  const earnedIdx = earned ? LEVELS.indexOf(earned) : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
        earned
          ? `${LEVEL_BG[earned]} shadow-md`
          : "bg-white border-slate-100 opacity-70"
      }`}
    >
      {/* Badge Icon */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
            earned
              ? `bg-gradient-to-br ${LEVEL_COLORS[earned]} text-white`
              : "bg-slate-100 grayscale"
          }`}
        >
          {ach.icon}
        </div>
        {earned && (
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${LEVEL_BG[earned]} ${LEVEL_TEXT[earned]}`}
          >
            {earned}
          </span>
        )}
        {!earned && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 flex items-center gap-1">
            <Lock size={9} /> Locked
          </span>
        )}
      </div>

      <div>
        <h4 className="font-bold text-sm text-slate-900">{ach.label}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{ach.description}</p>
      </div>

      {/* Progress bar */}
      {ach.next_threshold && (
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
            <span>{ach.current_count} / {ach.next_threshold.required} for {ach.next_threshold.level}</span>
            <span>{Math.min(100, Math.round((ach.current_count / ach.next_threshold.required) * 100))}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                ach.next_threshold.level in LEVEL_COLORS
                  ? LEVEL_COLORS[ach.next_threshold.level]
                  : "from-primary to-secondary"
              } transition-all duration-700`}
              style={{
                width: `${Math.min(100, (ach.current_count / ach.next_threshold.required) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {!ach.next_threshold && earned === "platinum" && (
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
          <CheckCircle2 size={14} />
          Maximum level achieved
        </div>
      )}

      {/* Level pips */}
      <div className="flex items-center gap-1.5 mt-auto">
        {LEVELS.map((lvl, i) => (
          <div
            key={lvl}
            className={`flex-1 h-1 rounded-full transition-all ${
              i <= earnedIdx
                ? `bg-gradient-to-r ${LEVEL_COLORS[lvl]}`
                : "bg-slate-100"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function AuditLogEntry({ entry, idx }: { entry: AuditEntry; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.created_at);

  const changedLabels = (entry.changed_fields || [])
    .map((f) => FIELD_LABELS[f] || f)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="relative pl-8"
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span className="text-sm font-bold text-slate-800">
                {ACTION_LABELS[entry.action] || entry.action.replace(/_/g, " ")}
              </span>
            </div>
            {changedLabels && (
              <p className="text-xs text-slate-500 ml-5">
                Changed: <span className="font-semibold text-slate-700">{changedLabels}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-bold text-slate-400">
              {date.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[10px] text-slate-300">
              {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            <ChevronRight
              size={14}
              className={`text-slate-300 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 rounded-b-2xl border border-t-0 border-slate-100 px-4 pb-4 pt-3 space-y-2">
              {entry.ip_address && (
                <p className="text-[11px] text-slate-400 font-mono">
                  IP: {entry.ip_address}
                </p>
              )}
              {Object.keys(entry.new_values || {}).map((field) => (
                <div key={field} className="text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    {FIELD_LABELS[field] || field}
                  </span>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <span className="line-through text-slate-400 bg-red-50 px-1.5 py-0.5 rounded text-[11px]">
                      {String(entry.old_values?.[field] ?? "—").slice(0, 80)}
                    </span>
                    <span className="text-slate-700 bg-green-50 px-1.5 py-0.5 rounded text-[11px]">
                      {String(entry.new_values?.[field] ?? "—").slice(0, 80)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CredentialDashboard() {
  const [tab, setTab] = useState<"achievements" | "audit">("achievements");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verify, setVerify] = useState<{ valid: boolean; verified: number } | null>(null);

  const AUDIT_LIMIT = 10;

  const fetchVerify = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API.profiles.verifyAuditLog, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setVerify((await res.json()).data);
    } catch {
      /* non-fatal */
    }
  }, []);

  const fetchAchievements = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API.profiles.achievements, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load achievements");
      const data = await res.json();
      setAchievements(data.data?.achievements || []);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const fetchAuditLog = useCallback(async (page: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API.profiles.auditLog}?page=${page}&limit=${AUDIT_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load audit log");
      const data = await res.json();
      setAuditLogs(data.data?.logs || []);
      setAuditTotal(data.data?.total || 0);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAchievements(), fetchAuditLog(1), fetchVerify()]);
      setLoading(false);
    };
    init();
  }, [fetchAchievements, fetchAuditLog, fetchVerify]);

  const handlePageChange = (newPage: number) => {
    setAuditPage(newPage);
    fetchAuditLog(newPage);
  };

  const earnedCount = achievements.filter((a) => a.earned_level).length;
  const totalPages = Math.ceil(auditTotal / AUDIT_LIMIT);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-slate-100 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="text-primary" size={22} />
              Researcher Credentials
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Your verified academic achievements and profile history
            </p>
          </div>
          {!loading && (
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-2 text-center shadow-sm">
                <div className="text-2xl font-black text-primary">{earnedCount}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Badges Earned
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 px-4 py-2 text-center shadow-sm">
                <div className="text-2xl font-black text-slate-700">{auditTotal}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Change Events
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-5">
          {(["achievements", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t
                  ? "bg-white shadow text-primary border border-primary/20"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {t === "achievements" ? (
                <><Star size={14} /> Achievements</>
              ) : (
                <><Clock size={14} /> Audit Log</>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading credentials...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 gap-3 text-red-400">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : tab === "achievements" ? (
          <div className="space-y-4">
            {achievements.length === 0 ? (
              <p className="text-center text-slate-400 italic py-10 text-sm">
                No achievements data available.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <AchievementCard key={ach.type} ach={ach} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Audit Log Tab */
          <div className="space-y-4">
            {verify && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${
                verify.valid
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
              }`}>
                <ShieldCheck size={15} />
                {verify.valid
                  ? `Integrity verified — ${verify.verified} record${verify.verified === 1 ? "" : "s"} form an unbroken, tamper-evident chain.`
                  : "Integrity check failed — this credential log has been tampered with."}
              </div>
            )}
            {auditLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No profile changes recorded yet.</p>
                <p className="text-xs mt-1">Every update you make will appear here.</p>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <div className="relative space-y-4 before:absolute before:left-[7px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary/30 before:via-slate-200 before:to-transparent">
                  {auditLogs.map((entry, idx) => (
                    <AuditLogEntry key={entry.id} entry={entry} idx={idx} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handlePageChange(auditPage - 1)}
                      disabled={auditPage === 1}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Page {auditPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(auditPage + 1)}
                      disabled={auditPage === totalPages}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-2">
                  🔒 Append-only log · Immutable record of all profile changes
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
