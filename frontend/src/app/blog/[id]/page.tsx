"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Blog {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  category: string;
  image_url: string;
}

export default function BlogDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { token } = useAuth();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(API.blogs.getById(id), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        
        if (json.success) {
          setBlog(json.data);
        } else {
          setError(json.message || "Blog not found");
        }
      } catch (err) {
        setError("Failed to load blog");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchBlog();
    }
  }, [id, token]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Oops!</h1>
        <p className="text-slate-500 mb-8">{error || "Blog not found"}</p>
        <Link href="/blog" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold">
          Back to Archives
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <button onClick={() => router.push('/blog')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-wider">
          <ArrowLeft size={16} /> Back to Archives
        </button>

        <header className="mb-12">
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 inline-block border border-primary/20">
            {blog.category}
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 dark:text-white mb-8 leading-tight">
            {blog.title}
          </h1>
          
          <div className="flex items-center gap-6 text-sm font-bold text-slate-500 border-y border-slate-100 dark:border-white/10 py-6">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary text-sm shadow-inner">
                {blog.author.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Written by</div>
                <div className="text-sm">{blog.author}</div>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-100 dark:bg-white/10"></div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Published</div>
              <div className="flex items-center gap-1 mt-0.5"><Calendar size={14} /> {formatDate(blog.created_at)}</div>
            </div>
          </div>
        </header>

        {blog.image_url && (
          <div className="relative w-full aspect-[21/9] rounded-[32px] overflow-hidden mb-16 shadow-2xl">
            <Image src={blog.image_url} alt={blog.title} fill className="object-cover" />
          </div>
        )}

        <article className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:font-black prose-a:text-primary hover:prose-a:text-secondary max-w-none">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </article>
      </main>

      <Footer />
    </div>
  );
}
