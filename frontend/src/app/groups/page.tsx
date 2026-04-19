"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Hash, Globe, Lock, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

export default function GroupsListingPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(API.groups.list);
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        console.error("Failed to fetch groups");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Research <span className="text-primary">Groups</span></h1>
            <p className="text-slate-500">Collaborate in structured micro-communities around specific disciplines.</p>
          </div>
          
          {user && (
            <Link 
              href="/groups/create" 
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:shadow-primary/25 transition-all self-start"
            >
              <Plus size={20} /> Create Group
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm max-w-md">
          <Search className="text-slate-400 ml-3" size={20} />
          <input 
            type="text" 
            placeholder="Search by focus area or name..." 
            className="w-full bg-transparent border-none outline-none text-sm py-2"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 italic text-slate-400">Loading communities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map((group, idx) => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/5 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Users size={24} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 ${group.type === 'public' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {group.type === 'public' ? <Globe size={10} /> : <Lock size={10} />} {group.type}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{group.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{group.description}</p>
                
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                  <Hash size={12} className="text-primary" /> {group.focus_area}
                </div>

                <Link 
                  href={`/groups/${group.id}`}
                  className="w-full py-3 rounded-xl border border-slate-100 dark:border-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
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
