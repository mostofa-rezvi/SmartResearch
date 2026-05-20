"use client";

import React from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CollaborativeEditor } from "@/components/collaborative-editor";
import { LiveCursors } from "@/components/live-cursors";
import { NotificationsPanel } from "@/components/notifications-panel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DocumentWorkspacePage() {
  const { id } = useParams();

  const mockUsers = [
    { color: "#EC4899", initials: "DS" },
    { color: "#8B5CF6", initials: "ER" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col">
      <Navbar />
      
      <div className="fixed top-0 right-0 z-50 p-4 mr-20 flex items-center gap-4">
        <NotificationsPanel />
      </div>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-[1000px] w-full mx-auto flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workspace" className="text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Research Methodology - Draft</h1>
            <span className="text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">ID: {id}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {mockUsers.map((u, i) => (
                <div 
                  key={i} 
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-transparent"
                  style={{ backgroundColor: u.color }}
                >
                  {u.initials}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">2 active</span>
          </div>
        </div>

        <div className="relative flex-1">
          <CollaborativeEditor />
          <LiveCursors />
        </div>
      </main>
    </div>
  );
}
