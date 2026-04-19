"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, Tag, Search, Sparkles, HelpCircle, Lightbulb, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { API, API_BASE } from "@/config/api";
import { io } from "socket.io-client";

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'question' | 'thought'>('all');
  const [socketConnected, setSocketConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    // Connect to Socket.IO backend
    const socket = io(API_BASE);
    
    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_feed", user.id);
    });

    // Listen for real-time new posts
    socket.on("new_post", (newPost) => {
      setPosts((prevPosts) => {
        // Simple logic: if it's a new post, inject at the top with a minor boost to make it visible, though real discovery ranking normally happens server-side
        return [{ ...newPost, matchedInterest: null, isLive: true }, ...prevPosts];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(API.community.posts, {
        headers: { "x-auth-token": token || "" }
      });
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch feed");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: number, val: number) => {
    if (!token) return;

    // Optimistic UI Update (Frontend Rule #3)
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === id) {
        return { ...p, vote_score: (parseInt(p.vote_score) || 0) + val };
      }
      return p;
    }));

    try {
      await fetch(API.community.vote(String(id)), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ value: val })
      });
      // Optionally re-fetch to ensure server-side discovery ranking is correct
      // but the optimistic update handles the immediate feedback.
    } catch (err) {
      console.error("Vote failed");
      // Rollback if needed
      fetchPosts(); 
    }
  };

  const filteredPosts = React.useMemo(() => {
    return posts.filter(p => filter === 'all' || p.type === filter);
  }, [posts, filter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1 space-y-4">
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
        </div>

        {/* Main Feed Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4 mb-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <Search className="text-slate-400 ml-2" size={20} />
            <input 
              type="text" 
              placeholder="Search library, methodologies, papers..." 
              className="w-full bg-transparent border-none outline-none text-sm"
            />
          </div>

          {loading ? (
            <div className="py-20 text-center animate-pulse italic text-slate-400">Blending your personalized research feed...</div>
          ) : (
            <AnimatePresence>
              {filteredPosts.map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 10, scale: post.isLive ? 0.95 : 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: post.isLive ? 0 : idx * 0.05 }}
                  className={`bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden ${post.isLive ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                >
                  {post.isLive && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                       Live Update
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-primary">
                        {post.author_name ? post.author_name[0] : '?'}
                      </div>
                      <div>
                        <Link href={`/profile/${post.user_id}`}>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm hover:underline cursor-pointer flex items-center gap-1">
                            {post.author_name}
                            {post.author_role === 'invited_user' && <span title="Verified Scholar"><ShieldCheck size={14} className="text-amber-500" /></span>}
                          </h4>
                        </Link>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {post.author_role === 'invited_user' ? 'Senior Researcher' : 'Researcher'} • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex flex-col items-end gap-1">
                        {post.matchedInterest && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/5 px-2 py-1 rounded-md border border-accent/10">
                              <Sparkles size={10} /> {post.matchedInterest.toUpperCase()} MATCH
                          </span>
                        )}
                        {post.discovery_reason && (
                          <span className="text-[9px] text-slate-400 italic">
                            {post.discovery_reason}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${post.type === 'question' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {post.type}
                      </span>
                    </div>
                  </div>

                  {post.title && <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{post.title}</h2>}
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-serif">{post.content}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {(post.tags || []).map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md uppercase tracking-wider">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-900">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                        <button onClick={() => handleVote(post.id, 1)} className="hover:text-primary transition-colors"><ThumbsUp size={16} /></button>
                        <span className="text-sm font-bold min-w-[20px] text-center">{post.vote_score || 0}</span>
                        <button onClick={() => handleVote(post.id, -1)} className="hover:text-red-500 transition-colors"><ThumbsDown size={16} /></button>
                      </div>
                      <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
                        <MessageSquare size={16} /> <span className="text-sm font-medium">{post.comment_count || 0}</span>
                      </button>
                    </div>
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
