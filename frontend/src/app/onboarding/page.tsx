"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Brain, Cpu, Microscope, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";

const DOMAINS = [
  { id: 'cs', name: 'Computer Science', icon: <Cpu />, keywords: ['AI', 'Cryptography', 'Algorithms', 'Quantum Computing', 'Web3'] },
  { id: 'bio', name: 'Biology & Medicine', icon: <Microscope />, keywords: ['Genetics', 'Neuroscience', 'Biotech', 'Drug Discovery', 'Epidemiology'] },
  { id: 'ss', name: 'Social Sciences', icon: <Globe />, keywords: ['Sociology', 'Political Theory', 'Psychology', 'Economics', 'Anthropology'] },
  { id: 'phys', name: 'Physical Sciences', icon: <Brain />, keywords: ['Particle Physics', 'Astrophysics', 'Materials Science', 'Climate Change', 'Nanotechnology'] }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [researchType, setResearchType] = useState<'theoretical' | 'applied' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, completeOnboarding } = useAuth();
  const router = useRouter();

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev => 
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API.auth.onboardingComplete, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-auth-token": token || ""
        },
        body: JSON.stringify({ 
          interests: selectedKeywords,
          preferences: { researchType }
        }),
      });

      if (response.ok) {
        completeOnboarding();
        router.push("/");
      }
    } catch (err) {
        console.error("Onboarding failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-3xl w-full">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="animate-pulse" />
            <span className="font-bold text-xl uppercase tracking-widest">First Conversation</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                How do you approach <span className="text-primary italic">Knowledge?</span>
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button 
                  onClick={() => { setResearchType('theoretical'); setStep(2); }}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/10 hover:border-primary transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"><Brain /></div>
                  <h3 className="text-xl font-bold mb-2">Theoretical</h3>
                  <p className="text-slate-500 text-sm">Focus on abstract concepts, first principles, and mathematical proofs.</p>
                </button>
                <button 
                  onClick={() => { setResearchType('applied'); setStep(2); }}
                  className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-primary/10 hover:border-primary transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform"><Microscope /></div>
                  <h3 className="text-xl font-bold mb-2">Applied</h3>
                  <p className="text-slate-500 text-sm">Focus on practical solutions, engineering, and empirical experimentation.</p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Define your <span className="text-primary">Domains.</span>
              </h1>
              <div className="space-y-8 pt-4">
                {DOMAINS.map(domain => (
                  <div key={domain.id} className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      {domain.icon} {domain.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {domain.keywords.map(kw => (
                        <button
                          key={kw}
                          onClick={() => toggleKeyword(kw)}
                          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                            selectedKeywords.includes(kw)
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-primary/50'
                          }`}
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-8">
                <button 
                  disabled={selectedKeywords.length < 3}
                  onClick={() => setStep(3)}
                  className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl disabled:opacity-30 transition-all hover:gap-5"
                >
                  Next Step <ArrowRight size={20} />
                </button>
                <p className="mt-4 text-xs text-slate-400">Please select at least 3 keywords to continue.</p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 py-10"
            >
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">We've established the <span className="text-primary">Seed.</span></h1>
                <p className="text-slate-500 text-lg">Your profile is now calibrated to {selectedKeywords.length} core research vectors.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
                <div className="flex flex-wrap gap-1 justify-center opacity-60 grayscale">
                  {selectedKeywords.map(k => <span key={k} className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-50 rounded italic">{k}</span>)}
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-primary text-white px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-primary/25"
              >
                {isLoading ? "Calibrating..." : "Enter ResearchBridge"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
