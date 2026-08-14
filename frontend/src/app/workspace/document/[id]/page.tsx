"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { CollaborativeEditor } from "@/components/collaborative-editor";
import { NotificationsPanel } from "@/components/notifications-panel";
import { ArrowLeft, History, Users, Save } from "lucide-react";
import Link from "next/link";
import VersionHistorySidebar from "@/components/workspace/VersionHistorySidebar";
import SaveVersionDialog from "@/components/workspace/SaveVersionDialog";

export default function DocumentWorkspacePage() {
  const { id } = useParams();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [historyKey, setHistoryKey] = useState(0); // bump to force the sidebar to refetch

  // Remember this team as the active one so returning to /workspace (via the
  // back button or the sidebar) reopens THIS team, not the newest.
  React.useEffect(() => {
    if (id && typeof window !== "undefined") localStorage.setItem("rb:lastProjectId", String(id));
  }, [id]);

  return (
    <div className="min-h-screen app-bg flex flex-col">
      <Navbar />
      
      <div className="fixed top-0 right-0 z-50 p-4 mr-20 flex items-center gap-4">
        <NotificationsPanel />
      </div>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-[1000px] w-full mx-auto flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/workspace?project=${id}`}
              className="text-slate-400 hover:text-primary transition-colors"
              title="Back to workspace"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Research Methodology - Draft</h1>
            <span className="text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">ID: {id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSave(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save size={14} /> Save
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 neu-btn text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              <History size={14} /> Version History
            </button>

            {/* Live presence is rendered inside the editor toolbar (real awareness). */}
            <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Users size={14} /> Live collaboration
            </span>
          </div>
        </div>

        <div className="relative flex-1">
          <CollaborativeEditor documentId={id as string} />
        </div>

        {showSave && (
          <SaveVersionDialog
            projectId={id as string}
            onClose={() => setShowSave(false)}
            onSaved={() => {
              setHistoryKey((k) => k + 1);
              setIsHistoryOpen(true); // reveal history with the new snapshot
            }}
          />
        )}

        <VersionHistorySidebar
          key={historyKey}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          projectId={id as string}
        />
      </main>
    </div>
  );
}
