"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, Award, BookOpen, Globe, TrendingUp, MapPin, 
  Layers, ChevronRight, FileText, Share2, Sparkles 
} from "lucide-react";
import Navbar from "@/components/Navbar";
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

export default function ResearcherProfilePage() {
  const { id } = useParams();
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [worksPage, setWorksPage] = useState(1);
  const [hasMoreWorks, setHasMoreWorks] = useState(true);
  const [totalWorks, setTotalWorks] = useState(0);

  useEffect(() => {
    if (id) {
      fetchResearcher();
      fetchWorks(1, true); // Reset and fetch first page
    }
  }, [id]);

  const fetchResearcher = async () => {
    try {
      const res = await fetch(API.researchers.detail(String(id)));
      const data = await res.json();
      if (data.success) {
        setResearcher(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch researcher");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorks = async (page: number, reset = false) => {
    try {
      setLoadingWorks(true);
      const res = await fetch(`${API.researchers.works(String(id))}?page=${page}&per_page=10`);
      const data = await res.json();
      
      if (data.success) {
        if (reset) {
          setWorks(data.data);
        } else {
          setWorks(prev => [...prev, ...data.data]);
        }
        setHasMoreWorks(data.meta.has_more);
        setTotalWorks(data.meta.total);
        setWorksPage(page);
      }
    } catch (err) {
      console.error("Failed to fetch works");
    } finally {
      setLoadingWorks(false);
    }
  };

  const loadMore = () => {
    if (!loadingWorks && hasMoreWorks) {
      fetchWorks(worksPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Loading scholar profile...</p>
        </div>
      </div>
    );
  }

  if (!researcher) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-32 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scholar not found</h2>
          <p className="text-slate-500 mt-2">The researcher you are looking for does not exist in our database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Cover Area */}
      <div className="h-64 bg-gradient-to-r from-primary to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 -mt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col items-center text-center">
                <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] p-1.5 shadow-xl mb-6">
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-[2.2rem] flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                    {researcher.avatar_url ? (
                      <img src={researcher.avatar_url} alt={researcher.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-primary/40" />
                    )}
                  </div>
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
                  {researcher.name}
                </h1>
                
                <p className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-sm mb-6">
                  <MapPin size={16} className="text-primary" />
                  {researcher.institution || "Independent Scholar"}
                  {researcher.country_code && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                      {researcher.country_code}
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-2 w-full">
                  <button className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Follow
                  </button>
                  <button className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-slate-700">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{researcher.citation_count?.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Citations</p>
                </div>
                <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{researcher.h_index || "N/A"}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">H-Index</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Layers size={14} className="text-primary" /> Core Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {researcher.research_domains.map((domain) => (
                  <span
                    key={domain}
                    className="px-4 py-2 bg-primary/5 dark:bg-primary/10 text-primary rounded-xl text-xs font-black border border-primary/10 uppercase tracking-wider"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Biography */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Scholar Biography
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed font-serif italic">
                  A distinguished academic and researcher associated with {researcher.institution}. 
                  With a prolific track record of {researcher.works_count} research works, they have made 
                  significant contributions to the field of {researcher.research_domains.slice(0, 3).join(", ")}. 
                  Their research has been cited over {researcher.citation_count?.toLocaleString()} times, 
                  demonstrating a sustained and profound impact on global scientific discourse.
                </p>
                <div className="flex items-center gap-2 mt-6 text-primary font-bold text-sm">
                  <Sparkles size={16} /> Verified Academic Status · Senior Researcher
                </div>
              </div>
            </div>

            {/* Research Items */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> Key Research Items
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full">
                  {totalWorks} total items
                </span>
              </div>

              {works.length > 0 ? (
                <div className="space-y-4">
                  {works.map((work) => (
                    <motion.a
                      key={work.id}
                      href={work.landing_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 8 }}
                      className="group flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      <div className="min-w-0 pr-6">
                        <h4 className="font-serif font-black text-slate-900 dark:text-white text-lg mb-2 group-hover:text-primary transition-colors">
                          {work.title}
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Globe size={14} className="text-slate-400" /> {work.journal}
                          </div>
                          <div className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                            {work.publication_year}
                          </div>
                          <div className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
                            <TrendingUp size={14} /> {work.citation_count} Citations
                          </div>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:shadow-lg transition-all shadow-sm shrink-0 border border-slate-100 dark:border-slate-700">
                        <ChevronRight size={20} />
                      </div>
                    </motion.a>
                  ))}

                  {/* Loading Skeletons for Load More */}
                  {loadingWorks && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={`skel-${i}`} className="h-24 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[2rem] border border-transparent" />
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMoreWorks && !loadingWorks && (
                    <button
                      onClick={loadMore}
                      className="w-full py-4 mt-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-sm font-bold text-slate-500 hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={16} className="text-primary" /> Load More Research Items
                    </button>
                  )}
                </div>
              ) : loadingWorks ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[2rem]" />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                  <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium italic">No research items currently indexed for this profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
