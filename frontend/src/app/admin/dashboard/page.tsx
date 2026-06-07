"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, XCircle, Globe, Activity, Eye, Trash2, ShieldCheck, MailPlus, TerminalSquare, BarChart3, Users, Link2, GraduationCap, FolderOpen, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { API } from "@/config/api";
import { useApi } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { user, token, isSuperAdmin, isAdmin } = useAuth();
  const { fetchWithAuth } = useApi();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'moderation' | 'analytics'>('moderation');
  const [stats, setStats] = useState<any>({ totalUsers: 0, pendingFlags: 0, activeHubs: [] });
  const [queue, setQueue] = useState({ flags: [], journals: [] });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      router.push("/");
      return;
    }
    fetchDashboardData();
    fetchAnalytics();
  }, [isAdmin, isSuperAdmin]);

  const fetchDashboardData = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const [statsRes, queueRes, logsRes] = await Promise.all([
        fetch(API.admin.moderationStats, { headers }),
        fetch(API.admin.moderationQueue, { headers }),
        fetch(API.admin.auditLogs, { headers })
      ]);
      const statsData = await statsRes.json();
      const queueData = await queueRes.json();
      const logsData = await logsRes.json();
      setStats(statsData.data || statsData);
      setQueue(queueData.data || queueData);
      setLogs(logsData.data || logsData);
    } catch (err) {
      console.error("Dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [overviewRes, collabRes] = await Promise.all([
        fetchWithAuth(API.analytics.overview),
        fetchWithAuth(API.analytics.collaboration),
      ]);
      const overview = await overviewRes.json();
      const collab = await collabRes.json();
      setAnalyticsData({
        overview: overview.data || {},
        collaboration: collab.data || {},
      });
    } catch (err) {
      console.error("Analytics fetch error", err);
    }
  };

  const resolveFlag = async (id: number, action: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(API.admin.resolveFlag(String(id)), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action, reason: "Admin Discretion" })
      });
      fetchDashboardData();
    } catch (err) {}
  };

  const updateJournalStatus = async (id: number, status: string) => {
    try {
      await fetch(API.admin.journalStatus(String(id)), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="flex bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'moderation' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck size={14} className="inline mr-1.5" />Moderation
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'analytics' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 size={14} className="inline mr-1.5" />Analytics
              </button>
            </div>
            {isSuperAdmin && (
              <Link href="/admin/invite" className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-all">
                <MailPlus size={18} /> Enter Invitation Portal
              </Link>
            )}
          </div>
        </header>
        {activeTab === 'moderation' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-fade-in">
                <div className="text-3xl font-black text-white">{stats.totalUsers || 0}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mt-1">Total Platform Users</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-fade-in">
                <div className="text-3xl font-black text-red-500">{stats.pendingFlags || 0}</div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mt-1">Pending Flags</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl animate-fade-in">
                <div className="text-sm font-bold text-white mb-3">Active Hubs</div>
                <div className="space-y-1">
                  {stats.activeHubs?.map((h: any) => (
                    <div key={h.geography} className="text-xs flex justify-between">
                      <span>{h.geography}</span>
                      <span className="font-bold text-slate-400">{h.count} users</span>
                    </div>
                  ))}
                  {(!stats.activeHubs?.length) && <p className="text-xs italic animate-pulse">Awaiting Hub Data...</p>}
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
      </>
    )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-8">
            {/* Overview KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <Users className="text-indigo-500 mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{analyticsData.overview.totalUsers || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Users</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <Link2 className="text-emerald-500 mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{analyticsData.overview.totalConnections || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Connections</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <GraduationCap className="text-violet-500 mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{analyticsData.overview.totalMentorships || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mentorships</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <FolderOpen className="text-amber-500 mb-2" size={24} />
                <p className="text-2xl font-bold text-white">{analyticsData.overview.totalProjects || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Projects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Collaboration Rates */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" /> Collaboration Success Rates
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                      <span>Milestone Completion</span>
                      <span className="text-emerald-400">{analyticsData.collaboration.milestones?.completionRate || 0}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${analyticsData.collaboration.milestones?.completionRate || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <p className="text-xl font-bold text-white">{analyticsData.collaboration.projects?.active || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Projects</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{analyticsData.collaboration.projects?.completed || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Completed</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{analyticsData.collaboration.projects?.total || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Domains */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                  <BarChart3 className="text-indigo-500" /> Top Research Domains
                </h3>
                <div className="space-y-3">
                  {analyticsData.overview.topDomains?.length > 0 ? (
                    analyticsData.overview.topDomains.map((d: any, i: number) => {
                      const max = Math.max(...analyticsData.overview.topDomains.map((x: any) => x.count));
                      const percent = Math.round((d.count / max) * 100);
                      return (
                        <div key={d.domain} className="flex items-center gap-3">
                          <span className="w-4 text-xs font-bold text-slate-500">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                              <span>{d.domain}</span>
                              <span>{d.count} users</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm italic text-slate-600">No domain data available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
