"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Award, BookOpen, Globe, TrendingUp } from "lucide-react";

import Link from "next/link";

interface Researcher {
  id: number;
  openalex_id?: string;
  name: string;
  institution: string;
  citation_count: number;
  h_index: number;
  research_domains: string[];
  avatar_url?: string;
  country_code?: string;
}

interface ResearcherCardProps {
  researcher: Researcher;
  onClick?: (researcher: Researcher) => void;
  idx: number;
}

export const ResearcherCard: React.FC<ResearcherCardProps> = ({ researcher, onClick, idx }) => {
  const CardContent = (
    <>
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
            {researcher.avatar_url ? (
              <img src={researcher.avatar_url} alt={researcher.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <User size={20} className="text-primary/60" />
            )}
          </div>
          {researcher.h_index > 20 && (
            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full shadow-sm">
              <Award size={10} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
            {researcher.name}
          </h4>
          <p className="text-[10px] text-slate-400 truncate mb-2">
            {researcher.institution || "Independent Researcher"}
          </p>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <TrendingUp size={10} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {researcher.citation_count?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={10} className="text-blue-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                H-{researcher.h_index || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {(researcher.research_domains || []).slice(0, 2).map((domain) => (
          <span
            key={domain}
            className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-100 dark:border-slate-800"
          >
            {domain}
          </span>
        ))}
      </div>
    </>
  );

  if (onClick) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        onClick={() => onClick(researcher)}
        className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
      >
        {CardContent}
      </motion.div>
    );
  }

  const rawId = researcher.openalex_id || researcher.id;
  const cleanId = typeof rawId === 'string' && rawId.startsWith('http') ? rawId.split('/').pop() : rawId;

  return (
    <Link href={`/researchers/${cleanId}`}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
      >
        {CardContent}
      </motion.div>
    </Link>
  );
};
