"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, Share2, Tag, Sparkles, HelpCircle, Lightbulb, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface QuestionCardProps {
  post: any;
  onVote: (id: number, val: number) => void;
  idx: number;
}

import { useRouter } from "next/navigation";

export const QuestionCard: React.FC<QuestionCardProps> = ({ post, onVote, idx }) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking a button, link, or the author area
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    router.push(`/community/${post.id}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: post.isLive ? 0.95 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: post.isLive ? 0 : idx * 0.05 }}
      onClick={handleCardClick}
      className={`bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden cursor-pointer ${post.isLive ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
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
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${post.type === 'question' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
            {post.type}
          </span>
        </div>
      </div>

      <Link href={`/community/${post.id}`}>
        <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer">
          {post.title}
        </h2>
      </Link>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-serif line-clamp-3">
        {post.content}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {(post.tags || []).map((tag: string) => (
          <span key={tag} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md uppercase tracking-wider">
            <Tag size={10} /> {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
            <button onClick={() => onVote(post.id, 1)} className={`flex items-center gap-1.5 transition-colors ${post.user_vote === 1 ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"}`}>
              <ThumbsUp size={16} />
              <span className="text-xs font-bold">{post.upvotes || 0}</span>
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-600"></div>
            <button onClick={() => onVote(post.id, -1)} className={`flex items-center gap-1.5 transition-colors ${post.user_vote === -1 ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}>
              <span className="text-xs font-bold">{post.downvotes || 0}</span>
              <ThumbsDown size={16} />
            </button>
          </div>
          <Link href={`/community/${post.id}`} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
            <MessageSquare size={16} /> <span className="text-sm font-medium">{post.comment_count || 0}</span>
          </Link>
        </div>
        <button className="text-slate-400 hover:text-primary transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};
