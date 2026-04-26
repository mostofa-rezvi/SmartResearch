"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { KanbanBoard } from "@/components/kanban-board";
import { TimelineView } from "@/components/timeline-view";
import { NotificationsPanel } from "@/components/notifications-panel";

export default function WorkspaceDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col">
      <Navbar />
      
      {/* Workspace Header Additions */}
      <div className="fixed top-0 right-0 z-50 p-4 mr-20 flex items-center gap-4">
        {/* Assume Navbar handles main routing, we overlay workspace tools */}
        <NotificationsPanel />
      </div>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-[1400px] w-full mx-auto flex flex-col">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              Active Project
            </span>
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-2">Quantum ML Integrations</h1>
          <p className="text-slate-500 font-medium">Collaborative workspace and task tracking</p>
        </header>

        <TimelineView />
        
        <div className="flex-1">
          <KanbanBoard />
        </div>
      </main>
    </div>
  );
}
