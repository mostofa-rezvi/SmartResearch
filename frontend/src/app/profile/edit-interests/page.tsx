"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Sparkles, Brain, Users, BookOpen, MessageSquare, 
  ChevronRight, Save, ArrowLeft, CheckCircle2, RotateCcw
} from "lucide-react";

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
  identity: <Users size={16} />,
  focus: <Brain size={16} />,
  collaboration: <Users size={16} />,
  publication: <BookOpen size={16} />,
  community: <MessageSquare size={16} />,
};

const SECTION_LABELS: Record<string, string> = {
  identity: "Research Identity",
  focus: "Intellectual Focus",
  collaboration: "Collaboration Axis",
  publication: "Publication Targets",
  community: "Community Pulse",
};

const SECTIONS = ['identity', 'focus', 'collaboration', 'publication', 'community'];

export default function EditInterestsPage() {
  const router = useRouter();
  const { user, token, completeOnboarding } = useAuth();
  const { fetchWithAuth } = useApi();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        // Fetch questions
        const qRes = await fetch(API.onboarding.questionsFlat);
        const qJson = await qRes.json();
        
        // Fetch existing answers
        const aRes = await fetchWithAuth(API.onboarding.userAnswers);
        const aJson = await aRes.json();

        if (qJson.success && aJson.success) {
          setQuestions(qJson.data);
          setAnswers(aJson.data || {});
        }
      } catch (err) {
        console.error("Failed to load onboarding questions/answers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSingleChoice = (questionId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const toggleMultiChoice = (questionId: number, option: string) => {
    const current = answers[questionId] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    setAnswers(prev => ({ ...prev, [questionId]: updated }));
  };

  const handleFreeText = (questionId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    try {
      const response = await fetchWithAuth(API.auth.onboardingComplete, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers,
          completedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        completeOnboarding();
        setSuccessMsg("Interests updated successfully! Recommendations have been updated.");
        // Redirect to discovery page to see updated recommendations after a short delay
        setTimeout(() => {
          router.push("/discovery");
        }, 1500);
      } else {
        alert("Failed to update profile settings.");
      }
    } catch (err) {
      console.error("Failed to save changes", err);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary mx-auto" size={48} />
          <p className="text-slate-400 font-bold text-sm">Loading Calibration Protocol...</p>
        </div>
      </div>
    );
  }

  // Filter questions for the active section
  const sectionQuestions = questions.filter(q => q.section === activeSection);

  // Helper to count answered questions in a section
  const getCompletedCount = (section: string) => {
    const sq = questions.filter(q => q.section === section);
    return sq.filter(q => {
      const ans = answers[q.id];
      if (ans === undefined || ans === null) return false;
      if (Array.isArray(ans)) return ans.length > 0;
      if (typeof ans === "string") return ans.trim() !== "";
      return true;
    }).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-32">
        {/* Back and Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Profile
            </button>
            <div className="flex items-center gap-3">
              <Sparkles className="text-secondary" size={28} />
              <h1 className="text-3xl md:text-4xl font-serif font-black text-primary">
                Recalibrate Research Interests
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Modify your core focus, collaboration preferences, and publication goals. Your recommendations in the Discovery feed will be updated dynamically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-hover shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm"
          >
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            {successMsg}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-xl space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 py-3 mb-2">
              Parameters
            </h3>
            {SECTIONS.map(sec => {
              const isActive = activeSection === sec;
              const count = getCompletedCount(sec);
              const total = questions.filter(q => q.section === sec).length;
              return (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left font-bold text-xs transition-all ${
                    isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>
                      {SECTION_ICONS[sec]}
                    </span>
                    <span>{SECTION_LABELS[sec]}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Form panel */}
          <div className="lg:col-span-3 bg-white p-8 md:p-10 rounded-[32px] border border-slate-100 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-10">
              <header className="border-b border-slate-100 pb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] bg-secondary/5 px-3 py-1 rounded">
                    {SECTION_LABELS[activeSection]}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">
                    Configure {SECTION_LABELS[activeSection]}
                  </h2>
                </div>
              </header>

              <div className="space-y-8">
                {sectionQuestions.map((q, qIdx) => (
                  <div key={q.id} className="space-y-4">
                    <label className="block text-base font-bold text-slate-800 font-serif">
                      <span className="text-slate-400 mr-2 font-sans text-sm font-black">
                        Q{qIdx + 1}.
                      </span>
                      {q.question_text}
                    </label>

                    {q.input_type === 'single_choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {q.options.map(option => {
                          const isSelected = answers[q.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleSingleChoice(q.id, option)}
                              className={`p-4 rounded-2xl text-left text-xs font-bold transition-all border ${
                                isSelected
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.input_type === 'multi_choice' && (
                      <div className="flex flex-wrap gap-2">
                        {q.options.map(option => {
                          const isSelected = (answers[q.id] || []).includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => toggleMultiChoice(q.id, option)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/15'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.input_type === 'free_text' && (
                      <textarea
                        value={answers[q.id] || ""}
                        onChange={(e) => handleFreeText(q.id, e.target.value)}
                        placeholder="Elaborate your research context, skills, or dynamic..."
                        className="w-full bg-slate-50 border border-transparent rounded-2xl p-5 text-sm font-medium outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-primary/5 transition-all min-h-[120px]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const idx = SECTIONS.indexOf(activeSection);
                    if (idx > 0) setActiveSection(SECTIONS[idx - 1]);
                  }}
                  disabled={SECTIONS.indexOf(activeSection) === 0}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-0"
                >
                  Previous Section
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idx = SECTIONS.indexOf(activeSection);
                    if (idx < SECTIONS.length - 1) {
                      setActiveSection(SECTIONS[idx + 1]);
                    } else {
                      handleSubmit({ preventDefault: () => {} } as any);
                    }
                  }}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all flex items-center gap-1"
                >
                  {SECTIONS.indexOf(activeSection) === SECTIONS.length - 1 ? (
                    <>
                      Save Changes <Save size={14} />
                    </>
                  ) : (
                    <>
                      Next Section <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
