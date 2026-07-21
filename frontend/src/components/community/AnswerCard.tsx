"use client";

import React from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, CheckCircle2, Reply } from "lucide-react";
import Link from "next/link";
import { ExpertiseBadge, ReputationScore } from "./ExpertiseBadge";
import { CommunityEditor } from "./CommunityEditor";
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
      trustTier?: string | null;
    };
    upvotes: number;
    downvotes: number;
    commentCount: number;
    createdAt: string;
    isVerified?: boolean;
  };
  isAccepted?: boolean;
  canAccept?: boolean;
  onAccept?: () => void;
  replyOpen?: boolean;
  onToggleReply?: () => void;
  onReplySubmit?: (content: string) => void | Promise<void>;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer, isAccepted, canAccept, onAccept, replyOpen, onToggleReply, onReplySubmit }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-6 border shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all group ${
        isAccepted
          ? "bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/30 ring-1 ring-emerald-400/40"
          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
      }`}
    >
      {isAccepted && (
        <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
          <CheckCircle2 size={16} /> Accepted Answer
        </div>
      )}
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
              {(answer.author.trustTier === "professor" || answer.author.trustTier === "verified") && (
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    answer.author.trustTier === "professor"
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  }`}
                  title="TrustRank tier"
                >
                  {answer.author.trustTier}
                </span>
              )}
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
          
          {onToggleReply && (
            <button
              onClick={onToggleReply}
              className={`flex items-center gap-2 transition-colors font-medium ${replyOpen ? "text-primary" : "text-slate-500 hover:text-primary"}`}
            >
              <Reply size={18} />
              <span className="text-sm">Reply</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canAccept && onAccept && (
            <button
              onClick={onAccept}
              className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full hover:bg-emerald-500/20 transition-all uppercase tracking-widest"
            >
              <CheckCircle2 size={16} /> Accept
            </button>
          )}
          <button className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors group">
            <Share2 size={18} />
            <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Share</span>
          </button>
        </div>
      </div>

      {replyOpen && onReplySubmit && (
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <CommunityEditor
            placeholder="Write a reply..."
            submitLabel="Post Reply"
            onSave={onReplySubmit}
          />
        </div>
      )}
    </motion.div>
  );
};
