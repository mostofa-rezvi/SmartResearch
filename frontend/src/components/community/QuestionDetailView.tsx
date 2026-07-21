"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Tag, Clock, Share2, MoreHorizontal, MessageSquare, ChevronDown } from "lucide-react";
import Link from "next/link";
import { AnswerCard } from "./AnswerCard";
import { ExpertiseBadge, ReputationScore } from "./ExpertiseBadge";
import { CommunityEditor } from "./CommunityEditor";
import { ShareModal } from "./ShareModal";

interface QuestionDetailViewProps {
  question: {
    id: string;
    title: string;
    content: string;
    authorId?: string;
    acceptedCommentId?: string | null;
    author: {
      id: string;
      name: string;
      reputation: number;
      primaryField: string;
      expertiseLevel: "expert" | "senior" | "contributor";
    };
    tags: string[];
    createdAt: string;
    answerCount: number;
    viewCount: number;
    voteScore: number;
    userVote: number | null;
  };
  answers: any[];
  isLoading?: boolean;
  onAnswerSubmit?: (content: string) => Promise<void>;
  currentUserId?: string;
  onReply?: (parentId: string, content: string) => Promise<void> | void;
  onAcceptAnswer?: (commentId: string) => Promise<void> | void;
}

export const QuestionDetailView: React.FC<QuestionDetailViewProps> = ({ question, answers, isLoading, onAnswerSubmit, currentUserId, onReply, onAcceptAnswer }) => {
  const [sortOrder, setSortOrder] = useState<"reputation" | "newest">("reputation");
  const editorRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const isAuthor = currentUserId != null && String(currentUserId) === String(question.authorId);

  // Group comments by parent to build the thread tree
  const byParent = new Map<string | null, any[]>();
  answers.forEach((a) => {
    const key = a.parentId != null ? String(a.parentId) : null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(a);
  });

  const isAccepted = (answer: any) =>
    answer.isAccepted || (question.acceptedCommentId != null && String(answer.id) === String(question.acceptedCommentId));

  const sortAnswers = (list: any[]) => {
    const sorted = [...list].sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.upvotes || 0) - (a.upvotes || 0);
    });
    // Accepted answer always floats to the top
    return sorted.sort((a, b) => Number(isAccepted(b)) - Number(isAccepted(a)));
  };

  const renderAnswer = (answer: any, depth: number): React.ReactNode => {
    const children = byParent.get(String(answer.id)) || [];
    return (
      <div key={answer.id} className={depth > 0 ? "ml-4 md:ml-8 pl-4 md:pl-6 border-l-2 border-slate-100 dark:border-slate-800" : ""}>
        <AnswerCard
          answer={answer}
          isAccepted={isAccepted(answer)}
          canAccept={isAuthor && !isAccepted(answer)}
          onAccept={onAcceptAnswer ? () => onAcceptAnswer(String(answer.id)) : undefined}
          replyOpen={replyTo === String(answer.id)}
          onToggleReply={onReply ? () => setReplyTo(replyTo === String(answer.id) ? null : String(answer.id)) : undefined}
          onReplySubmit={onReply ? async (content: string) => { await onReply(String(answer.id), content); setReplyTo(null); } : undefined}
        />
        {children.length > 0 && (
          <div className="mt-6 space-y-6">
            {sortAnswers(children).map((child) => renderAnswer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const topLevel = sortAnswers(byParent.get(null) || []);

  const handleAnswerClick = () => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Original Question Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-700 shadow-2xl mb-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <HelpCircle size={24} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {question.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-100 dark:border-slate-800">
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
          {question.title}
        </h1>

        <div className="prose dark:prose-invert max-w-none mb-10">
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-serif italic">
            {question.content}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-slate-50 dark:border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
              {question.author.name[0]}
            </div>
            <div>
              <Link href={`/profile/${question.author.id}`}>
                <h4 className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors cursor-pointer">
                  {question.author.name}
                </h4>
              </Link>
              <div className="flex items-center gap-2">
                <ReputationScore score={question.author.reputation} />
                <span className="text-xs text-slate-400">• Asked on {new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAnswerClick}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Answer the Question
            </button>
            <div className="relative">
              <button 
                onClick={handleShare}
                className="p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={question.title}
      />

      {/* Answers Section Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <MessageSquare className="text-primary" /> {question.answerCount} Expert Responses
        </h2>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setSortOrder("reputation")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${sortOrder === "reputation" ? "bg-primary text-white shadow-md shadow-primary/10" : "text-slate-400 hover:text-slate-600"}`}
          >
            Top Reputation
          </button>
          <button
            onClick={() => setSortOrder("newest")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${sortOrder === "newest" ? "bg-primary text-white shadow-md shadow-primary/10" : "text-slate-400 hover:text-slate-600"}`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Your Answer Section */}
      <div ref={editorRef} className="mb-12">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 ml-2">Provide Your Expert Answer</h3>
        <CommunityEditor
          placeholder="Detailed explanation with formulas... e.g. $E=mc^2$"
          onSave={onAnswerSubmit}
        />
      </div>

      {/* Answers List (threaded) */}
      <div className="space-y-8">

        {topLevel.map((answer) => renderAnswer(answer, 0))}

        {answers.length === 0 && !isLoading && (
          <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-4xl mb-4 opacity-50">🎓</div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">No expert answers yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-sm">Be the first researcher to provide an authoritative answer to this question!</p>
            <button
              onClick={handleAnswerClick}
              className="mt-6 px-8 py-3 bg-white dark:bg-slate-800 text-primary border border-primary/20 rounded-2xl font-bold shadow-sm hover:bg-primary hover:text-white transition-all"
            >
              Submit Your Answer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
