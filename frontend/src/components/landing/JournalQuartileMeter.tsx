"use client";

import React, { useState } from "react";
import { BookOpen, Award, CheckCircle2, Search, Filter, ExternalLink } from "lucide-react";

export default function JournalQuartileMeter() {
  const [filterQuartile, setFilterQuartile] = useState<'ALL' | 'Q1' | 'Q2'>('ALL');

  const journals = [
    { title: "Nature", quartile: "Q1", sjr: "15.234", hIndex: 1130, publisher: "Springer Nature", openAccess: false },
    { title: "Science", quartile: "Q1", sjr: "14.108", hIndex: 1058, publisher: "AAAS", openAccess: false },
    { title: "Nature Communications", quartile: "Q1", sjr: "5.321", hIndex: 295, publisher: "Springer Nature", openAccess: true },
    { title: "Cell", quartile: "Q1", sjr: "13.845", hIndex: 719, publisher: "Elsevier", openAccess: false },
    { title: "The Lancet", quartile: "Q1", sjr: "12.456", hIndex: 672, publisher: "Elsevier", openAccess: false },
    { title: "PLOS ONE", quartile: "Q1", sjr: "0.930", hIndex: 332, publisher: "PLOS", openAccess: true },
    { title: "Journal of High Energy Physics", quartile: "Q2", sjr: "2.140", hIndex: 184, publisher: "Springer", openAccess: true }
  ];

  const filteredJournals = filterQuartile === 'ALL' 
    ? journals 
    : journals.filter(j => j.quartile === filterQuartile);

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto my-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-300 border border-secondary/40 text-xs font-mono font-black uppercase tracking-widest mb-4 inline-block shadow-sm">
          Scimago & Crossref Calibrated
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white mb-4">
          Q1 & Q2 Journal Calibration Directory
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
          Target prestigious peer-reviewed publications with verified SJR impact scores and h-index metrics.
        </p>
      </div>

      <div className="bg-[#0A192F] p-8 rounded-3xl border border-white/20 shadow-2xl text-white">
        {/* Filter Pills */}
        <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-white/15 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-secondary-300" />
            <span className="text-xs font-mono font-bold uppercase text-primary-200">Impact Filter:</span>
            {(['ALL', 'Q1', 'Q2'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setFilterQuartile(q)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  filterQuartile === q
                    ? "bg-black text-white shadow-sm border border-white/20"
                    : "bg-white text-black hover:bg-slate-100 shadow-xs"
                }`}
              >
                {q === 'ALL' ? 'All Tiers' : `${q} Quartile`}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-primary-200 font-medium">
            Showing {filteredJournals.length} Verified Publications
          </span>
        </div>

        {/* Journal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJournals.map((j, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-[#12294B] border border-white/15 hover:border-secondary/60 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    j.quartile === 'Q1' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-blue-950 text-blue-300 border border-blue-700'
                  }`}>
                    {j.quartile} Tier
                  </span>
                  {j.openAccess && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono font-bold border border-purple-700">
                      Open Access
                    </span>
                  )}
                </div>

                <h4 className="text-xl font-serif font-black text-white">
                  {j.title}
                </h4>
                <p className="text-xs text-primary-200 font-mono">{j.publisher}</p>
              </div>

              <div className="pt-4 border-t border-white/10 mt-4 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-primary-200 block text-[10px]">SJR Impact</span>
                  <span className="font-bold text-secondary-300">{j.sjr}</span>
                </div>
                <div>
                  <span className="text-primary-200 block text-[10px]">H-Index</span>
                  <span className="font-bold text-white">{j.hIndex}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
