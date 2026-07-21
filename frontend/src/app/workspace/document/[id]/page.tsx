"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CollaborativeEditor } from "@/components/collaborative-editor";
import { NotificationsPanel } from "@/components/notifications-panel";
import { ArrowLeft, History, Users } from "lucide-react";
import Link from "next/link";
import VersionHistorySidebar from "@/components/workspace/VersionHistorySidebar";

export default function DocumentWorkspacePage() {
  const { id } = useParams();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-slate-800"
            >
              <History size={14} /> Version History
            </button>

            {/* Live presence is rendered inside the editor toolbar (real awareness). */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users size={14} /> Live collaboration
            </span>
          </div>
        </div>

        <div className="relative flex-1">
          <CollaborativeEditor documentId={id as string} />
        </div>

        <VersionHistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          projectId={id as string}
        />
      </main>
    </div>
  );
}
