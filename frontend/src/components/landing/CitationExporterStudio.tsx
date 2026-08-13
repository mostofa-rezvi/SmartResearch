"use client";

import React, { useState } from "react";
import { Copy, Check, FileText, Code, Sparkles, BookOpen } from "lucide-react";

export default function CitationExporterStudio() {
  const [activeFormat, setActiveFormat] = useState<'bibtex' | 'apa' | 'ieee' | 'ris'>('bibtex');
  const [copied, setCopied] = useState(false);

  const sampleCitations = {
    bibtex: `@article{Rostova2026,
  author = {Rostova, Elena and Vance, Marcus and Chen, Sarah},
  title = {Sub-second Citation Graph Traversal over High-Dimensional Vector Embeddings},
  journal = {Nature Computational Science},
  volume = {12},
  number = {4},
  pages = {341--356},
  year = {2026},
  doi = {10.1038/s43588-026-00412-x}
}`,
    apa: `Rostova, E., Vance, M., & Chen, S. (2026). Sub-second citation graph traversal over high-dimensional vector embeddings. Nature Computational Science, 12(4), 341–356. https://doi.org/10.1038/s43588-026-00412-x`,
    ieee: `E. Rostova, M. Vance, and S. Chen, "Sub-second citation graph traversal over high-dimensional vector embeddings," Nature Computational Science, vol. 12, no. 4, pp. 341–356, 2026, doi: 10.1038/s43588-026-00412-x.`,
    ris: `TY  - JOUR
AU  - Rostova, Elena
AU  - Vance, Marcus
AU  - Chen, Sarah
TI  - Sub-second Citation Graph Traversal over High-Dimensional Vector Embeddings
JO  - Nature Computational Science
VL  - 12
IS  - 4
SP  - 341
EP  - 356
PY  - 2026
DO  - 10.1038/s43588-026-00412-x
ER  - `
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCitations[activeFormat]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto my-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary dark:text-primary-200 border border-primary/20 text-xs font-mono font-bold uppercase tracking-widest inline-block shadow-sm">
            Universal Citation Studio
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-slate-900 dark:text-white leading-tight">
            Instant Citation & Reference Export
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg font-medium leading-relaxed">
            Generate clean, validated citations in BibTeX, APA, IEEE, or RIS formats instantly for your Zotero, Mendeley, or LaTeX workflows.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-700">
              ✔ 100% Validated Syntax
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-mono font-bold border border-blue-300 dark:border-blue-700">
              ✔ Crossref DOI Sync
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#0A192F] p-8 rounded-3xl border border-white/20 shadow-2xl text-white">
          <div className="flex justify-between items-center pb-4 border-b border-white/15 mb-6">
            <div className="flex gap-2">
              {(['bibtex', 'apa', 'ieee', 'ris'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setActiveFormat(fmt)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase transition-all ${
                    activeFormat === fmt
                      ? "bg-white text-black shadow-md border border-white"
                      : "bg-black text-white hover:bg-slate-800 border border-white/20"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-slate-800 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md border border-white/20"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          <pre className="p-6 rounded-2xl bg-[#12294B] text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-white/10">
            <code>{sampleCitations[activeFormat]}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
