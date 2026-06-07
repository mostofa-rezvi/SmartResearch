"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, XCircle, Globe, Activity, Eye, Trash2, ShieldCheck, MailPlus, TerminalSquare, BarChart3, Users, Link2, GraduationCap, FolderOpen, TrendingUp, Download, BookOpen, Award, Bookmark } from "lucide-react";
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
      const [overviewRes, collabRes, matchQualityRes, growthRes, publicationsRes, weeklyReportRes] = await Promise.all([
        fetchWithAuth(API.analytics.overview),
        fetchWithAuth(API.analytics.collaboration),
        fetchWithAuth(API.analytics.matchQuality),
        fetchWithAuth(API.analytics.growth),
        fetchWithAuth(API.analytics.publications),
        fetchWithAuth(API.analytics.weeklyReport),
      ]);
      const overview = await overviewRes.json();
      const collab = await collabRes.json();
      const matchQuality = await matchQualityRes.json();
      const growth = await growthRes.json();
      const publications = await publicationsRes.json();
      const weeklyReport = await weeklyReportRes.json();

      setAnalyticsData({
        overview: overview.data || {},
        collaboration: collab.data || {},
        matchQuality: matchQuality.data || {},
        growth: growth.data || [],
        publications: publications.data || {},
        weeklyReport: weeklyReport.data || {},
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

  const downloadWeeklyReportCsv = async () => {
    try {
      const res = await fetch(`${API.analytics.weeklyReport}?format=csv`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to export report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `researchbridge-weekly-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download CSV report", err);
      alert("Error exporting weekly analytics report.");
    }
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
        {activeTab === 'analytics' && analyticsData && (() => {
          // Calculate growth charts metrics
          const growthList = analyticsData.growth || [];
          const maxGrowth = Math.max(1, ...growthList.map((g: any) => Math.max(g.newUsers || 0, g.newConnections || 0, g.newPosts || 0)));
          
          // Calculate publications trend chart metrics
          const pubTrendList = analyticsData.publications?.weeklyTrend || [];
          const maxPubTrend = Math.max(1, ...pubTrendList.map((p: any) => p.papersSaved || 0));

          // Generate SVG Points helper
          const getGrowthPoints = (key: string) => {
            if (growthList.length === 0) return "";
            const width = 500;
            const height = 150;
            const padding = 20;
            return growthList.map((g: any, idx: number) => {
              const x = padding + (idx * (width - 2 * padding)) / Math.max(1, growthList.length - 1);
              const y = height - padding - ((g[key] || 0) / maxGrowth) * (height - 2 * padding);
              return `${x},${y}`;
            }).join(" ");
          };

          const getGrowthAreaPoints = (key: string) => {
            if (growthList.length === 0) return "";
            const width = 500;
            const height = 150;
            const padding = 20;
            const pts = getGrowthPoints(key);
            if (!pts) return "";
            return `${padding},${height - padding} ${pts} ${width - padding},${height - padding}`;
          };

          const getPubTrendPoints = () => {
            if (pubTrendList.length === 0) return "";
            const width = 500;
            const height = 120;
            const padding = 15;
            return pubTrendList.map((p: any, idx: number) => {
              const x = padding + (idx * (width - 2 * padding)) / Math.max(1, pubTrendList.length - 1);
              const y = height - padding - ((p.papersSaved || 0) / maxPubTrend) * (height - 2 * padding);
              return `${x},${y}`;
            }).join(" ");
          };

          const getPubTrendAreaPoints = () => {
            if (pubTrendList.length === 0) return "";
            const width = 500;
            const height = 120;
            const padding = 15;
            const pts = getPubTrendPoints();
            if (!pts) return "";
            return `${padding},${height - padding} ${pts} ${width - padding},${height - padding}`;
          };

          return (
            <div className="space-y-8 animate-fade-in">
              {/* Overview KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                  <Users className="text-indigo-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{analyticsData.overview.totalUsers || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Users</p>
                  <div className="text-[10px] text-slate-400 mt-2">Active last 7 days: <span className="text-white font-bold">{analyticsData.overview.activeUsersLast7Days || 0}</span></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                  <Link2 className="text-emerald-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{analyticsData.overview.totalConnections || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Connections</p>
                  <div className="text-[10px] text-slate-400 mt-2">Accepted matches</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all" />
                  <GraduationCap className="text-violet-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{analyticsData.overview.totalMentorships || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Mentorships</p>
                  <div className="text-[10px] text-slate-400 mt-2">Academic mentorships</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
                  <FolderOpen className="text-amber-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-white">{analyticsData.overview.totalProjects || 0}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Projects</p>
                  <div className="text-[10px] text-slate-400 mt-2">Shared workspaces</div>
                </div>
              </div>

              {/* Weekly Analytics Report Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="text-primary" /> Weekly Performance Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Platform activity updates for the last 7 days</p>
                  </div>
                  <button
                    onClick={downloadWeeklyReportCsv}
                    className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-500/20 transition-all text-sm self-start md:self-auto cursor-pointer"
                  >
                    <Download size={16} /> Export CSV Report
                  </button>
                </div>
                {analyticsData.weeklyReport?.weeklyHighlights ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-white">+{analyticsData.weeklyReport.weeklyHighlights.newUsers}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">New Users</div>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-emerald-500">+{analyticsData.weeklyReport.weeklyHighlights.newConnections}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">New Connections</div>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-indigo-400">+{analyticsData.weeklyReport.weeklyHighlights.newCommunityPosts}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">New Posts</div>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-violet-400">+{analyticsData.weeklyReport.weeklyHighlights.newMentorships}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">New Mentorships</div>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-amber-500">+{analyticsData.weeklyReport.weeklyHighlights.papersSaved}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">Papers Saved</div>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/40 text-center">
                      <div className="text-xl font-bold text-sky-400">+{analyticsData.weeklyReport.weeklyHighlights.readingEvents}</div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold mt-1">Reads ({analyticsData.weeklyReport.weeklyHighlights.activeReaders} active)</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-600">No report highlights available.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Trend Multi-Series SVG Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="text-indigo-500" /> Platform Growth Trends
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full uppercase font-mono">8-Week Active Metrics</span>
                  </h3>
                  {growthList.length > 0 ? (
                    <div>
                      <div className="relative h-44 w-full">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                          {/* Grid Lines */}
                          <line x1="20" y1="20" x2="480" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                          <line x1="20" y1="75" x2="480" y2="75" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                          <line x1="20" y1="130" x2="480" y2="130" stroke="#1e293b" strokeWidth="1" />
                          
                          {/* Gradients definitions */}
                          <defs>
                            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                            </linearGradient>
                            <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                            </linearGradient>
                            <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>

                          {/* Gradient Areas */}
                          {getGrowthAreaPoints("newUsers") && <polygon points={getGrowthAreaPoints("newUsers")} fill="url(#userGrad)" />}
                          {getGrowthAreaPoints("newConnections") && <polygon points={getGrowthAreaPoints("newConnections")} fill="url(#connGrad)" />}
                          {getGrowthAreaPoints("newPosts") && <polygon points={getGrowthAreaPoints("newPosts")} fill="url(#postGrad)" />}

                          {/* Lines */}
                          {getGrowthPoints("newUsers") && <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={getGrowthPoints("newUsers")} strokeLinecap="round" />}
                          {getGrowthPoints("newConnections") && <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={getGrowthPoints("newConnections")} strokeLinecap="round" />}
                          {getGrowthPoints("newPosts") && <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" points={getGrowthPoints("newPosts")} strokeLinecap="round" />}

                          {/* Data points */}
                          {growthList.map((g: any, idx: number) => {
                            const x = 20 + (idx * (500 - 40)) / Math.max(1, growthList.length - 1);
                            const yUser = 150 - 20 - ((g.newUsers || 0) / maxGrowth) * (150 - 40);
                            const yConn = 150 - 20 - ((g.newConnections || 0) / maxGrowth) * (150 - 40);
                            const yPost = 150 - 20 - ((g.newPosts || 0) / maxGrowth) * (150 - 40);
                            return (
                              <g key={idx}>
                                <circle cx={x} cy={yUser} r="3.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
                                <circle cx={x} cy={yConn} r="3.5" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                                <circle cx={x} cy={yPost} r="3.5" fill="#8b5cf6" stroke="#0f172a" strokeWidth="1.5" />
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      {/* X-axis labels */}
                      <div className="flex justify-between px-2 text-[10px] text-slate-500 font-bold mt-2">
                        {growthList.map((g: any, idx: number) => <span key={idx}>{g.week}</span>)}
                      </div>
                      {/* Chart Legend */}
                      <div className="flex items-center justify-center gap-6 mt-6 border-t border-slate-800/40 pt-4 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-indigo-500" />
                          <span className="text-slate-400">New Users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-slate-400">Connections Accepted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-violet-500" />
                          <span className="text-slate-400">Community Posts</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-600">Growth analytics data currently loading...</p>
                  )}
                </div>

                {/* Match Quality & Recommendation Engagement */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                    <Award className="text-emerald-500" /> Recommendation Match Quality
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Circle Gauge - Engagement Rate */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center border-r border-slate-800/50 pr-4">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-emerald-500" strokeDasharray={`${analyticsData.matchQuality.engagementRate || 0}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-white">{analyticsData.matchQuality.engagementRate || 0}%</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3 text-center">Engagement Rate</span>
                      <span className="text-[10px] text-slate-600 mt-1 text-center">Bookmarks/downloads from views</span>
                    </div>

                    {/* Action distribution and Score buckets histogram */}
                    <div className="md:col-span-3 space-y-4">
                      {/* Action Breakdown */}
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Reading Actions Distribution</div>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex text-[9px] font-bold text-white text-center">
                          {analyticsData.matchQuality.actionDistribution?.map((a: any, idx: number) => {
                            const total = analyticsData.matchQuality.actionDistribution.reduce((acc: number, x: any) => acc + parseInt(x.count), 0);
                            const width = total > 0 ? (parseInt(a.count) / total) * 100 : 0;
                            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'];
                            return (
                              <div
                                key={a.action}
                                className={`${colors[idx % colors.length]} flex items-center justify-center transition-all`}
                                style={{ width: `${width}%` }}
                                title={`${a.action}: ${a.count}`}
                              >
                                {width > 12 && a.action}
                              </div>
                            );
                          })}
                          {(!analyticsData.matchQuality.actionDistribution?.length) && (
                            <div className="w-full bg-slate-800 text-slate-600 flex items-center justify-center">No action history logs</div>
                          )}
                        </div>
                      </div>

                      {/* Score Distribution Histogram */}
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Quality Score Distribution</div>
                        <div className="grid grid-cols-6 gap-2 items-end h-20 pt-2">
                          {analyticsData.matchQuality.histogram?.map((h: any) => {
                            const maxVal = Math.max(1, ...analyticsData.matchQuality.histogram.map((x: any) => x.count));
                            const heightPct = (h.count / maxVal) * 100;
                            return (
                              <div key={h.score_bucket} className="flex flex-col items-center group cursor-help">
                                <div className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{h.count}</div>
                                <div className="w-full bg-slate-800 rounded-t-sm relative overflow-hidden h-12 flex items-end">
                                  <div
                                    className="w-full bg-emerald-500/80 rounded-t-sm group-hover:bg-emerald-400 transition-all"
                                    style={{ height: `${heightPct}%` }}
                                  />
                                </div>
                                <div className="text-[8px] font-bold text-slate-500 mt-1.5 font-mono">{h.score_bucket}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Collaboration Success Rates */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" /> Collaboration Workspace Metrics
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-bold text-slate-400 mb-2">
                        <span>Milestone Completion Rate</span>
                        <span className="text-emerald-400">{analyticsData.collaboration.milestones?.completionRate || 0}%</span>
                      </div>
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${analyticsData.collaboration.milestones?.completionRate || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestone State segmented list */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-sm font-bold text-emerald-400">{analyticsData.collaboration.milestones?.completed || 0}</div>
                        <div className="text-[9px] font-bold uppercase text-slate-500 mt-0.5">Done</div>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-sm font-bold text-indigo-400">{analyticsData.collaboration.milestones?.inReview || 0}</div>
                        <div className="text-[9px] font-bold uppercase text-slate-500 mt-0.5">Review</div>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-sm font-bold text-amber-500">{analyticsData.collaboration.milestones?.inProgress || 0}</div>
                        <div className="text-[9px] font-bold uppercase text-slate-500 mt-0.5">In Progress</div>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-sm font-bold text-slate-400">{analyticsData.collaboration.milestones?.todo || 0}</div>
                        <div className="text-[9px] font-bold uppercase text-slate-500 mt-0.5">Todo</div>
                      </div>
                    </div>

                    {/* Project stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/40">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Collaboration Size</div>
                        <div className="text-lg font-bold text-white flex items-baseline gap-2">
                          <span>{analyticsData.collaboration.members?.avgPerProject || 0}</span>
                          <span className="text-xs text-slate-500 font-normal">avg users / project</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Peak Collaborators</div>
                        <div className="text-lg font-bold text-white flex items-baseline gap-2">
                          <span>{analyticsData.collaboration.members?.maxInProject || 0}</span>
                          <span className="text-xs text-slate-500 font-normal">max in single project</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Active Projects */}
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Most Active Workspace Projects</div>
                      <div className="space-y-2">
                        {analyticsData.collaboration.topProjects?.map((p: any) => (
                          <div key={p.name} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/50 p-3 rounded-xl">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{p.name}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5">Created: {new Date(p.created_at).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>{p.status}</span>
                              <span className="text-xs font-bold text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-800">{p.member_count} members</span>
                            </div>
                          </div>
                        ))}
                        {(!analyticsData.collaboration.topProjects?.length) && (
                          <p className="text-xs italic text-slate-600">No active projects reported.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Publication Assistant Outcomes */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                    <BookOpen className="text-indigo-500" /> Publication Assistant Outcomes
                  </h3>
                  <div className="space-y-6">
                    {/* Core counts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                        <Bookmark className="text-amber-500" size={28} />
                        <div>
                          <div className="text-xl font-bold text-white">{analyticsData.publications?.savedPapers?.total || 0}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Saved Papers</div>
                        </div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                        <Users className="text-indigo-500" size={28} />
                        <div>
                          <div className="text-xl font-bold text-white">{analyticsData.publications?.savedPapers?.uniqueResearchers || 0}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Unique Researchers</div>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Saved Papers Area Chart */}
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Saved Papers Weekly Trend</div>
                      {pubTrendList.length > 0 ? (
                        <div>
                          <div className="relative h-28 w-full">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                              <line x1="15" y1="15" x2="485" y2="15" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="15" y1="105" x2="485" y2="105" stroke="#1e293b" strokeWidth="1" />
                              
                              <defs>
                                <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2"/>
                                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"/>
                                </linearGradient>
                              </defs>

                              <polygon points={getPubTrendAreaPoints()} fill="url(#savedGrad)" />
                              <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={getPubTrendPoints()} strokeLinecap="round" />

                              {pubTrendList.map((p: any, idx: number) => {
                                const x = 15 + (idx * (500 - 30)) / Math.max(1, pubTrendList.length - 1);
                                const y = 120 - 15 - ((p.papersSaved || 0) / maxPubTrend) * (120 - 30);
                                return <circle key={idx} cx={x} cy={y} r="3.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />;
                              })}
                            </svg>
                          </div>
                          <div className="flex justify-between px-1 text-[9px] text-slate-500 font-bold mt-1.5">
                            {pubTrendList.map((p: any, idx: number) => <span key={idx}>{p.week}</span>)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-600">Saved papers activity trend is currently loading...</p>
                      )}
                    </div>

                    {/* Top Journals List */}
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">Top Target Journals</div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {analyticsData.publications?.topJournals?.map((j: any) => {
                          const maxCount = Math.max(1, ...analyticsData.publications.topJournals.map((x: any) => x.count));
                          const barPct = (j.count / maxCount) * 100;
                          return (
                            <div key={j.journal_name} className="flex flex-col bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span className="text-slate-300 truncate max-w-[80%]">{j.journal_name}</span>
                                <span className="text-amber-500">{j.count} papers</span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full transition-all"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {(!analyticsData.publications?.topJournals?.length) && (
                          <p className="text-xs italic text-slate-600">No journal publication targets tracked yet.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </main>
    </div>
  );
}
