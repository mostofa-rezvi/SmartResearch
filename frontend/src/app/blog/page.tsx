"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  PenTool,
  BookOpen,
  Sparkles,
  ArrowRight,
  Search,
  Tag,
  Share2,
  TrendingUp,
  Award,
  CheckCircle2
} from "lucide-react";
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

const featuredPost = {
  id: 101,
  title: "The Future of Vector Search in Peer-Reviewed Literature Discovery",
  excerpt: "How Retrieval-Augmented Generation (RAG) and high-dimensional semantic embeddings are solving the scientific reproducibility crisis and accelerating cross-disciplinary breakthroughs.",
  author: "Dr. Elena Rossi",
  role: "Director of Research, SmartResearch",
  date: "2026-08-10",
  category: "AI & Methodology",
  readTime: "8 min read",
  image: "/blog_hero.png"
};

const defaultArticles = [
  {
    id: 1,
    title: "Escaping Academic Isolation: How Virtual Lab Mesh Network Unifies Remote Research Teams",
    excerpt: "Principal Investigators across 140 universities discuss real-time Markdown/LaTeX co-authoring and shared raw dataset archiving.",
    author: "Prof. Marcus Vance",
    category: "Lab Collaboration",
    created_at: "2026-08-08",
    image_url: "/feature_lab.png"
  },
  {
    id: 2,
    title: "Understanding Q1 & Q2 Journal Tier Impact Metrics in Modern Scientific Publishing",
    excerpt: "A comprehensive guide for PhD candidates and postdocs on targeting high-impact journals with verified DOI metadata.",
    author: "Prof. Sarah Jenkins",
    category: "Publishing & Impact",
    created_at: "2026-08-05",
    image_url: "/feature_semantic.png"
  },
  {
    id: 3,
    title: "Vector Search vs Keyword Matching: A Comparative Study in Literature Retrieval",
    excerpt: "Benchmarking 12.4 million papers to evaluate contextual relevance and semantic recall in interdisciplinary query benchmarks.",
    author: "Dr. Satoshi Tanaka",
    category: "Data Science",
    created_at: "2026-08-01",
    image_url: "/feature_ai.png"
  }
];

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(API.blogs.list, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setBlogs(json.data);
        } else {
          setBlogs(defaultArticles);
        }
      } catch (err) {
        console.error("Failed to fetch blogs", err);
        setBlogs(defaultArticles);
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

  const categories = ["All Topics", "AI & Methodology", "Lab Collaboration", "Publishing & Impact", "Data Science"];

  const filteredBlogs = selectedCategory === "All Topics"
    ? blogs
    : blogs.filter(b => b.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Academic Editorial Header */}
          <header className="relative isolate mb-20 pt-6 pb-10 text-center max-w-4xl mx-auto">
            <HeroBackdrop tone="secondary" />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 text-xs font-bold uppercase tracking-widest mono-academic mb-6"
            >
              <BookOpen size={16} />
              <span>The Academic Chronicle</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-black text-slate-900 dark:text-white mb-6 leading-tight"
            >
              Peer-Reviewed Insights & <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Scientific Discourse
              </span>
            </motion.h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
              Explore the latest methodologies, vector literature discoveries, and lab collaboration best practices from global researchers.
            </p>

            {user && (
              <div className="flex justify-center gap-4">
                <Link
                  href="/blog/create"
                  className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-primary/25"
                >
                  <PenTool size={18} />
                  Write an Academic Article
                </Link>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link
                    href="/admin/blogs"
                    className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-slate-700 transition-all shadow-xl"
                  >
                    Review Editorial Submissions
                  </Link>
                )}
              </div>
            )}
          </header>

          {/* Featured Spotlight Article Banner */}
          <section className="mb-24">
            <div className="relative rounded-[36px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-900 group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 md:p-12">
              <div className="lg:col-span-6 space-y-6 z-10">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-bold uppercase tracking-widest font-mono">
                    Featured Spotlight
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">{featuredPost.readTime}</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight group-hover:text-primary-200 transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="text-slate-300 text-base md:text-lg leading-relaxed font-medium">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                      ER
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{featuredPost.author}</div>
                      <div className="text-xs text-slate-400 font-mono">{featuredPost.role}</div>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
                  >
                    Read Full Paper <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </section>

          {/* Category Filter Navigation */}
          <div className="flex justify-center flex-wrap gap-3 mb-16">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all font-mono uppercase tracking-wider ${
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-16 text-lg font-medium">
              No articles found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
              {filteredBlogs.map((post, idx) => (
                <Link href={`/blog/${post.id}`} key={post.id} className="block group">
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="h-full flex flex-col p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 hover:shadow-2xl hover:border-primary/40 transition-all"
                  >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-6 border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800">
                      {post.image_url && (
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary dark:text-slate-200 shadow-md border border-slate-200 dark:border-white/10 font-mono">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 font-mono">
                      <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(post.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> 5 min read</span>
                    </div>

                    <h2 className="text-xl font-serif font-black text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3 font-medium flex-grow">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary dark:text-primary-300 font-bold text-xs flex items-center justify-center">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{post.author}</span>
                      </div>
                      <span className="text-xs font-bold text-primary dark:text-primary-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Read <ArrowRight size={14} />
                      </span>
                    </div>
                  </motion.article>
                </Link>
              ))}
            </div>
          )}

          {/* Academic Newsletter Subscription Banner */}
          <section className="bg-gradient-to-r from-primary via-primary-700 to-secondary text-white rounded-[36px] p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="max-w-3xl mx-auto relative z-10">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-widest font-mono mb-4 inline-block">
                Stay Informed
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black mb-6">
                Subscribe to The ResearchBridge Digest
              </h2>
              <p className="text-white/80 text-lg mb-8 font-medium">
                Get weekly updates on breakthrough vector search findings, new Q1 publications, and academic grant opportunities.
              </p>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  placeholder="Enter your institutional email..."
                  className="px-5 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-accent font-medium flex-grow"
                />
                <button type="submit" className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg shrink-0">
                  Subscribe Free
                </button>
              </form>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
