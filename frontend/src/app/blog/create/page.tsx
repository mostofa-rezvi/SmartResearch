"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Send, Image as ImageIcon } from "lucide-react";

export default function CreateBlogPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: "",
    image_url: "",
    content: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!user) {
      setError("You must be logged in to submit a blog.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch(API.blogs.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      if (json.success) {
        router.push("/blog"); // Redirect back to archives
      } else {
        setError(json.message || "Failed to submit blog.");
      }
    } catch (err) {
      setError("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl">Please log in to write an article.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-black text-primary dark:text-white mb-4">
            Draft your <span className="text-secondary italic">Article</span>
          </h1>
          <p className="text-slate-500 font-medium">Share your research, methodologies, or academic insights with the global community.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-8 font-bold text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="The Future of Quantum Computing..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white font-serif text-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Excerpt</label>
              <textarea
                name="excerpt"
                required
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="A brief 1-2 sentence summary of your article..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white resize-none h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="Methodology">Methodology</option>
                  <option value="Case Study">Case Study</option>
                  <option value="Research Policy">Research Policy</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Career Advice">Career Advice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={16} /> Cover Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Article Body (Markdown Supported)</label>
              <textarea
                name="content"
                required
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your article here using markdown formatting..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-colors text-slate-900 dark:text-white font-mono text-sm h-96 resize-y"
              />
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-xl hover:shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : <><Send size={18} /> Submit for Review</>}
            </button>
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-6 uppercase tracking-widest">
            Note: All submissions are reviewed by our editorial board before publishing.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
