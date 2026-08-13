"use client";

import React, { useState } from "react";
import { Users, FileCode, Sparkles, CheckCircle2, MessageSquare, Play } from "lucide-react";

export default function VirtualLabCoAuthoring() {
  const [activeTab, setActiveTab] = useState<'latex' | 'markdown'>('latex');

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto my-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-widest mb-4 inline-block shadow-sm">
          Virtual Lab Mesh Workspace
        </span>
        <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white mb-4">
          Real-Time Collaborative Manuscript Studio
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
          Co-author LaTeX papers, manage raw datasets, and conduct peer review discussions in real-time encrypted virtual lab spaces.
        </p>
      </div>

      <div className="bg-[#0A192F] p-8 md:p-12 rounded-[36px] border border-white/20 shadow-2xl text-white">
        {/* Top Workspace Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/15 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold border border-white/20">
              <FileCode size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-serif text-white">
                manuscript_draft_v3.tex
              </h4>
              <p className="text-xs text-primary-200 font-mono">
                Project: Quantum Bio-Mesh • encrypted workspace
              </p>
            </div>
          </div>

          {/* Active Co-authors Avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                { name: 'Dr. Vance', color: 'bg-blue-600' },
                { name: 'Prof. Chen', color: 'bg-emerald-600' },
                { name: 'Alex R.', color: 'bg-purple-600' }
              ].map((user, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full ${user.color} text-white font-bold text-xs flex items-center justify-center border-2 border-[#0A192F] shadow-sm`}
                  title={user.name}
                >
                  {user.name[0]}
                </div>
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-700">
              ● 3 Active Co-Authors
            </span>
          </div>
        </div>

        {/* Live LaTeX Code & Preview Split Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-[#12294B] p-6 rounded-2xl border border-white/15 relative">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/15 text-xs font-mono text-primary-200">
              <span>LaTeX Source Editor</span>
              <span className="text-secondary-300 font-bold">Auto-Saving (Synced)</span>
            </div>
            <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
              <code>{`\\documentclass{article}
\\usepackage{amsmath, graphicx, hyperref}

\\title{Sub-picosecond Energy Transfer in Photosynthetic Complexes}
\\author{Dr. Elena Rostova, Prof. Marcus Vance}

\\begin{document}
\\maketitle

\\begin{abstract}
We demonstrate multidimensional electronic spectroscopy over high-dimensional 
vector embeddings with $\\mathbf{E}(\\omega)$ resonance tuning.
\\end{abstract}

\\section{Methodology}
The exciton energy relaxation rate $\\gamma_{ij}$ follows the modified 
Redfield master equation:
\\begin{equation}
  \\frac{d\\rho_{ij}}{dt} = -i [H_0, \\rho]_{ij} + \\mathcal{L}_D (\\rho)
\\end{equation}
\\end{document}`}</code>
            </pre>
          </div>

          <div className="lg:col-span-5 bg-[#12294B] p-6 rounded-2xl border border-white/15 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/15">
                <span className="text-xs font-mono font-bold uppercase text-primary-200">Live Compiled PDF Preview</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-700">
                  PDF 1.7 Ready
                </span>
              </div>

              <div className="space-y-3 font-serif">
                <h3 className="text-xl font-bold text-white">
                  Sub-picosecond Energy Transfer in Photosynthetic Complexes
                </h3>
                <p className="text-xs font-mono text-primary-200">
                  By Dr. Elena Rostova, Prof. Marcus Vance
                </p>
                <div className="p-3 bg-[#0A192F] rounded-xl text-xs text-primary-100 italic font-sans border border-white/10">
                  "We demonstrate multidimensional electronic spectroscopy over high-dimensional vector embeddings with E(ω) resonance tuning."
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs font-mono text-primary-200">
              <span>Overleaf Compatible</span>
              <button className="skeuo-button-primary text-white px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 border border-white/20">
                <Play size={13} /> Recompile PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
