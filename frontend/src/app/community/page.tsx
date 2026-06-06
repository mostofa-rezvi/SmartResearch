"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, Tag, Search, Sparkles, HelpCircle, Lightbulb, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { API, API_BASE } from "@/config/api";
import { io } from "socket.io-client";
import { QuestionCard } from "@/components/community/QuestionCard";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { ResearcherCard } from "@/components/community/ResearcherCard";
import { ResearcherDetailModal } from "@/components/community/ResearcherDetailModal";
import { Globe, Users } from "lucide-react";

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'question' | 'thought'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [researchers, setResearchers] = useState<any[]>([]);
  const [loadingResearchers, setLoadingResearchers] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState<any>(null);
  const [isResearcherModalOpen, setIsResearcherModalOpen] = useState(false);
  const limit = 20;

  const { user, token } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    if (token) {
      fetchPosts(page);
      fetchResearchers();
    }
  }, [token, filter, debouncedSearch, page]);

  useEffect(() => {
    if (!token || !user) return;

    // Connect to Socket.IO backend
    const socket = io(API_BASE, {
      auth: { token }
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_feed", user.id);
    });

    // Listen for real-time new posts
    socket.on("new_post", (newPost) => {
      setPosts((prevPosts) => {
        return [{ ...newPost, matchedInterest: null, isLive: true }, ...prevPosts];
      });
    });

    // Listen for live reputation updates
    socket.on("reputation_update", (data) => {
      setToast({
        show: true,
        message: `Reputation ${data.delta > 0 ? '+' : ''}${data.delta}!`,
        type: data.delta > 0 ? 'success' : 'info'
      });
      setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });


  const fetchPosts = async (pageNum: number) => {
    try {
      setLoading(true);

      const offset = (pageNum - 1) * limit;
      const url = `${API.community.posts}?limit=${limit}&offset=${offset}&search=${encodeURIComponent(debouncedSearch)}&type=${filter}`;
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      const postsArray = data.success ? data.data : (Array.isArray(data) ? data : []);
      
      setPosts(postsArray);
      setTotalCount(data.meta?.totalCount || 0);
    } catch (err) {
      console.error("Failed to fetch feed");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResearchers = async () => {
    try {
      setLoadingResearchers(true);
      const response = await fetch(`${API.researchers.list}?limit=5`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setResearchers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch researchers");
    } finally {
      setLoadingResearchers(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const handlePostSuccess = (newPost: any) => {
    setPosts(prev => [{ ...newPost, isLive: true }, ...prev]);
    setToast({
      show: true,
      message: "Research successfully shared!",
      type: "success"
    });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
  };

  const handleVote = async (id: number, val: number) => {
    if (!token) return;

    const targetPost = posts.find(p => p.id === id);
    if (!targetPost) return;
    const newVal = targetPost.user_vote === val ? 0 : val;

    // Optimistic UI Update (Frontend Rule #3)
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === id) {
        let upDiff = 0;
        let downDiff = 0;
        
        if (p.user_vote === 1) upDiff = -1;
        if (p.user_vote === -1) downDiff = -1;

        if (newVal === 1) upDiff = 1;
        if (newVal === -1) downDiff = 1;

        return { 
          ...p, 
          upvotes: (parseInt(p.upvotes) || 0) + upDiff,
          downvotes: (parseInt(p.downvotes) || 0) + downDiff,
          user_vote: newVal === 0 ? null : newVal
        };
      }
      return p;
    }));

    try {
      await fetch(API.community.vote(String(id)), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ value: newVal })
      });
      // Optionally re-fetch to ensure server-side discovery ranking is correct
      // but the optimistic update handles the immediate feedback.
    } catch (err) {
      console.error("Vote failed");
      // Rollback if needed
      fetchPosts(page); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 50, x: "-50%" }}
              className="fixed bottom-10 left-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-xl"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold">
                 {toast.message.includes('+') ? '↑' : '↓'}
              </div>
              <span className="font-bold tracking-tight">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Filter Feed
              </h3>
              {socketConnected && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Connection Active" />}
            </div>
            
            <div className="space-y-2">
              {[
                { label: 'All Activity', id: 'all', icon: <MessageSquare size={16} /> },
                { label: 'Questions', id: 'question', icon: <HelpCircle size={16} /> },
                { label: 'Open Thoughts', id: 'thought', icon: <Lightbulb size={16} /> }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-[2rem] font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            Start New Discussion
          </button>
        </div>


        {/* Main Feed Content */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-4 mb-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search library, methodologies, papers..." 
              className="w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse italic text-slate-400">Blending your personalized research feed...</div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-bold text-slate-700 dark:text-white mb-1">No matches found</p>
              <p className="text-sm">Try adjusting your search terms.</p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {posts.map((post, idx) => (
                  <QuestionCard 
                    key={`${post.id}-${idx}`} 
                    post={post} 
                    onVote={handleVote} 
                    idx={idx} 
                  />
                ))}
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 pb-12 overflow-x-auto">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-50 text-sm font-bold bg-white dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                  >
                    Prev
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[2.5rem] h-10 rounded-xl font-bold text-sm transition-all ${
                        page === pageNum 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                        : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white border border-slate-50 dark:border-slate-800 shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 disabled:opacity-50 text-sm font-bold bg-white dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar - Researchers */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={18} className="text-primary" /> Global Researchers
              </h3>
              <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <Users size={14} className="text-slate-400" />
              </div>
            </div>

            {loadingResearchers ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {researchers.map((res, i) => (
                  <ResearcherCard 
                    key={res.id} 
                    researcher={res} 
                    idx={i} 
                    onClick={(r) => {
                      setSelectedResearcher(r);
                      setIsResearcherModalOpen(true);
                    }}
                  />
                ))}
                
                <button className="w-full py-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl transition-all uppercase tracking-widest border border-dashed border-primary/20">
                  Discover More Scholars
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-3xl shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles size={120} />
            </div>
            <h4 className="font-bold mb-2 relative z-10">Elite Network</h4>
            <p className="text-xs text-white/80 leading-relaxed mb-4 relative z-10">
              Connect with 50,000+ verified scholars from top-tier institutions globally.
            </p>
            <button className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/30 transition-all relative z-10">
              Learn More
            </button>
          </div>
        </div>
      </main>

      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePostSuccess}
        token={token || ""}
        apiUrl={API.community.posts}
      />

      <ResearcherDetailModal 
        isOpen={isResearcherModalOpen}
        onClose={() => setIsResearcherModalOpen(false)}
        researcher={selectedResearcher}
      />
    </div>

  );
}
