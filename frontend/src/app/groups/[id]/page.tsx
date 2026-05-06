"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { motion } from "framer-motion";
import { Users, Globe, Lock, MessageSquare, Plus, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mock fetch for now as I haven't implemented single group GET yet
    const fetchGroup = async () => {
      try {
        const response = await fetch(API.groups.list);
        const data = await response.json();
        const found = data.find((g: any) => g.id.toString() === id);
        setGroup(found);
      } catch (err) {
        console.error("Failed to fetch group");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleJoin = async () => {
    if (!user) return router.push("/login");
    setJoining(true);
    try {
       await fetch(API.groups.join(String(id)), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // Refresh or state update
      window.location.reload();
    } catch (err) {
      console.error("Join failed");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div>Loading circle...</div>;
  if (!group) return <div className="pt-20 text-center">Group not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Link href="/groups" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-2 text-sm font-medium">
            <ArrowLeft size={16} /> All Groups
          </Link>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Users size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">{group.name}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">
              {group.type === 'public' ? <Globe size={12} /> : <Lock size={12} />} {group.type} Circle • {group.focus_area}
            </div>
            <p className="text-sm text-slate-500 mb-6">{group.description}</p>
            
            <button 
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-primary/25 transition-all"
            >
              {joining ? "Processing..." : "Join Community"}
            </button>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <Plus className="text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="What's on your research mind?" 
              className="bg-transparent border-none outline-none w-full text-slate-600 italic"
            />
            <button className="bg-primary/10 text-primary p-2 rounded-xl">
              <Send size={20} />
            </button>
          </div>

          {/* Sample Posts */}
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Researcher #{i}04</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aesthetic Specialist • 2h ago</p>
                </div>
              </div>
              <p className="text-slate-600">Has anyone looked into the latest benchmarks for the {group.focus_area} models released this morning? The latency-accuracy trade-off seems suspicious in the paper's Appendix B.</p>
              <div className="pt-4 border-t border-slate-50 flex items-center gap-6">
                <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-bold">
                  <MessageSquare size={16} /> 12 Thoughts
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
