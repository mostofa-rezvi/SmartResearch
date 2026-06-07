'use client';

import React, { useState } from 'react';
import { Quote, Sparkles, Search, CheckSquare, FlaskConical } from 'lucide-react';
import { CitationGenerator } from '@/components/publication/CitationGenerator';
import { WritingFeedback } from '@/components/publication/WritingFeedback';
import { ScimagoJournalFinder } from '@/components/publication/ScimagoJournalFinder';
import { PublicationChecklist } from '@/components/publication/PublicationChecklist';

type Tab = 'checklist' | 'citations' | 'feedback' | 'journals';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'checklist', label: 'Checklist', icon: <CheckSquare size={16} /> },
  { id: 'citations', label: 'Citations', icon: <Quote size={16} /> },
  { id: 'feedback', label: 'AI Feedback', icon: <Sparkles size={16} /> },
  { id: 'journals', label: 'Journals', icon: <Search size={16} /> },
];

export default function PublicationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('checklist');

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <FlaskConical className="text-amber-500" size={28} />
          Publication Assistant
        </h1>
        <p className="text-slate-500 mt-1">Your complete toolkit from draft to submission</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-md">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'checklist' && <PublicationChecklist setActiveTab={setActiveTab} />}
        {activeTab === 'citations' && <CitationGenerator />}
        {activeTab === 'feedback' && <WritingFeedback />}
        {activeTab === 'journals' && <ScimagoJournalFinder />}
      </div>
    </div>
  );
}
