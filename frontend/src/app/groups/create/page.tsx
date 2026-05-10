"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Globe, Lock, ArrowLeft, Info, Hash } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

export default function CreateGroupPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [type, setType] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const { token, logout } = useAuth();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API.groups.create, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, focus_area: focusArea, type }),
      });

      if (response.ok) {
        const result = await response.json();
        const group = result.data || result;
        router.push(`/groups/${group.id}`);
      } else if (response.status === 401) {
        // Token is invalid or expired
        alert("Your session has expired. Please log in again.");
        logout();
      } else {
        console.error("Failed to create group", await response.text());
      }
    } catch (err) {
      console.error("Failed to create group", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <Link href="/groups" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Groups
        </Link>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="bg-primary p-8 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users /> Create New Community
            </h1>
            <p className="text-primary-foreground/80 mt-2">
              Found a research circle for your specific field or project.
            </p>
          </div>

          <form onSubmit={handleCreate} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Info size={16} /> Group Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Neural Networks Discovery"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Hash size={16} /> Focus Area / Discipline
                </label>
                <input
                  type="text"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="What is this circle about?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Privacy Setting</label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setType('public')}
                    className={`p-4 rounded-2xl border flex flex-col gap-2 text-left transition-all ${
                      type === 'public' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-transparent border-slate-200'
                    }`}
                  >
                    <Globe size={20} className={type === 'public' ? 'text-primary' : 'text-slate-400'} />
                    <span className="font-bold text-sm">Public</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tight">Open to all researchers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('private')}
                    className={`p-4 rounded-2xl border flex flex-col gap-2 text-left transition-all ${
                      type === 'private' ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-transparent border-slate-200'
                    }`}
                  >
                    <Lock size={20} className={type === 'private' ? 'text-primary' : 'text-slate-400'} />
                    <span className="font-bold text-sm">Private</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-tight">Requires invitation</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-secondary transition-all shadow-xl hover:shadow-primary/25"
            >
              {isLoading ? "Creating Circle..." : "Launch Group"}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
