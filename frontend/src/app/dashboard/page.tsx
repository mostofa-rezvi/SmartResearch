"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Users,
  BookOpen,
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  Bell,
  MessageSquare,
  ArrowRight,
  Plus
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-primary/20 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>;
  }

  const stats = [
    { label: "Community Posts", value: "24", icon: <MessageSquare size={20} />, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Papers Read", value: "12", icon: <BookOpen size={20} />, iconColor: "text-purple-500", bg: "bg-purple-50" },
    { label: "Connections", value: "85", icon: <Users size={20} />, iconColor: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Impact Score", value: "480", icon: <TrendingUp size={20} />, iconColor: "text-accent", bg: "bg-accent/10" },
  ];

  const recentActivity = [
    { type: "search", title: "New match for 'Neural Networks'", time: "2 hours ago" },
    { type: "post", title: "Discussion started in Quantum Biology", time: "5 hours ago" },
    { type: "save", title: "You saved 'Ethics of AI in Medicine'", time: "Yesterday" },
  ];

  const recommendations = [
    { title: "Advanced Calculus for Research", journal: "Nature Math", category: "Mathematics" },
    { title: "The Neural Link: Fact vs Fiction", journal: "Tech Quarterly", category: "Neuroscience" },
    { title: "Sustainable Energy in 2027", journal: "Green Research", category: "Engineering" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary mb-2 block uppercase">Project ResearchBridge</span>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-primary dark:text-white">
              My Research <span className="text-secondary italic">Lab</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Continuing the journey from curiosity to contribution.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all shadow-sm">
              <Bell size={22} />
            </button>
            <Link href="/discovery" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl hover:shadow-primary/20">
              <Plus size={20} /> New Search
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Discover Search */}
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Smart Discovery</h3>
                <p className="text-primary-foreground/80 mb-6 max-w-md">Find cutting-edge research papers matched to your profile using our AI engine.</p>
                <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <input
                    type="text"
                    placeholder="Search by topic, DOI or author..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/50 px-4"
                  />
                  <button className="bg-white text-primary p-3 rounded-xl hover:scale-95 transition-transform">
                    <Search size={20} />
                  </button>
                </div>
              </div>
              <Sparkles className="absolute -bottom-4 -right-4 text-white/10 w-48 h-48 -rotate-12" />
            </div>

            {/* Core Modules Grid */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 font-display">Core Research Pillars</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/community" className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl hover:border-primary transition-all group">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl mb-4 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"><MessageSquare size={20} /></div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Community</h4>
                  <p className="text-xs text-slate-500">Engage in global discussions.</p>
                </Link>
                <Link href="/groups" className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl hover:border-emerald-500 transition-all group">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl mb-4 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all"><Users size={20} /></div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Groups</h4>
                  <p className="text-xs text-slate-500">Collaborate in smaller circles.</p>
                </Link>
                <Link href="/library" className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl hover:border-amber-500 transition-all group">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl mb-4 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all"><BookOpen size={20} /></div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Library</h4>
                  <p className="text-xs text-slate-500">Access curated research papers.</p>
                </Link>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-black text-primary dark:text-white">Tailored Suggestions</h3>
                <Link href="/discovery" className="text-secondary text-sm font-black flex items-center gap-1 hover:underline uppercase tracking-wider">
                  Deep Discovery <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-secondary text-white text-[8px] font-black px-2 py-1 rounded" title="Because you tagged 'Machine Learning' in Onboarding">? WHY THIS</div>
                    </div>
                    <div className="text-[10px] font-black text-secondary mb-3 uppercase tracking-[0.1em]">{rec.category}</div>
                    <h4 className="font-serif font-black text-slate-900 dark:text-white mb-4 line-clamp-3 leading-snug group-hover:text-secondary transition-colors">{rec.title}</h4>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-auto flex items-center gap-2">
                      <FileText size={12} /> {rec.journal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 mx-auto mb-4 border-4 border-white dark:border-slate-700 flex items-center justify-center text-primary text-3xl font-black shadow-inner">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{user?.name || 'Researcher'}</h3>
              <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-medium mt-1">{(user?.role && typeof user.role === 'string') ? user.role.replace('_', ' ') : 'Research Member'}</p>
              <div className="flex justify-center gap-2 mb-6">
                {user?.onboarding_completed && (
                  <span className="text-[10px] font-bold bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">VERIFIED RESEARCHER</span>
                )}
              </div>
              <button className="w-full py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <Settings size={18} /> Edit Profile
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 text-primary text-sm font-bold hover:underline">View History →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);
