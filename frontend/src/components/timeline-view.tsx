import React from "react";
import { Flag } from "lucide-react";

export function TimelineView() {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm mb-8 overflow-hidden relative">
      <h3 className="font-bold text-slate-900 dark:text-white mb-6">Milestone Timeline</h3>
      
      <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full w-full">
        <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-[40%]" />
        
        {/* Markers */}
        <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-800 shadow-sm" />
        <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white dark:border-slate-800 shadow-sm">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-3 py-1 rounded-md flex items-center gap-1 whitespace-nowrap">
            <Flag size={10} /> Data Collection
          </div>
        </div>
        <div className="absolute top-1/2 left-[80%] -translate-y-1/2 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800" />
      </div>
    </div>
  );
}
