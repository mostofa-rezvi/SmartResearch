"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, ShieldCheck, RefreshCw, Search, BadgeCheck, XCircle } from "lucide-react";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

const TIERS = ["unverified", "basic", "verified", "professor"] as const;

const TIER_STYLES: Record<string, string> = {
  unverified: "bg-slate-800 text-slate-400 border-slate-700",
  basic: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  professor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

interface TrustUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  trust_tier: string;
  is_institutional: boolean;
  institution_verified: boolean;
  trust_rank: number;
  reputation_points: number;
}

export const TrustManagement: React.FC = () => {
  const { fetchWithAuth } = useApi();
  const [users, setUsers] = useState<TrustUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(API.admin.users({ tier: tierFilter || undefined, q: q || undefined, limit: 50 }));
      const json = await res.json();
      setUsers(json.data || json || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, tierFilter, q]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter]);

  const setTier = async (id: string, tier: string) => {
    setBusyId(id);
    try {
      await fetchWithAuth(API.admin.setTrustTier(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      setUsers((prev) => prev.map((u) => (String(u.id) === id ? { ...u, trust_tier: tier } : u)));
    } catch (err) {
      console.error("Failed to update tier", err);
    } finally {
      setBusyId(null);
    }
  };

  const toggleInstitution = async (id: string, verified: boolean) => {
    setBusyId(id);
    try {
      await fetchWithAuth(API.admin.verifyInstitution(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      setUsers((prev) => prev.map((u) => (String(u.id) === id ? { ...u, institution_verified: verified } : u)));
    } catch (err) {
      console.error("Failed to update institution verification", err);
    } finally {
      setBusyId(null);
    }
  };

  const recomputeTrustRank = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      await fetchWithAuth(API.admin.trustRankRefresh, { method: "POST" });
      setMessage("TrustRank recomputation triggered.");
      await loadUsers();
    } catch (err) {
      console.error("Failed to recompute TrustRank", err);
      setMessage("Failed to trigger recomputation.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="text-primary" /> User Trust Management
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers()}
              placeholder="Search name / email"
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-primary/50"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
          >
            <option value="">All Tiers</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={recomputeTrustRank}
            disabled={refreshing}
            className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Recompute TrustRank
          </button>
        </div>
      </div>

      {message && <p className="text-xs text-emerald-400 mb-4 font-mono">{message}</p>}

      {loading ? (
        <p className="text-sm italic text-slate-600 py-8 text-center animate-pulse">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                <th className="pb-3 font-bold">User</th>
                <th className="pb-3 font-bold">Role</th>
                <th className="pb-3 font-bold text-center">TrustRank</th>
                <th className="pb-3 font-bold text-center">Reputation</th>
                <th className="pb-3 font-bold">Tier</th>
                <th className="pb-3 font-bold text-center">Institution</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = String(u.id);
                const busy = busyId === id;
                return (
                  <tr key={id} className="border-b border-slate-800/50 hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-2 py-1 rounded">{u.role}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300">
                      {typeof u.trust_rank === "number" ? u.trust_rank.toFixed(3) : "—"}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-300">{u.reputation_points ?? 0}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.trust_tier || "unverified"}
                        disabled={busy}
                        onChange={(e) => setTier(id, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border outline-none disabled:opacity-50 ${TIER_STYLES[u.trust_tier] || TIER_STYLES.unverified}`}
                      >
                        {TIERS.map((t) => (
                          <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {u.institution_verified ? (
                        <button
                          onClick={() => toggleInstitution(id, false)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all disabled:opacity-50"
                          title="Click to revoke"
                        >
                          <BadgeCheck size={14} /> Verified
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleInstitution(id, true)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all disabled:opacity-50"
                          title="Click to verify"
                        >
                          <XCircle size={14} /> Unverified
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!users.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm italic text-slate-600">No users match the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TrustManagement;
