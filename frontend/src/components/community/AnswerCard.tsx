"use client";

import React from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { ExpertiseBadge, ReputationScore } from "./ExpertiseBadge";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface AnswerCardProps {
  answer: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
      reputation: number;
      primaryField: string;
      expertiseLevel: "expert" | "senior" | "contributor";
    };
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: string;
    isVerified?: boolean;
  };
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-primary text-lg border-2 border-primary/10">
            {answer.author.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/profile/${answer.author.id}`}>
                <h4 className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer">
                  {answer.author.name}
                </h4>
              </Link>
              <ExpertiseBadge 
                field={answer.author.primaryField} 
                score={Math.floor(answer.author.reputation / 100)} 
                level={answer.author.expertiseLevel}
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <ReputationScore score={answer.author.reputation} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                • {new Date(answer.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-xl transition-all">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="prose dark:prose-invert max-w-none mb-6">
        <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif text-lg">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {answer.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-900">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
            <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-colors">
              <ThumbsUp size={18} />
              <span className="text-sm font-bold">{answer.upvotes}</span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors">
              <ThumbsDown size={18} />
            </button>
          </div>
          
          <button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
            <MessageSquare size={18} />
            <span className="text-sm">{answer.commentCount} Comments</span>
          </button>
        </div>

        <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors group">
          <Share2 size={18} />
          <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Share</span>
        </button>
      </div>
    </motion.div>
  );
};
