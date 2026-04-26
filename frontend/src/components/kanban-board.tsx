"use client";

import React, { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

export function KanbanBoard() {
  const [columns] = useState([
    { id: "todo", title: "To Do", tasks: ["Draft literature review", "Analyze dataset A"] },
    { id: "in-progress", title: "In Progress", tasks: ["Write methodology section"] },
    { id: "review", title: "Review", tasks: ["Check citations"] },
    { id: "done", title: "Done", tasks: ["Abstract completion"] },
  ]);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id} className="w-80 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {col.title} <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">{col.tasks.length}</span>
            </h3>
            <button className="text-slate-400 hover:text-primary"><MoreHorizontal size={18} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 px-2">
            {col.tasks.map((task, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{task}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-primary">A</div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">Aug 12</span>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 py-3 rounded-xl transition-all">
            <Plus size={16} /> Add Task
          </button>
        </div>
      ))}
    </div>
  );
}
