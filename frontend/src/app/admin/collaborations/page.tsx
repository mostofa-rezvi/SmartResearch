"use client";

/**
 * Admin — Collaborations. Lists every research-collaboration proposal sent
 * from Discovery, its status, and the team auto-created on acceptance.
 *
 * Guard mirrors the staff console: wait for auth hydration (session is
 * tab-scoped), send unauthenticated visitors to /login, and show a clear
 * unauthorized state for non-admins instead of hanging on "Loading…".
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useAuth, useApi } from "@/context/AuthContext";
import Link from "next/link";
import { ExternalLink, Handshake, Loader2, ShieldAlert } from "lucide-react";

interface AdminCollaboration {
  id: number;
  status: string;
  proposal_title: string;
  proposal_message: string | null;
  created_at: string;
  responded_at: string | null;
  project_id: number | null;
  project_name: string | null;
  requester_id: number;
  requester_name: string;
  recipient_user_id: number | null;
  recipient_name: string;
  recipient_institution: string | null;
  external_recipient: boolean;
}

const STATUS_FILTERS = ["all", "pending", "accepted", "declined"] as const;

export default function AdminCollaborationsPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { fetchWithAuth } = useApi();
  const router = useRouter();
  const [rows, setRows] = useState<AdminCollaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");

  // Session is tab-scoped (sessionStorage): a fresh tab has no session to
  // restore, so redirect to login once hydration says there's no user.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = status === "all" ? API.admin.collaborations : `${API.admin.collaborations}?status=${status}`;
        const res = await fetchWithAuth(url);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          setRows(json.data || []);
        } else {
          setError(json.message || "Failed to load collaborations");
        }
      } catch {
        setError("An error occurred");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [authLoading, user, isAdmin, status, fetchWithAuth]);

  // Hydrating, or unauthenticated (redirect in flight)
  if (authLoading || !user) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center gap-2 text-slate-400">
        <Loader2 size={18} className="animate-spin" /> Loading…
      </div>
    );
  }

  // Logged in but not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen app-bg">
        <Navbar />
        <div className="pt-40 flex flex-col items-center text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <ShieldAlert size={26} />
          </div>
          <h1 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-2">Admins only</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            This page is restricted to platform administrators.
          </p>
          <Link href="/dashboard" className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <Navbar />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <Handshake className="text-secondary dark:text-rose-300" size={34} />
              Research <span className="text-secondary dark:text-rose-300 italic">Collaborations</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Proposals sent from Discovery and the teams created from them.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  status === s
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "neu-btn text-slate-500 dark:text-slate-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm font-semibold border border-red-100 dark:border-red-800/50">
            {error}
          </div>
        )}

        <div className="glass-neu-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                  <th className="p-6">Proposal</th>
                  <th className="p-6">Requester</th>
                  <th className="p-6">Recipient</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Team</th>
                  <th className="p-6">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <div className="skeleton h-10 w-full rounded" />
                    </td>
                  </tr>
                ) : (
                  <>
                    {rows.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-6 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{c.proposal_title}</p>
                          {c.proposal_message && (
                            <p className="text-xs text-slate-400 line-clamp-2">{c.proposal_message}</p>
                          )}
                        </td>
                        <td className="p-6 text-sm text-slate-500 dark:text-slate-400 font-medium">{c.requester_name}</td>
                        <td className="p-6">
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{c.recipient_name}</p>
                          {c.recipient_institution && (
                            <p className="text-xs text-slate-400 line-clamp-1">{c.recipient_institution}</p>
                          )}
                          {c.external_recipient && (
                            <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">
                              External
                            </span>
                          )}
                        </td>
                        <td className="p-6">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            c.status === "accepted" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" :
                            c.status === "declined" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300" :
                            "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-6">
                          {c.project_id ? (
                            <Link
                              href={`/teams/${c.project_id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-primary dark:text-white hover:underline"
                            >
                              {c.project_name || `Team #${c.project_id}`} <ExternalLink size={13} />
                            </Link>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-6 text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                          No collaboration requests{status !== "all" ? ` with status “${status}”` : ""} yet.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
