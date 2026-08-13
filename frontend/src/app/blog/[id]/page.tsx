"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Clock, Share2, Tag, BookOpen } from "lucide-react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface Blog {
  id: number;
  title: string;
  excerpt?: string;
  content: string;
  author: string;
  created_at: string;
  category: string;
  image_url: string;
}

const fallbackBlogs: Record<string, Blog> = {
  "101": {
    id: 101,
    title: "The Future of Vector Search in Peer-Reviewed Literature Discovery",
    excerpt: "How Retrieval-Augmented Generation (RAG) and high-dimensional semantic embeddings are solving the scientific reproducibility crisis and accelerating cross-disciplinary breakthroughs.",
    content: `
## Introduction: The Challenge of Traditional Literature Search

In modern scientific inquiry, researchers generate over **2.5 million new peer-reviewed articles each year**. Traditional keyword-matching search engines struggle to surface relevant papers when authors use differing terminology or novel conceptual frameworks.

### The Semantic Gap in Academic Literature

A researcher studying *quantum coherence in biological photosynthesis* might miss relevant papers titled *non-Markovian energy transfer in light-harvesting complexes* simply because the exact phrase "quantum coherence" does not appear in the title.

Dense vector embeddings map semantic intent directly into vector space, enabling sub-second discovery based on concept, methodology, and empirical dataset structure.

---

## Retrieval-Augmented Generation (RAG) in Peer-Reviewed Research

By combining **dense vector retrieval** with large language models fine-tuned on academic literature, SmartResearch introduces a transparent RAG pipeline that:

1. **Parses & Indexes Structured PDF Sections**: Extracts hypotheses, methodology, datasets, and citation nodes.
2. **Generates Verifiable Citations**: Ensures every AI summary statement links directly to specific line numbers and DOIs.
3. **Eliminates Hallucinations**: Constrains model responses strictly to peer-reviewed source literature.

> *"Integrating vector search into our daily lab workflow has cut down literature synthesis time from three weeks to less than two days, allowing us to focus on physical lab experiments."* — **Dr. Aris Thorne**, Principal Investigator

---

## Conclusion & Next Steps

The transition from keyword lookup to semantic vector discovery marks a critical shift in how global knowledge is processed, shared, and peer-reviewed.
`,
    author: "Dr. Elena Rossi",
    created_at: "2026-08-10",
    category: "AI & Methodology",
    image_url: "/blog_hero.png"
  },
  "1": {
    id: 1,
    title: "Escaping Academic Isolation: How Virtual Lab Mesh Network Unifies Remote Research Teams",
    excerpt: "Principal Investigators across 140 universities discuss real-time Markdown/LaTeX co-authoring and shared raw dataset archiving.",
    content: `
## The Silo Problem in Higher Education

Academic isolation remains one of the largest obstacles facing early-career researchers and PhD candidates. Working in departmental silos leads to redundant experimental setups and delayed peer reviews.

### Features of the Virtual Lab Mesh Network

- **Real-time LaTeX & Markdown Co-authoring**: Simultaneous editing with automatic conflict resolution.
- **Encrypted Dataset Repositories**: Store raw CSV, HDF5, and NetCDF files with immutable version histories.
- **Cross-Institutional Invites**: Invite external co-authors and domain experts with single-click access tokens.

---

## Empirical Impact across 3,200 Active Labs

In a survey of over 3,200 active research groups on SmartResearch, **92% reported faster manuscript turnarounds** and improved interdisciplinary collaboration across international university borders.
`,
    author: "Prof. Marcus Vance",
    created_at: "2026-08-08",
    category: "Lab Collaboration",
    image_url: "/feature_lab.png"
  },
  "2": {
    id: 2,
    title: "Understanding Q1 & Q2 Journal Tier Impact Metrics in Modern Scientific Publishing",
    excerpt: "A comprehensive guide for PhD candidates and postdocs on targeting high-impact journals with verified DOI metadata.",
    content: `
## Decoding Journal Metrics: Q1 vs Q2 Tiers

Journal Quartiles (Q1, Q2, Q3, Q4) rank scientific journals based on their impact factor within specific academic sub-disciplines.

### Key Factors in Q1 Calibration

1. **Citation Velocity**: How quickly published papers are cited by other Q1/Q2 journals within 24 months.
2. **Eigenfactor & SNIP Scores**: Adjusting for discipline-specific citation density.
3. **Peer Review Rigor**: Double-blind review protocols and open data availability mandates.

---

## Best Practices for Target Manuscript Submission

Always verify journal indexing in Crossref and Scopus before submitting your manuscript to prevent predatory publishing risks.
`,
    author: "Prof. Sarah Jenkins",
    created_at: "2026-08-05",
    category: "Publishing & Impact",
    image_url: "/feature_semantic.png"
  },
  "3": {
    id: 3,
    title: "Vector Search vs Keyword Matching: A Comparative Study in Literature Retrieval",
    excerpt: "Benchmarking 12.4 million papers to evaluate contextual relevance and semantic recall in interdisciplinary query benchmarks.",
    content: `
## Benchmarking Literature Search Engines

We benchmarked traditional SQL/Elasticsearch BM25 keyword matching against HNSW vector embedding search across a dataset of **12.4 million indexed paper abstracts**.

### Benchmark Findings

- **Recall@10 Improvement**: Vector search achieved 94.2% recall compared to 61.8% for keyword matching.
- **Interdisciplinary Cross-Over**: 45% of top relevant papers returned by vector search did not contain the exact query keywords.
`,
    author: "Dr. Satoshi Tanaka",
    created_at: "2026-08-01",
    category: "Data Science",
    image_url: "/feature_ai.png"
  }
};

export default function BlogDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { token } = useAuth();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(API.blogs.getById(id), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        
        if (json.success && json.data) {
          setBlog(json.data);
        } else if (fallbackBlogs[id]) {
          setBlog(fallbackBlogs[id]);
        } else {
          // Default fallback if ID not found in custom list
          setBlog({
            id: Number(id) || 1,
            title: fallbackBlogs["101"].title,
            content: fallbackBlogs["101"].content,
            author: fallbackBlogs["101"].author,
            created_at: fallbackBlogs["101"].created_at,
            category: fallbackBlogs["101"].category,
            image_url: fallbackBlogs["101"].image_url
          });
        }
      } catch (err) {
        console.error("Failed to fetch blog, using fallback:", err);
        if (fallbackBlogs[id]) {
          setBlog(fallbackBlogs[id]);
        } else {
          setBlog(fallbackBlogs["101"]);
        }
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-4">Article Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">The requested research publication could not be retrieved.</p>
        <Link href="/blog" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-600 transition-all">
          Back to Academic Chronicle
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />
      
      <main className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/blog')}
          className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mb-8 font-bold text-xs uppercase tracking-wider font-mono"
        >
          <ArrowLeft size={16} /> Back to Academic Chronicle
        </button>

        <header className="mb-10">
          <span className="bg-primary/10 text-primary dark:text-primary-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block font-mono border border-primary/20">
            {blog.category}
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 dark:text-white mb-8 leading-tight">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm font-bold text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-white/10 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary dark:text-primary-300 rounded-full flex items-center justify-center font-bold text-sm">
                {blog.author.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Author</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{blog.author}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Published</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <Calendar size={14} /> {formatDate(blog.created_at)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Est. Read</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  <Clock size={14} /> 6 min read
                </div>
              </div>
            </div>
          </div>
        </header>

        {blog.image_url && (
          <div className="relative w-full aspect-[21/9] min-h-[300px] rounded-[32px] overflow-hidden mb-12 shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-900">
            <Image src={blog.image_url} alt={blog.title} fill priority className="object-cover" />
          </div>
        )}

        <article className="prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:font-black prose-a:text-primary dark:prose-a:text-white hover:prose-a:text-secondary max-w-none font-medium leading-relaxed">
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </article>

        {/* Footer Navigation Back to Blog */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/10 flex justify-between items-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
          >
            <ArrowLeft size={16} /> All Articles
          </Link>
          <div className="text-xs text-slate-400 font-mono">
            SmartResearch Chronicle • Open Access
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
