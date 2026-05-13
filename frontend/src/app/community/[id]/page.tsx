"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { QuestionDetailView } from "@/components/community/QuestionDetailView";
import { SkeletonAnswerCard } from "@/components/community/SkeletonAnswerCard";
import { useParams } from "next/navigation";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export default function QuestionPage() {
  const params = useParams();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.id) return;

    const fetchData = async () => {
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
          author: {
            id: c.user_id,
            name: c.author_name,
            reputation: c.author_reputation || 0,
            primaryField: c.author_primary_field || 'Researcher',
            expertiseLevel: c.author_role === 'invited_user' ? 'senior' : 'contributor'
          },
          upvotes: c.vote_score || 0,
          downvotes: 0, // Backend doesn't split up/down in this query yet
          commentCount: 0,
          createdAt: c.created_at,
          isVerified: c.author_role === 'invited_user'
        }));

        setQuestion(transformedQuestion);
        setAnswers(transformedAnswers);
      } catch (err: any) {
        console.error("Error fetching post:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, token]);

  const handleAnswerSubmit = async (content: string) => {
    if (!token || !params.id) return;
    
    try {
      const response = await fetch(API.community.comments(params.id as string), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      const result = await response.json();
      if (result.success) {
        // Optimistically add the answer
        const newAnswer = {
          id: result.data.id,
          content: result.data.content,
          author: {
            id: result.data.user_id,
            name: "You", // Or fetch user name from context
            reputation: 0,
            primaryField: "Researcher",
            expertiseLevel: "contributor"
          },
          upvotes: 0,
          downvotes: 0,
          commentCount: 0,
          createdAt: result.data.created_at,
          isVerified: false
        };
        setAnswers(prev => [...prev, newAnswer]);
      }
    } catch (err) {
      console.error("Failed to post answer:", err);
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
          />
        )}
      </main>
    </div>
  );
}
