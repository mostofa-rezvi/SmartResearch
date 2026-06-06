"use client";

import React, { useState } from "react";
import { MoreHorizontal, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { useProjectMilestones, Milestone } from "@/hooks/useProjectMilestones";
import { motion, AnimatePresence } from "framer-motion";

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse space-y-3 shadow-sm">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/2"></div>
    <div className="flex justify-between items-center pt-2">
      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700"></div>
      <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-12"></div>
    </div>
  </div>
);

export function KanbanBoard({ projectId = "1" }: { projectId?: string }) {
  const { milestones, isLoading, error, mutateMilestoneStatus, createMilestone } = useProjectMilestones(projectId);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info",
  });
  
  const [isAddingMilestone, setIsAddingMilestone] = useState<string | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDrop = async (e: React.DragEvent, newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE") => {
    e.preventDefault();
    const milestoneId = Number(e.dataTransfer.getData("text/plain"));
    if (!milestoneId) return;

    try {
      await mutateMilestoneStatus(milestoneId, newStatus);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || "FSM Transition Rejected",
        type: "error",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
    }
  };

  const handleCreateMilestone = async (status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE") => {
    if (!newMilestoneTitle.trim()) return;

    try {
      await createMilestone(newMilestoneTitle, `Created in column ${status}`);
      setNewMilestoneTitle("");
      setIsAddingMilestone(null);
      setToast({
        show: true,
        message: "Milestone created successfully",
        type: "success",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
    } catch (err: any) {
      setToast({
        show: true,
        message: err.message || "Failed to create milestone",
        type: "error",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
    }
  };

  const columns = [
    { id: "TODO" as const, title: "To Do", tasks: milestones?.filter((m) => m.status === "TODO") || [] },
    { id: "IN_PROGRESS" as const, title: "In Progress", tasks: milestones?.filter((m) => m.status === "IN_PROGRESS") || [] },
    { id: "REVIEW" as const, title: "Review", tasks: milestones?.filter((m) => m.status === "REVIEW") || [] },
    { id: "DONE" as const, title: "Done", tasks: milestones?.filter((m) => m.status === "DONE") || [] },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 bg-slate-900 dark:bg-slate-950 text-white px-8 py-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-xl"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                toast.type === "error" ? "bg-red-500" : "bg-primary"
              }`}
            >
              {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            </div>
            <span className="font-bold tracking-tight text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
            className="w-80 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800 flex flex-col h-[600px] transition-all"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {col.title}{" "}
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                  {isLoading ? "..." : col.tasks.length}
                </span>
              </h3>
              <button className="text-slate-400 hover:text-primary">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-2">
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 2 }).map((_, idx) => <SkeletonCard key={idx} />)
              ) : col.tasks.length === 0 ? (
                // Empty state inside column
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl h-24 flex items-center justify-center text-xs text-slate-400 italic">
                  Drag milestones here
                </div>
              ) : (
                col.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all hover:shadow-md"
                  >
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-primary">
                          {getInitials(task.description || "User")}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isAddingMilestone === col.id ? (
              <div className="mt-4 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <input
                  type="text"
                  placeholder="Enter milestone title..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateMilestone(col.id);
                    if (e.key === "Escape") setIsAddingMilestone(null);
                  }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsAddingMilestone(null)}
                    className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateMilestone(col.id)}
                    className="px-2 py-1 text-[10px] bg-primary text-white font-bold rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAddingMilestone(col.id);
                  setNewMilestoneTitle("");
                }}
                className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-850 py-3 rounded-xl transition-all"
              >
                <Plus size={16} /> Add Task
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
