"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, Tag, Search, Sparkles, HelpCircle, Lightbulb } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'question' | 'thought'>('all');
  const { user, token } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/community/posts");
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
    try {
      await fetch(`http://localhost:5000/api/community/posts/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ value: val })
      });
      fetchPosts(); // Refresh
    } catch (err) {
      console.error("Vote failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-20 max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl sticky top-24">
            <h3 className="font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Filter Feed
            </h3>
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
              {posts.filter(p => filter === 'all' || p.type === filter).map((post, idx) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-primary">
                        {post.author_name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{post.author_name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Researcher • {new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${post.type === 'question' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {post.type}
                    </span>
                  </div>

                  {post.title && <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{post.title}</h2>}
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{post.content}</p>

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
