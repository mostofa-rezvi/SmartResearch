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
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-md">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1"><Building size={14} /> {institution}</p>
          </div>
        </div>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
          {similarityScore}% Match
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
        <div className="flex items-center gap-1">
          <BookOpen size={16} /> {publications} Publications
        </div>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          // connect logic if any
        }}
        className="w-full py-3 bg-slate-50 dark:bg-slate-900 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
      >
        <UserPlus size={18} className="group-hover/btn:scale-110 transition-transform" />
        Connect
      </button>
    </div>
  );
}
