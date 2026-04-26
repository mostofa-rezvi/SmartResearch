"use client";

import React, { useState } from "react";
import { Bold, Italic, Heading1, Heading2, List } from "lucide-react";

export function CollaborativeEditor() {
  // Mock Editor State
  const [content, setContent] = useState("Start writing your methodology here...");

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[700px] overflow-hidden">
      
      {/* Editor Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
          <Bold size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
          <Italic size={18} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
        <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
          <Heading1 size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
          <Heading2 size={18} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
        <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
          <List size={18} />
        </button>

        <div className="flex-1" />
        <span className="text-xs font-medium text-slate-400">Saved to cloud</span>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 p-8 overflow-y-auto relative cursor-text">
        {/* Note: This is a placeholder for the actual Tiptap/Yjs instance */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full resize-none outline-none bg-transparent text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 font-serif"
          placeholder="Start typing..."
        />
        
        {/* Integration Note: Yjs provider logic will attach here in the backend phase */}
      </div>

    </div>
  );
}
