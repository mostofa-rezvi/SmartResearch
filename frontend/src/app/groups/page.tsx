"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Hash, Globe, Lock, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppPageHeader from "@/components/app/AppPageHeader";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

export default function GroupsListingPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(API.groups.list);
        const result = await response.json();
        const groupsData = result.data || result;
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (err) {
        console.error("Failed to fetch groups");
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.focus_area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen app-bg">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <AppPageHeader
          eyebrow="Collaborative Lab Mesh"
          title="Research"
          accent="Groups"
          subtitle="Collaborate in structured micro-communities around specific disciplines."
          actions={
            user && (
              <Link
                href="/groups/create"
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl hover:shadow-primary/20"
              >
                <Plus size={20} /> Create Group
              </Link>
            )
          }
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 neu-inset px-4 py-2.5 w-full sm:max-w-md">
            <Search className="text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by focus area or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          {!loading && (
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">
              {filteredGroups.length} {filteredGroups.length === 1 ? "group" : "groups"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-neu-card p-6">
                <div className="skeleton w-12 h-12 rounded-2xl mb-4" />
                <div className="skeleton h-5 w-3/4 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-2/3 rounded mb-6" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-24 glass-neu-card">
            <div className="w-16 h-16 neu-icon flex items-center justify-center text-primary dark:text-white mx-auto mb-5">
              <Users size={28} />
            </div>
            <h3 className="text-xl font-serif font-black text-slate-900 dark:text-white mb-2">No groups found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term, or " : "Be the first to "}
              start a research group for your discipline.
            </p>
            {user && (
              <Link href="/groups/create" className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-secondary transition-all shadow-lg">
                <Plus size={18} /> Create Group
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGroups.map((group, idx) => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-neu-card glass-neu-hover p-6 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 neu-icon flex items-center justify-center text-primary dark:text-white">
                    <Users size={24} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 ${group.type === 'public' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300'}`}>
                    {group.type === 'public' ? <Globe size={10} /> : <Lock size={10} />} {group.type}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{group.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{group.description}</p>
                
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                  <Hash size={12} className="text-primary dark:text-white" /> {group.focus_area}
                </div>

                <Link
                  href={`/groups/${group.id}`}
                  className="w-full py-3 neu-btn font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  Enter Group <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
