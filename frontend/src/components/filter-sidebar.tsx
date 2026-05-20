"use client";

import React, { useState } from "react";

export interface FilterSidebarProps {
  selectedDomains: string[];
  onDomainChange: (domain: string) => void;
  selectedTier: string | null;
  onTierChange: (tier: string | null) => void;
  institutionSearch: string;
  onInstitutionChange: (inst: string) => void;
  userMatchedDomains?: string[];
}

export function FilterSidebar({
  selectedDomains, onDomainChange,
  selectedTier, onTierChange,
  institutionSearch, onInstitutionChange,
  userMatchedDomains = []
}: FilterSidebarProps) {
  const DOMAINS = ["AI & ML", "Bioinformatics", "Quantum Computing", "Robotics"];
  const TIERS = ["Bronze", "Silver", "Gold"];

  return (
    <aside className="w-64 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-8 h-fit sticky top-24">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Domains</h3>
        <div className="space-y-3">
          {DOMAINS.map(d => {
            const isMatched = userMatchedDomains.includes(d);
            return (
              <label key={d} className="flex items-center gap-3 cursor-pointer group/label">
                <input 
                  type="checkbox" 
                  checked={selectedDomains.includes(d)}
                  onChange={() => onDomainChange(d)}
                  className="rounded text-primary focus:ring-primary w-4 h-4" 
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover/label:text-primary transition-colors">{d}</span>
                  {isMatched && (
                    <span className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/25">
                      Your Focus
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">TrustRank Tier</h3>
        <div className="flex flex-col gap-2">
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => onTierChange(t === selectedTier ? null : t)}
              className={`px-4 py-2 text-sm font-bold rounded-xl border text-left transition-all ${
                selectedTier === t 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {t} Tier
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Institution</h3>
        <input 
          type="text" 
          value={institutionSearch}
          onChange={(e) => onInstitutionChange(e.target.value)}
          placeholder="Filter by university..." 
          className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary"
        />
      </div>
    </aside>
  );
}
