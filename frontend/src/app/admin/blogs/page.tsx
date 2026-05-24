"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { Check, X, Eye } from "lucide-react";
import Link from "next/link";

interface AdminBlog {
  id: number;
  title: string;
  category: string;
  author: string;
  status: string;
  created_at: string;
}

export default function AdminBlogsPage() {
  const { user, token } = useAuth();
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAdminBlogs = async () => {
    try {
      const res = await fetch(API.blogs.adminList, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data);
      } else {
        setError(json.message || "Failed to load blogs");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && user && (user.role === "admin" || user.role === "super_admin")) {
      fetchAdminBlogs();
    } else if (user) {
      setError("Unauthorized access");
      setIsLoading(false);
    }
  }, [token, user]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(API.blogs.updateStatus(id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        fetchAdminBlogs(); // Refresh list
      } else {
        alert(json.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 font-bold">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-serif font-black text-slate-900 dark:text-white mb-2">
            Editorial <span className="text-secondary italic">Review</span>
          </h1>
          <p className="text-slate-500 font-medium">Manage and approve user-submitted articles.</p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                <th className="p-6">Title</th>
                <th className="p-6">Author</th>
                <th className="p-6">Status</th>
                <th className="p-6">Date</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{blog.title}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                      {blog.category}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-slate-500 font-medium">{blog.author}</td>
                  <td className="p-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      blog.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      blog.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-slate-500 font-medium">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateStatus(blog.id, 'approved')}
                        disabled={blog.status === 'approved'}
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(blog.id, 'rejected')}
                        disabled={blog.status === 'rejected'}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                    No articles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
