"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { QuestionDetailView } from "@/components/community/QuestionDetailView";
import { SkeletonAnswerCard } from "@/components/community/SkeletonAnswerCard";
import { useParams } from "next/navigation";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export default function QuestionPage() {
  const params = useParams();
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !params.id) return;
    try {
      setIsLoading(true);

      // Fetch Post Detail
      const postRes = await fetch(`${API.community.posts}/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const postData = await postRes.json();

      if (!postData.success) throw new Error("Post not found");

      // Fetch Comments (Answers)
      const commentsRes = await fetch(API.community.comments(params.id as string), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const commentsData = await commentsRes.json();

      // Transform data to match QuestionDetailView expectations
      const transformedQuestion = {
        id: postData.data.id,
        title: postData.data.title || (postData.data.type === 'thought' ? 'Academic Thought' : 'Research Question'),
        content: postData.data.content,
        authorId: postData.data.user_id,
        acceptedCommentId: postData.data.accepted_comment_id ?? null,
        author: {
          id: postData.data.user_id,
          name: postData.data.author_name,
          reputation: postData.data.author_reputation || 0,
          primaryField: postData.data.author_primary_field || 'Researcher',
          expertiseLevel: postData.data.author_role === 'invited_user' ? 'expert' : 'contributor'
        },
        tags: postData.data.tags || [],
        createdAt: postData.data.created_at,
        answerCount: postData.data.comment_count || 0,
        viewCount: postData.data.view_count || 0,
        voteScore: postData.data.vote_score || 0,
        userVote: postData.data.user_vote
      };

      const transformedAnswers = (commentsData.data || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        parentId: c.parent_id ?? null,
        isAccepted: !!c.is_accepted,
        author: {
          id: c.user_id,
          name: c.author_name,
          reputation: c.author_reputation_points || c.author_reputation || 0,
          primaryField: c.author_primary_field || 'Researcher',
          expertiseLevel: (c.author_trust_tier === 'professor' || c.author_role === 'invited_user')
            ? 'expert' : (c.author_trust_tier === 'verified' ? 'senior' : 'contributor'),
          trustTier: c.author_trust_tier || null,
        },
        upvotes: c.vote_score || 0,
        downvotes: 0, // Backend doesn't split up/down in this query yet
        commentCount: 0,
        createdAt: c.created_at,
        isVerified: c.author_trust_tier === 'professor' || c.author_role === 'invited_user'
      }));

      setQuestion(transformedQuestion);
      setAnswers(transformedAnswers);
    } catch (err: any) {
      console.error("Error fetching post:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const postComment = async (content: string, parentId?: string | null) => {
    if (!token || !params.id) return;
    try {
      const response = await fetch(API.community.comments(params.id as string), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content, ...(parentId ? { parent_id: parentId } : {}) })
      });

      const result = await response.json();
      if (result.success) {
        // Refetch to pick up threading / ordering from the backend
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleAnswerSubmit = async (content: string) => {
    await postComment(content, null);
  };

  const handleReply = async (parentId: string, content: string) => {
    await postComment(content, parentId);
  };

  const handleAcceptAnswer = async (commentId: string) => {
    if (!token || !params.id) return;
    try {
      const response = await fetch(API.community.acceptAnswer(params.id as string), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ comment_id: commentId })
      });
      const result = await response.json();
      if (result.success) {
        setQuestion((prev: any) => prev ? { ...prev, acceptedCommentId: commentId } : prev);
        setAnswers(prev => prev.map(a => ({ ...a, isAccepted: String(a.id) === String(commentId) })));
      }
    } catch (err) {
      console.error("Failed to accept answer:", err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="pt-40 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
          <p className="text-slate-500">The research paper or discussion you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="pt-24 pb-20">
        {isLoading ? (
          <div className="max-w-4xl mx-auto px-6 space-y-8">
             <div className="h-64 bg-white dark:bg-slate-800 rounded-[2.5rem] animate-pulse mb-12"></div>
             <SkeletonAnswerCard />
             <SkeletonAnswerCard />
          </div>
        ) : question && (
          <QuestionDetailView
            question={question}
            answers={answers}
            onAnswerSubmit={handleAnswerSubmit}
            currentUserId={user?.id}
            onReply={handleReply}
            onAcceptAnswer={handleAcceptAnswer}
          />
        )}
      </main>
    </div>
  );
}
