"use client";

/**
 * Staff Admin Console — /staff/2024/25/admin-panel
 *
 * Security model (defense in depth):
 *  1) Obscure, non-guessable route.
 *  2) Client role guard — anyone who isn't admin/super_admin gets a plain 404,
 *     so the panel's existence isn't advertised.
 *  3) Server RBAC — every endpoint this calls already enforces
 *     requireRole(['admin','super_admin']) (super_admin for invites).
 *
 * This page is a pure client of EXISTING backend endpoints — it introduces no
 * new business logic and does not alter any existing admin flow.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth, useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import {
  LayoutDashboard, Users, ShieldAlert, FileText, UserPlus, ScrollText, Settings2,
  Search, RefreshCw, BadgeCheck, XCircle, Check, X, Trash2, Ban, Mail, Database,
  TrendingUp, MessageSquare, BookOpen, Network, Layers, GraduationCap, Users2,
  CheckCircle2, Loader2, AlertTriangle, ShieldCheck, Activity,
} from "lucide-react";

/* ────────────────────────────── shared helpers ───────────────────────────── */

const cx = (...xs: (string | false | undefined | null)[]) => xs.filter(Boolean).join(" ");
const num = (v: unknown) => (v == null ? 0 : Number(v) || 0);
async function readJson(res: Response) { try { return await res.json(); } catch { return {}; } }

function StatTile({ icon, value, label, hint }: { icon: React.ReactNode; value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="glass-neu-card p-6">
      <div className="w-12 h-12 neu-icon flex items-center justify-center mb-4 text-primary dark:text-white">{icon}</div>
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      {hint && <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">{hint}</div>}
    </div>
  );
}

function Banner({ tone, children }: { tone: "success" | "error" | "info"; children: React.ReactNode }) {
  const map = {
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50",
    error: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-100 dark:border-red-800/50",
    info: "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border-sky-100 dark:border-sky-800/50",
  } as const;
  const Icon = tone === "error" ? AlertTriangle : tone === "success" ? CheckCircle2 : Activity;
  return (
    <div className={cx("mb-6 p-4 rounded-2xl text-sm font-semibold border flex items-center gap-3", map[tone])}>
      <Icon size={18} className="shrink-0" /> {children}
    </div>
  );
}

function SectionHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="glass-neu-card p-12 text-center">
      <div className="w-14 h-14 neu-icon flex items-center justify-center text-primary dark:text-white mx-auto mb-4">{icon}</div>
      <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-1">{title}</h3>
      {text && <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">{text}</p>}
    </div>
  );
}

const inputCls = "w-full neu-inset px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none";

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} role="checkbox" aria-checked={checked}
      className={cx("w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
        checked ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800")}>
      {checked && <Check size={13} />}
    </button>
  );
}

function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total: number }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 mt-4 px-1">
      <span className="text-xs text-slate-400 font-mono">{total} total · page {page + 1} / {pages}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 0} className="px-3 py-1.5 neu-btn text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40">Prev</button>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages - 1} className="px-3 py-1.5 neu-btn text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}

function GrowthChart({ data }: { data: any[] }) {
  const series = [
    { key: "newUsers", label: "Users", color: "bg-primary" },
    { key: "newConnections", label: "Connections", color: "bg-emerald-500" },
    { key: "newPosts", label: "Posts", color: "bg-amber-500" },
  ];
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => num(d[s.key]))));
  return (
    <div className="glass-neu-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Weekly Growth · last 8 weeks</h3>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className={cx("w-2.5 h-2.5 rounded-sm", s.color)} /> {s.label}
            </span>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 py-10 text-center">No growth data for this window yet.</p>
      ) : (
        <div className="flex items-end gap-2 sm:gap-3 h-48">
          {data.map((d, i) => (
            <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                {series.map((s) => (
                  <div key={s.key} title={`${s.label}: ${num(d[s.key])}`}
                    className={cx("w-2.5 sm:w-3 rounded-t transition-all hover:opacity-80", s.color)}
                    style={{ height: `${Math.max(2, (num(d[s.key]) / max) * 100)}%` }} />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 truncate max-w-full">{d.week}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── Overview ─────────────────────────────────── */

function OverviewSection() {
  const { fetchWithAuth } = useApi();
  const [ov, setOv] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [growth, setGrowth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, b, g] = await Promise.all([
          fetchWithAuth(API.analytics.overview).then(readJson).catch(() => ({})),
          fetchWithAuth(API.admin.moderationStats).then(readJson).catch(() => ({})),
          fetchWithAuth(API.analytics.growth).then(readJson).catch(() => ({})),
        ]);
        setOv(a?.data || {});
        setStats(b?.data || {});
        setGrowth(Array.isArray(g?.data) ? g.data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchWithAuth]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-neu-card p-6"><div className="skeleton w-12 h-12 rounded-2xl mb-4" /><div className="skeleton h-7 w-16 rounded mb-2" /><div className="skeleton h-3 w-24 rounded" /></div>
        ))}
      </div>
    );
  }

  const roles: any[] = ov?.usersByRole || ov?.roleDistribution || [];
  const domains: any[] = ov?.topDomains || [];
  const roleTotal = roles.reduce((s, r) => s + num(r.count), 0) || 1;

  const tiles = [
    { icon: <Users2 size={20} />, value: num(ov?.totalUsers), label: "Total Users", hint: `${num(ov?.activeUsersLast7Days)} active / 7d` },
    { icon: <Network size={20} />, value: num(ov?.totalConnections), label: "Connections" },
    { icon: <GraduationCap size={20} />, value: num(ov?.totalMentorships), label: "Mentorships" },
    { icon: <MessageSquare size={20} />, value: num(ov?.totalPosts), label: "Community Posts" },
    { icon: <Users size={20} />, value: num(ov?.totalGroups), label: "Lab Groups" },
    { icon: <BookOpen size={20} />, value: num(ov?.totalJournals), label: "Journals Indexed" },
    { icon: <Layers size={20} />, value: num(ov?.totalProjects), label: "Projects" },
    { icon: <ShieldAlert size={20} />, value: num(stats?.pendingFlags), label: "Pending Flags", hint: "needs review" },
  ];

  return (
    <div>
      <SectionHead title="Platform Overview" subtitle="Live health and activity across the ResearchBridge ecosystem." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-neu-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">Role Distribution</h3>
          <div className="space-y-4">
            {roles.length === 0 && <p className="text-sm text-slate-400">No data.</p>}
            {roles.map((r) => (
              <div key={r.role}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{String(r.role).replace("_", " ")}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">{num(r.count)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${(num(r.count) / roleTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-neu-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">Top Research Domains</h3>
          <div className="flex flex-wrap gap-2">
            {domains.length === 0 && <p className="text-sm text-slate-400">No data.</p>}
            {domains.map((d) => (
              <span key={d.domain} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary dark:text-white text-xs font-bold">
                {d.domain} <span className="font-mono text-primary/60 dark:text-white/60">{num(d.count)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <GrowthChart data={growth} />
      </div>
    </div>
  );
}

/* ────────────────────────────── Users & Trust ────────────────────────────── */

const TIERS = ["unverified", "basic", "verified", "professor"] as const;
const TIER_PILL: Record<string, string> = {
  unverified: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300",
  basic: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300",
  verified: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300",
  professor: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300",
};

function UsersSection() {
  const { fetchWithAuth } = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [bulkTier, setBulkTier] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const PAGE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(API.admin.users({ tier: tier || undefined, q: q || undefined, limit: 200 }));
      const json = await readJson(res);
      setUsers(json.data || []);
      setPage(0); setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, tier, q]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tier]);

  const setUserTier = async (id: string, value: string) => {
    setBusyId(id);
    try {
      await fetchWithAuth(API.admin.setTrustTier(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: value }) });
      setUsers((p) => p.map((u) => (String(u.id) === id ? { ...u, trust_tier: value } : u)));
    } finally { setBusyId(null); }
  };
  const toggleInstitution = async (id: string, verified: boolean) => {
    setBusyId(id);
    try {
      await fetchWithAuth(API.admin.verifyInstitution(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified }) });
      setUsers((p) => p.map((u) => (String(u.id) === id ? { ...u, institution_verified: verified } : u)));
    } finally { setBusyId(null); }
  };
  const recompute = async () => {
    setRefreshing(true); setMsg(null);
    try { await fetchWithAuth(API.admin.trustRankRefresh, { method: "POST" }); setMsg("TrustRank recomputation triggered."); await load(); }
    catch { setMsg("Failed to trigger recomputation."); }
    finally { setRefreshing(false); }
  };

  const pages = Math.max(1, Math.ceil(users.length / PAGE));
  const pageUsers = users.slice(page * PAGE, page * PAGE + PAGE);
  const pageIds = pageUsers.map((u) => String(u.id));
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAllPage = () => setSelected((s) => { const n = new Set(s); if (allOnPage) pageIds.forEach((id) => n.delete(id)); else pageIds.forEach((id) => n.add(id)); return n; });
  const applyBulkTier = async () => {
    if (!bulkTier || selected.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => fetchWithAuth(API.admin.setTrustTier(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: bulkTier }) }).catch(() => {})));
    setUsers((p) => p.map((u) => (selected.has(String(u.id)) ? { ...u, trust_tier: bulkTier } : u)));
    setMsg(`Updated ${ids.length} user(s) to "${bulkTier}".`);
    setSelected(new Set()); setBulkTier(""); setBulkBusy(false);
  };

  return (
    <div>
      <SectionHead
        title="Users & Trust"
        subtitle="Manage trust tiers, institutional verification and credibility ranking."
        actions={
          <button onClick={recompute} disabled={refreshing} className="px-4 py-2.5 neu-btn text-sm font-bold text-primary dark:text-white flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Recompute TrustRank
          </button>
        }
      />
      {msg && <Banner tone="success">{msg}</Banner>}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 neu-inset px-4 py-2 w-full sm:max-w-xs">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search name / email" className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400" />
        </div>
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="neu-inset px-4 py-2 text-sm text-slate-900 dark:text-white outline-none sm:w-44">
          <option value="">All Tiers</option>
          {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="glass-neu-card p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.size} selected</span>
          <div className="flex items-center gap-2 sm:ml-auto">
            <select value={bulkTier} onChange={(e) => setBulkTier(e.target.value)} className="neu-inset px-3 py-2 text-sm text-slate-900 dark:text-white outline-none">
              <option value="">Set tier to…</option>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={applyBulkTier} disabled={!bulkTier || bulkBusy} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-secondary disabled:opacity-50 flex items-center gap-2">{bulkBusy && <Loader2 size={14} className="animate-spin" />} Apply</button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-2 neu-btn text-sm font-bold text-slate-600 dark:text-slate-300">Clear</button>
          </div>
        </div>
      )}

      <div className="glass-neu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="p-5 w-10"><CheckBox checked={allOnPage} onChange={toggleAllPage} /></th>
                <th className="p-5 font-bold">User</th>
                <th className="p-5 font-bold">Role</th>
                <th className="p-5 font-bold text-center">TrustRank</th>
                <th className="p-5 font-bold text-center">Reputation</th>
                <th className="p-5 font-bold">Tier</th>
                <th className="p-5 font-bold text-center">Institution</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-700/40"><td className="p-5" colSpan={7}><div className="skeleton h-6 w-full rounded" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm">No users match the current filter.</td></tr>
              ) : pageUsers.map((u) => {
                const id = String(u.id); const busy = busyId === id;
                return (
                  <tr key={id} className="border-b border-slate-50 dark:border-slate-700/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-5"><CheckBox checked={selected.has(id)} onChange={() => toggle(id)} /></td>
                    <td className="p-5"><div className="font-bold text-slate-900 dark:text-white">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></td>
                    <td className="p-5"><span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{String(u.role).replace("_", " ")}</span></td>
                    <td className="p-5 text-center font-mono text-slate-600 dark:text-slate-300">{typeof u.trust_rank === "number" ? u.trust_rank.toFixed(3) : "—"}</td>
                    <td className="p-5 text-center font-bold text-slate-600 dark:text-slate-300">{num(u.reputation_points)}</td>
                    <td className="p-5">
                      <select value={u.trust_tier || "unverified"} disabled={busy} onChange={(e) => setUserTier(id, e.target.value)} className={cx("text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none border-0 disabled:opacity-50", TIER_PILL[u.trust_tier] || TIER_PILL.unverified)}>
                        {TIERS.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t}</option>)}
                      </select>
                    </td>
                    <td className="p-5 text-center">
                      {u.institution_verified ? (
                        <button onClick={() => toggleInstitution(id, false)} disabled={busy} title="Click to revoke" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300 transition-all disabled:opacity-50"><BadgeCheck size={14} /> Verified</button>
                      ) : (
                        <button onClick={() => toggleInstitution(id, true)} disabled={busy} title="Click to verify" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 transition-all disabled:opacity-50"><XCircle size={14} /> Unverified</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pager page={page} pages={pages} total={users.length} onPage={setPage} />
    </div>
  );
}

/* ────────────────────────────── Moderation ───────────────────────────────── */

function ModerationSection() {
  const { fetchWithAuth } = useApi();
  const [flags, setFlags] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await readJson(await fetchWithAuth(API.admin.moderationQueue));
      setFlags(json.data?.flags || []);
      setJournals(json.data?.journals || []);
    } finally { setLoading(false); }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  const resolveFlag = async (id: string, action: "delete_post" | "dismiss") => {
    setBusy(`f${id}`);
    try {
      await fetchWithAuth(API.admin.resolveFlag(id), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason: action === "delete_post" ? "Removed by moderator" : "Dismissed by moderator" }) });
      setFlags((p) => p.filter((f) => String(f.id) !== id));
    } finally { setBusy(null); }
  };
  const setJournalStatus = async (id: string, status: "approved" | "rejected") => {
    setBusy(`j${id}`);
    try {
      await fetchWithAuth(API.admin.journalStatus(id), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setJournals((p) => p.filter((j) => String(j.id) !== id));
    } finally { setBusy(null); }
  };

  return (
    <div>
      <SectionHead title="Moderation Queue" subtitle="Review flagged content and pending journal submissions."
        actions={<button onClick={load} className="px-4 py-2.5 neu-btn text-sm font-bold text-primary dark:text-white flex items-center gap-2"><RefreshCw size={15} /> Refresh</button>} />

      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Flagged Content ({flags.length})</h3>
      {loading ? (
        <div className="glass-neu-card p-6 mb-8"><div className="skeleton h-16 w-full rounded" /></div>
      ) : flags.length === 0 ? (
        <div className="mb-8"><EmptyState icon={<ShieldCheck size={26} />} title="No flagged content" text="The community queue is clear." /></div>
      ) : (
        <div className="space-y-4 mb-8">
          {flags.map((f) => (
            <div key={f.id} className="glass-neu-card p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">Flagged</span>
                    {f.reason && <span className="text-xs text-slate-500 dark:text-slate-400">reason: {f.reason}</span>}
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{f.post_title || "Untitled post"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{f.post_content}</p>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono">Reported by {f.reporter_name || "anonymous"} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => resolveFlag(String(f.id), "dismiss")} disabled={busy === `f${f.id}`} className="px-3 py-2 neu-btn text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 disabled:opacity-50"><Check size={14} /> Dismiss</button>
                  <button onClick={() => resolveFlag(String(f.id), "delete_post")} disabled={busy === `f${f.id}`} className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"><Trash2 size={14} /> Delete Post</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Pending Journals ({journals.length})</h3>
      {loading ? (
        <div className="glass-neu-card p-6"><div className="skeleton h-12 w-full rounded" /></div>
      ) : journals.length === 0 ? (
        <EmptyState icon={<BookOpen size={26} />} title="No pending journals" text="All journal submissions have been reviewed." />
      ) : (
        <div className="space-y-3">
          {journals.map((j) => (
            <div key={j.id} className="glass-neu-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{j.name || j.title || `Journal #${j.id}`}</p>
                <p className="text-xs text-slate-400 font-mono">{[j.issn, j.publisher, j.geography].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setJournalStatus(String(j.id), "approved")} disabled={busy === `j${j.id}`} className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50"><Check size={14} /> Approve</button>
                <button onClick={() => setJournalStatus(String(j.id), "rejected")} disabled={busy === `j${j.id}`} className="px-3 py-2 neu-btn text-xs font-bold text-red-600 dark:text-red-300 flex items-center gap-1.5 disabled:opacity-50"><Ban size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── Content (Blogs) ──────────────────────────── */

function ContentSection() {
  const { fetchWithAuth } = useApi();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const json = await readJson(await fetchWithAuth(API.blogs.adminList)); setBlogs(json.data || []); setSelected(new Set()); }
    finally { setLoading(false); }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  const update = async (id: number, status: string) => {
    await fetchWithAuth(API.blogs.updateStatus(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBlogs((p) => p.map((b) => (b.id === id ? { ...b, status } : b)));
  };
  const bulkUpdate = async (status: string) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) => fetchWithAuth(API.blogs.updateStatus(id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).catch(() => {})));
    setBlogs((p) => p.map((b) => (selected.has(b.id) ? { ...b, status } : b)));
    setSelected(new Set()); setBulkBusy(false);
  };

  const shown = filter === "all" ? blogs : blogs.filter((b) => b.status === filter);
  const shownIds = shown.map((b) => b.id);
  const allShown = shownIds.length > 0 && shownIds.every((id) => selected.has(id));
  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => { const n = new Set(s); if (allShown) shownIds.forEach((id) => n.delete(id)); else shownIds.forEach((id) => n.add(id)); return n; });
  const counts = { all: blogs.length, pending: blogs.filter((b) => b.status === "pending").length, approved: blogs.filter((b) => b.status === "approved").length, rejected: blogs.filter((b) => b.status === "rejected").length };

  return (
    <div>
      <SectionHead title="Content Review" subtitle="Approve or reject user-submitted articles for The Chronicle." />
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cx("px-4 py-2 rounded-full text-xs font-bold capitalize transition-all", filter === f ? "bg-primary text-white" : "neu-btn text-slate-600 dark:text-slate-300")}>
            {f} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="glass-neu-card p-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{selected.size} selected</span>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button onClick={() => bulkUpdate("approved")} disabled={bulkBusy} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"><Check size={15} /> Approve</button>
            <button onClick={() => bulkUpdate("rejected")} disabled={bulkBusy} className="px-4 py-2 neu-btn text-sm font-bold text-red-600 dark:text-red-300 flex items-center gap-1.5 disabled:opacity-50"><X size={15} /> Reject</button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-2 neu-btn text-sm font-bold text-slate-600 dark:text-slate-300">Clear</button>
          </div>
        </div>
      )}

      <div className="glass-neu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <th className="p-5 w-10"><CheckBox checked={allShown} onChange={toggleAll} /></th><th className="p-5">Title</th><th className="p-5">Author</th><th className="p-5">Status</th><th className="p-5">Date</th><th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8"><div className="skeleton h-10 w-full rounded" /></td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400 text-sm">No articles in this view.</td></tr>
              ) : shown.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 dark:border-slate-700/40 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-5"><CheckBox checked={selected.has(b.id)} onChange={() => toggle(b.id)} /></td>
                  <td className="p-5"><p className="font-bold text-slate-900 dark:text-white line-clamp-1 mb-1">{b.title}</p><span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-white bg-primary/10 px-2 py-0.5 rounded">{b.category}</span></td>
                  <td className="p-5 text-slate-500 dark:text-slate-400">{b.author}</td>
                  <td className="p-5"><span className={cx("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", b.status === "approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" : b.status === "rejected" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300")}>{b.status}</span></td>
                  <td className="p-5 text-slate-500 dark:text-slate-400">{b.created_at ? new Date(b.created_at).toLocaleDateString() : ""}</td>
                  <td className="p-5"><div className="flex items-center justify-end gap-2">
                    <button onClick={() => update(b.id, "approved")} disabled={b.status === "approved"} title="Approve" className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-colors disabled:opacity-40"><Check size={18} /></button>
                    <button onClick={() => update(b.id, "rejected")} disabled={b.status === "rejected"} title="Reject" className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 transition-colors disabled:opacity-40"><X size={18} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── Invitations ──────────────────────────────── */

function InvitationsSection({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const { fetchWithAuth } = useApi();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (!isSuperAdmin) {
    return <EmptyState icon={<ShieldAlert size={26} />} title="Super-admin only" text="Only super administrators can issue academic invitations." />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      const res = await fetchWithAuth(API.admin.invite, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
      const json = await readJson(res);
      if (res.ok) { setMsg({ tone: "success", text: "Invitation created — a secure onboarding link was generated." }); setName(""); setEmail(""); }
      else setMsg({ tone: "error", text: json.error?.message || json.message || "Failed to send invitation." });
    } catch { setMsg({ tone: "error", text: "Connection error." }); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl">
      <SectionHead title="Invitations" subtitle="Invite distinguished scholars — they receive a secure onboarding link." />
      {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
      <form onSubmit={submit} className="glass-neu-card p-8 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Scholar Full Name</label>
          <div className="relative">
            <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Prof. Julian Barnes" className={cx(inputCls, "pl-12")} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Institutional Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="j.barnes@university.edu" className={cx(inputCls, "pl-12")} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={18} /> Generate Invite</>}
        </button>
      </form>
    </div>
  );
}

/* ────────────────────────────── Audit Log ────────────────────────────────── */

function AuditSection() {
  const { fetchWithAuth } = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try { const json = await readJson(await fetchWithAuth(API.admin.auditLogs)); setLogs(json.data || []); setPage(0); }
    finally { setLoading(false); }
  }, [fetchWithAuth]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <SectionHead title="Audit Log" subtitle="Immutable trail of the last 100 administrative actions."
        actions={<button onClick={load} className="px-4 py-2.5 neu-btn text-sm font-bold text-primary dark:text-white flex items-center gap-2"><RefreshCw size={15} /> Refresh</button>} />
      <div className="glass-neu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <th className="p-5">When</th><th className="p-5">Admin</th><th className="p-5">Action</th><th className="p-5">Target</th><th className="p-5">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8"><div className="skeleton h-10 w-full rounded" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 text-sm">No audit entries yet.</td></tr>
              ) : logs.slice(page * PAGE, page * PAGE + PAGE).map((l) => (
                <tr key={l.id} className="border-b border-slate-50 dark:border-slate-700/40">
                  <td className="p-5 font-mono text-xs text-slate-400 whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleString() : ""}</td>
                  <td className="p-5 font-bold text-slate-900 dark:text-white">{l.admin_name || `#${l.admin_id}`}</td>
                  <td className="p-5"><span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-white bg-primary/10 px-2 py-1 rounded">{l.action}</span></td>
                  <td className="p-5 text-slate-500 dark:text-slate-400 font-mono text-xs">{l.target_type} #{l.target_id}</td>
                  <td className="p-5 text-slate-500 dark:text-slate-400 text-xs max-w-[240px] truncate">{typeof l.details === "string" ? l.details : JSON.stringify(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pager page={page} pages={Math.max(1, Math.ceil(logs.length / PAGE))} total={logs.length} onPage={setPage} />
    </div>
  );
}

/* ────────────────────────────── System ───────────────────────────────────── */

function SystemSection() {
  const { fetchWithAuth } = useApi();
  const [trustMsg, setTrustMsg] = useState<string | null>(null);
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, url: string, onMsg: (m: string) => void) => {
    setBusy(key); onMsg("");
    try { const json = await readJson(await fetchWithAuth(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })); onMsg(json.meta?.message || json.data?.message || "Done."); }
    catch { onMsg("Request failed."); }
    finally { setBusy(null); }
  };

  return (
    <div>
      <SectionHead title="System & Pipelines" subtitle="Maintenance operations. Use with care — these run heavy background jobs." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-neu-card p-6">
          <div className="w-12 h-12 neu-icon flex items-center justify-center mb-4 text-primary dark:text-white"><TrendingUp size={20} /></div>
          <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-1">Recompute TrustRank</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Recalculate the credibility PageRank across the researcher graph.</p>
          {trustMsg && <p className="text-xs font-mono text-emerald-600 dark:text-emerald-300 mb-3">{trustMsg}</p>}
          <button onClick={() => run("trust", API.admin.trustRankRefresh, setTrustMsg)} disabled={busy === "trust"} className="px-5 py-2.5 neu-btn text-sm font-bold text-primary dark:text-white flex items-center gap-2 disabled:opacity-50">
            {busy === "trust" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Run recomputation
          </button>
        </div>

        <div className="glass-neu-card p-6">
          <div className="w-12 h-12 neu-icon flex items-center justify-center mb-4 text-primary dark:text-white"><Database size={20} /></div>
          <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-1">Backfill Pipelines</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Re-sync search (Elasticsearch) &amp; graph (Neo4j) indexes from Postgres.</p>
          {backfillMsg && <p className="text-xs font-mono text-emerald-600 dark:text-emerald-300 mb-3">{backfillMsg}</p>}
          <button onClick={() => run("backfill", API.admin.backfill, setBackfillMsg)} disabled={busy === "backfill"} className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50">
            {busy === "backfill" ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />} Run backfill
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── 404 (guard) ──────────────────────────────── */

function NotFound() {
  return (
    <div className="min-h-screen app-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="text-7xl font-serif font-black text-slate-300 dark:text-slate-700 mb-4">404</div>
      <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-2">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">The page you are looking for doesn’t exist or has been moved.</p>
      <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-secondary transition-all shadow-lg">Go home</a>
    </div>
  );
}

/* ────────────────────────────── Shell ────────────────────────────────────── */

type SectionDef = { key: string; label: string; icon: React.ReactNode; superOnly?: boolean };
const SECTIONS: SectionDef[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { key: "users", label: "Users & Trust", icon: <Users size={18} /> },
  { key: "moderation", label: "Moderation", icon: <ShieldAlert size={18} /> },
  { key: "content", label: "Content", icon: <FileText size={18} /> },
  { key: "invitations", label: "Invitations", icon: <UserPlus size={18} />, superOnly: true },
  { key: "audit", label: "Audit Log", icon: <ScrollText size={18} /> },
  { key: "system", label: "System", icon: <Settings2 size={18} /> },
];

export default function AdminPanelPage() {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<string>("overview");

  const isStaff = !!user && (user.role === "admin" || user.role === "super_admin");

  // The session is tab-scoped (sessionStorage), so reaching this deliberately
  // unlinked URL in a fresh tab — a bookmark, a pasted link — has no session to
  // restore. Send unauthenticated visitors to log in and come back here instead
  // of dead-ending them on the 404 guard. Logged-in non-admins still get the 404
  // below, which keeps the panel's existence hidden from ordinary users.
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/staff/2024/25/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return <div className="min-h-screen app-bg" />;
  if (!isStaff) return <NotFound />;

  const visible = SECTIONS.filter((s) => !s.superOnly || isSuperAdmin);

  return (
    <div className="min-h-screen app-bg">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-6 max-w-[1500px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary dark:text-rose-300 mb-2 block uppercase flex items-center gap-2">
            <ShieldCheck size={14} /> Staff Console · {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-primary dark:text-white leading-tight">
            Control <span className="text-secondary dark:text-rose-300 italic">Center</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Govern users, content, credibility and system pipelines from one place.</p>
        </header>

        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8">
          {/* Sidebar */}
          <aside>
            <div className="glass-neu-card p-3 lg:sticky lg:top-28">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                {visible.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setTab(s.key)}
                    className={cx(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0",
                      tab === s.key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Section */}
          <section className="min-w-0">
            {tab === "overview" && <OverviewSection />}
            {tab === "users" && <UsersSection />}
            {tab === "moderation" && <ModerationSection />}
            {tab === "content" && <ContentSection />}
            {tab === "invitations" && <InvitationsSection isSuperAdmin={isSuperAdmin} />}
            {tab === "audit" && <AuditSection />}
            {tab === "system" && <SystemSection />}
          </section>
        </div>
      </main>
    </div>
  );
}
