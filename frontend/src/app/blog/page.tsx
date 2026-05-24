"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, PenTool } from "lucide-react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface Blog {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  category: string;
  image_url: string;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(API.blogs.list, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success) {
          setBlogs(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch blogs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, [token]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-5xl md:text-7xl font-serif font-black text-primary dark:text-white mb-6">
              The <span className="text-secondary italic">Chronicle</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium italic mb-8">"Insights, breakthroughs, and the evolution of global research."</p>
            
            {user && (
              <div className="flex justify-center gap-4">
                <Link href="/blog/create" className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl hover:shadow-primary/20">
                  <PenTool size={20} /> Write an Article
                </Link>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link href="/admin/blogs" className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-xl">
                    Review Submissions
                  </Link>
                )}
              </div>
            )}
          </header>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No articles published yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
              {blogs.map((post, idx) => (
                <Link href={`/blog/${post.id}`} key={post.id} className="block group">
                  <motion.article 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6 border border-slate-100 dark:border-white/10 shadow-xl bg-slate-100">
                      {post.image_url && (
                        <Image src={post.image_url} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-lg border border-primary/10">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(post.created_at)}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1"><Clock size={14} /> 5 min read</span>
                    </div>

                    <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-3 pt-6 border-t border-slate-50 dark:border-white/5">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-primary font-bold text-[10px]">
                        {post.author.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{post.author}</span>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <button className="px-12 py-5 rounded-2xl border-2 border-primary text-primary font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95">
              Load More Archives
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
