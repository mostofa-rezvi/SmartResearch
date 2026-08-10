import React from "react";
import { UserPlus, Building, BookOpen } from "lucide-react";

interface CollaboratorCardProps {
  id?: string;
  name: string;
  institution: string;
  similarityScore: number;
  publications: number;
  onClick?: () => void;
}

export function CollaboratorCard({ id, name, institution, similarityScore, publications, onClick }: CollaboratorCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      className="focus-ring card card-interactive dark:bg-slate-800 dark:border-slate-700 rounded-3xl p-6 group cursor-pointer"
    >
      <div className="flex justify-between items-start gap-3 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-xl elev-2 shrink-0">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="text-h4 text-ink-900 dark:text-white truncate group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-caption text-ink-500 flex items-center gap-1.5 truncate"><Building size={13} className="shrink-0" /> {institution}</p>
          </div>
        </div>
        <span className="badge badge-accent shrink-0">
          {similarityScore}% match
        </span>
      </div>

      <div className="flex items-center gap-4 text-caption text-ink-600 dark:text-slate-400 mb-6">
        <div className="flex items-center gap-1.5">
          <BookOpen size={15} /> {publications} publications
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          // connect logic if any
        }}
        className="focus-ring w-full py-3 bg-ink-50 dark:bg-slate-900 hover:bg-primary hover:text-white text-ink-700 dark:text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group/btn"
      >
        <UserPlus size={18} className="group-hover/btn:scale-110 transition-transform" />
        Connect
      </button>
    </div>
  );
}
