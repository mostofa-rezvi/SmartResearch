"use client";

import React, { useState } from "react";

export function FilterSidebar() {
  const [tier, setTier] = useState<string | null>(null);

  const DOMAINS = ["AI & ML", "Bioinformatics", "Quantum Computing", "Robotics"];
  const TIERS = ["Bronze", "Silver", "Gold"];

  return (
    <aside className="w-64 shrink-0 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-8 h-fit sticky top-24">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Domains</h3>
        <div className="space-y-3">
          {DOMAINS.map(d => (
            <label key={d} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{d}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">TrustRank Tier</h3>
        <div className="flex flex-col gap-2">
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => setTier(t === tier ? null : t)}
              className={`px-4 py-2 text-sm font-bold rounded-xl border text-left transition-all ${
                tier === t 
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
          placeholder="Filter by university..." 
          className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-primary"
        />
      </div>
    </aside>
  );
}
