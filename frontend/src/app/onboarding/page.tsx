"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Microscope, Users, BookOpen, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useApi } from "@/context/AuthContext";
import { API } from "@/config/api";

interface Question {
  id: number;
  section: string;
  question_text: string;
  input_type: 'single_choice' | 'multi_choice' | 'free_text' | 'scale';
  options: string[];
  is_required: boolean;
  sort_order: number;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  identity: <Users size={18} />,
  focus: <Brain size={18} />,
  collaboration: <Users size={18} />,
  publication: <BookOpen size={18} />,
  community: <MessageSquare size={18} />,
};

const SECTION_LABELS: Record<string, string> = {
  identity: "Research Identity",
  focus: "Intellectual Focus",
  collaboration: "Collaboration Axis",
  publication: "Publication Targets",
  community: "Community Pulse",
};

export default function OnboardingPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, token, completeOnboarding, logout } = useAuth();
  const { fetchWithAuth } = useApi();
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetchWithAuth(API.onboarding.questionsFlat);
        const json = await res.json();
        if (json.success) {
          setQuestions(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (val: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
  };

  const toggleMultiChoice = (option: string) => {
    const current = answers[currentQuestion.id] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    handleAnswer(updated);
  };

  const nextStep = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(API.auth.onboardingComplete, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          answers,
          completedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        completeOnboarding();
        window.location.href = "/dashboard";
      } else if (response.status === 401) {
        alert("Your session has expired. Please log in again.");
        logout();
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Onboarding failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-20 text-center">No questions found. Please seed the database.</div>;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canContinue = !currentQuestion.is_required || (answers[currentQuestion.id] && (Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id].length > 0 : true));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
        />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2 text-primary font-serif">
            <Sparkles className="text-secondary" size={24} />
            <span className="font-black text-2xl tracking-tighter uppercase italic">Calibrating Lab</span>
          </div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
            Node {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            <header className="space-y-4">
              <div className="flex items-center gap-2 text-secondary font-black text-[10px] uppercase tracking-[0.2em] bg-secondary/5 w-fit px-3 py-1 rounded">
                {SECTION_ICONS[currentQuestion.section]} {SECTION_LABELS[currentQuestion.section]}
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                {currentQuestion.question_text.split('?')[0]}
                <span className="text-secondary italic">?</span>
              </h1>
            </header>

            <div className="space-y-4 pt-4">
              {currentQuestion.input_type === 'single_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`p-6 rounded-3xl text-left font-bold transition-all border ${
                        answers[currentQuestion.id] === option
                        ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-primary/50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.input_type === 'multi_choice' && (
                <div className="flex flex-wrap gap-3">
                  {currentQuestion.options.map(option => {
                    const isSelected = (answers[currentQuestion.id] || []).includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => toggleMultiChoice(option)}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
                          isSelected
                          ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-secondary/50'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.input_type === 'free_text' && (
                <textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Elaborate your thoughts..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 text-lg font-medium outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[200px]"
                />
              )}
            </div>

            <footer className="flex items-center justify-between pt-12 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={prevStep}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-all disabled:opacity-0"
              >
                <ArrowLeft size={18} /> Previous
              </button>

              <button 
                onClick={nextStep}
                disabled={!canContinue || isSubmitting}
                className={`px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all ${
                  isLastQuestion 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                  : 'bg-primary text-white shadow-xl shadow-primary/20'
                } hover:scale-105 active:scale-95 disabled:opacity-20`}
              >
                {isSubmitting ? "Finalizing..." : isLastQuestion ? "Complete Calibration" : "Next Protocol"} <ArrowRight size={20} />
              </button>
            </footer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
