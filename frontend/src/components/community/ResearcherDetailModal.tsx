"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Award, BookOpen, Globe, TrendingUp, MapPin, Layers, ChevronRight, FileText } from "lucide-react";
import { API } from "@/config/api";

interface Researcher {
  id: number;
  name: string;
  institution: string;
  citation_count: number;
  h_index: number;
  research_domains: string[];
  avatar_url?: string;
  country_code?: string;
  orcid?: string;
  works_count?: number;
  profile_url?: string;
}

interface Work {
  id: string;
  title: string;
  publication_year: number;
  type: string;
  doi: string;
  citation_count: number;
  journal: string;
  landing_page_url: string;
}

interface ResearcherDetailModalProps {
  researcher: Researcher | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResearcherDetailModal: React.FC<ResearcherDetailModalProps> = ({
  researcher,
  isOpen,
  onClose,
}) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loadingWorks, setLoadingWorks] = useState(false);

  useEffect(() => {
    if (isOpen && researcher) {
      fetchWorks();
    } else {
      setWorks([]);
    }
  }, [isOpen, researcher]);

  const fetchWorks = async () => {
    if (!researcher) return;
    try {
      setLoadingWorks(true);
      const res = await fetch(API.researchers.works(String(researcher.id)));
      const data = await res.json();
      if (data.success) {
        setWorks(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch works", err);
    } finally {
      setLoadingWorks(false);
    }
  };

  if (!researcher) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-primary to-blue-600 shrink-0" />
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
              <div className="relative -mt-16 mb-8 flex items-end gap-6">
                <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[2rem] p-1.5 shadow-xl">
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-[1.7rem] flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                    {researcher.avatar_url ? (
                      <img src={researcher.avatar_url} alt={researcher.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-primary/40" />
                    )}
                  </div>
                </div>
                
                <div className="pb-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {researcher.name}
                  </h2>
                  <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <MapPin size={16} className="text-primary" />
                    {researcher.institution || "Global Researcher"}
                    {researcher.country_code && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase">
                        {researcher.country_code}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> Professional Biography
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif italic">
                  A distinguished researcher with a focus on {researcher.research_domains.slice(0, 3).join(", ")}. 
                  Contributing significantly to the global research community with over {researcher.works_count} published works 
                  and a remarkable citation impact of {researcher.citation_count?.toLocaleString()} citations.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Citations", value: researcher.citation_count?.toLocaleString(), icon: <TrendingUp className="text-emerald-500" /> },
                  { label: "H-Index", value: researcher.h_index || "N/A", icon: <Award className="text-amber-500" /> },
                  { label: "Works", value: researcher.works_count || "N/A", icon: <BookOpen className="text-blue-500" /> },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      {stat.icon}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-primary" /> Expertise & Domains
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(researcher.research_domains || []).map((domain) => (
                      <span
                        key={domain}
                        className="px-4 py-2 bg-primary/5 dark:bg-primary/10 text-primary rounded-xl text-sm font-bold border border-primary/10"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Research Items Preview */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen size={14} className="text-primary" /> Key Research Items
                    </span>
                    <span className="text-[10px] font-medium lowercase italic text-slate-300">Click item to view source</span>
                  </h3>
                  
                  {loadingWorks ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : works.length > 0 ? (
                    <div className="space-y-3">
                      {works.map((work) => (
                        <a
                          key={work.id}
                          href={work.landing_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
                        >
                          <div className="min-w-0 pr-4">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                              {work.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {work.journal} · {work.publication_year}
                              </span>
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                {work.citation_count} citations
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-400">No research items listed for this scholar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
