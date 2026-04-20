"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, Clock } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "The Future of Open Access: Bridging the Citation Gap",
      excerpt: "How democratized access to data is changing the landscape of scientific publishing in 2026.",
      author: "Dr. Elena Rossi",
      date: "May 12, 2026",
      readTime: "8 min read",
      category: "Research Policy",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000"
    },
    {
      id: 2,
      title: "Large Language Models in Methodological Validation",
      excerpt: "Exploring the role of AI in ensuring experimental reproducibility and data integrity.",
      author: "Satoshi Tanaka",
      date: "May 10, 2026",
      readTime: "12 min read",
      category: "Artificial Intelligence",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000"
    },
    {
      id: 3,
      title: "South Asian Ecology: A Collaborative Case Study",
      excerpt: "How a group of 50 researchers used ResearchBridge to map biodiversity in the Sundarbans.",
      author: "Rafiq Ahmed",
      date: "May 05, 2026",
      readTime: "15 min read",
      category: "Case Study",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-20 text-center">
            <h1 className="text-5xl md:text-7xl font-serif font-black text-primary dark:text-white mb-6">
              The <span className="text-secondary italic">Chronicle</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium italic">"Insights, breakthroughs, and the evolution of global research."</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
            {posts.map((post, idx) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6 border border-slate-100 dark:border-white/10 shadow-xl">
                  <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-lg border border-primary/10">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1"><Clock size={14} /> {post.readTime}</span>
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
            ))}
          </div>

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
