"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, XCircle, Globe, Activity, Eye, Trash2, ShieldCheck, MailPlus, TerminalSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const { user, token, isSuperAdmin, isAdmin } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>({ totalUsers: 0, pendingFlags: 0, activeHubs: [] });
  const [queue, setQueue] = useState({ flags: [], journals: [] });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      router.push("/");
      return;
    }
    fetchDashboardData();
  }, [isAdmin, isSuperAdmin]);

  const fetchDashboardData = async () => {
    try {
      const headers = { "x-auth-token": token || "" };
      const [statsRes, queueRes, logsRes] = await Promise.all([
        fetch("http://localhost:5000/api/moderation/stats", { headers }),
        fetch("http://localhost:5000/api/moderation/queue", { headers }),
        fetch("http://localhost:5000/api/moderation/audit_logs", { headers })
      ]);
      setStats(await statsRes.json());
      setQueue(await queueRes.json());
      setLogs(await logsRes.json());
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const resolveFlag = async (id: number, action: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`http://localhost:5000/api/moderation/resolve_flag/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token || "" },
        body: JSON.stringify({ action, reason: "Admin Discretion" })
      });
      fetchDashboardData();
    } catch (err) {}
  };

  const updateJournalStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://localhost:5000/api/moderation/journals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token || "" },
        body: JSON.stringify({ status })
      });
      fetchDashboardData();
    } catch (err) {}
  };

  if (loading) return <div className="pt-32 text-center">Authenticating Clearance...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <Navbar />
      
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-6 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <ShieldAlert className="text-red-500" /> Operational Backbone
            </h1>
            <p className="text-slate-500 mt-1">High-Security Administrative & Moderation Control Panel</p>
          </div>
          {isSuperAdmin && (
            <Link href="/admin/invite" className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-all">
              <MailPlus size={18} /> Enter Invitation Portal
            </Link>
          )}
        </header>

        {/* Global Hubs & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <Activity className="text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Active Researchers</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <ShieldAlert className="text-red-500 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.pendingFlags}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pending Flags</p>
          </div>
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <Globe className="absolute -right-4 -bottom-4 text-slate-800" size={120} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 relative z-10">Global Activity Hubs</h3>
            <div className="flex gap-6 relative z-10">
              {stats.activeHubs?.map((hub: any, i: number) => (
                <div key={i}>
                  <p className="text-xl font-bold text-white">{hub.count}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[100px]">{hub.geography || 'Global'}</p>
                </div>
              ))}
              {(!stats.activeHubs?.length) && <p className="text-xs italic">Awaiting Hub Data...</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Moderation Queue */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                 <ShieldCheck className="text-emerald-500" /> Pending Journal Listings
              </h2>
              <div className="space-y-4">
                {queue.journals.map((j: any) => (
                  <div key={j.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white">{j.name}</h4>
                      <p className="text-xs text-slate-500">ISSN: {j.issn} • Tier: {j.quality_tier} • Hub: {j.geography}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => updateJournalStatus(j.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"><CheckCircle size={18} /></button>
                       <button onClick={() => updateJournalStatus(j.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><XCircle size={18} /></button>
                    </div>
                  </div>
                ))}
                {!queue.journals.length && <p className="text-sm italic text-slate-600">No journals pending review.</p>}
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                 <ShieldAlert className="text-red-500" /> Content Flag Queue
              </h2>
              <div className="space-y-4">
                {queue.flags.map((f: any) => (
                  <div key={f.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-500 px-2 py-1 rounded">Reported by {f.reporter_name || 'Anonymous'}</span>
                      <span className="text-xs text-slate-600">{new Date(f.created_at).toLocaleString()}</span>
                    </div>
                    <div className="pl-4 border-l-2 border-slate-800 mb-4 py-2">
                       {f.post_title && <h5 className="font-bold text-slate-300 text-sm mb-1">{f.post_title}</h5>}
                       <p className="text-sm text-slate-500">"{f.post_content}"</p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg text-xs text-slate-400 mb-4 font-mono">
                      <span className="font-bold text-slate-300">Reason:</span> {f.reason}
                    </div>
                    <div className="flex justify-end gap-3 text-sm font-bold">
                       <button onClick={() => resolveFlag(f.id, 'dismiss')} className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors"><Eye size={16}/> Dismiss Flag</button>
                       <button onClick={() => resolveFlag(f.id, 'delete_post')} className="flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"><Trash2 size={16}/> Remove Content</button>
                    </div>
                  </div>
                ))}
                {!queue.flags.length && <p className="text-sm italic text-slate-600">The community flag queue is empty.</p>}
              </div>
            </section>
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-24 h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
              <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                 <TerminalSquare className="text-primary" /> Immutable Audit Log
              </h2>
              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-4">
                {logs.map((log: any) => (
                  <div key={log.id} className="text-xs font-mono border-b border-slate-800/50 pb-3">
                    <div className="text-primary/70 mb-1">{new Date(log.created_at).toLocaleString()}</div>
                    <div className="text-white"><span className="text-slate-500">[{log.admin_name}]</span> executed <span className="text-amber-500">{log.action}</span></div>
                    <div className="text-slate-600 mt-1">Target: {log.target_type} #{log.target_id}</div>
                  </div>
                ))}
                {!logs.length && <p className="text-sm italic text-slate-600">No logs found.</p>}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
