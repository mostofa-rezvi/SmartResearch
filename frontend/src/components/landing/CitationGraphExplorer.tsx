"use client";

import React, { useState } from "react";
import { Network, Zap, CheckCircle2, ArrowRight } from "lucide-react";

export default function CitationGraphExplorer() {
  const [selectedNode, setSelectedNode] = useState(0);

  const nodes = [
    {
      id: 0,
      title: "Quantum Coherence in Biological Systems",
      author: "Dr. Elena Rostova et al. (2025)",
      journal: "Nature Quantum • Q1",
      citations: 342,
      trustScore: 99.8,
      doi: "10.1038/s41586-025-0812-4",
      abstract: "Demonstrating sub-picosecond exciton energy transfer in photosynthetic light-harvesting complexes using multidimensional electronic spectroscopy."
    },
    {
      id: 1,
      title: "RAG Systems for High-Dimensional Vector Search",
      author: "Prof. Marcus Vance (2026)",
      journal: "IEEE Trans. Neural Networks • Q1",
      citations: 512,
      trustScore: 98.9,
      doi: "10.1109/TNNLS.2026.31415",
      abstract: "Sub-millisecond retrieval-augmented generation over 10M+ embedded scientific papers using HNSW vector graphs."
    },
    {
      id: 2,
      title: "CRISPR-Cas14 Precision Genome Editing",
      author: "Dr. Sarah Chen et al. (2025)",
      journal: "Cell Biotechnology • Q1",
      citations: 689,
      trustScore: 99.4,
      doi: "10.1016/j.cell.2025.11.002",
      abstract: "High-fidelity single-stranded DNA cleavage with zero off-target mutations in eukaryotic cell lines."
    }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-[#0A192F] text-white rounded-[40px] border border-white/20 shadow-2xl my-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-secondary/30 text-secondary-100 border border-secondary/50 text-xs font-mono font-black uppercase tracking-widest mb-4 inline-block shadow-md">
            Neo4j Trust-Rank Engine
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-black mb-4 text-white">
            Interactive Citation Graph Lineage
          </h2>
          <p className="text-primary-100 text-base md:text-lg font-medium">
            Track paper influence, co-authorship networks, and citation credibility in real time with graph neural networks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Interactive Graph Node List */}
          <div className="lg:col-span-5 space-y-4">
            {nodes.map((node, i) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(i)}
                className={`p-6 rounded-2xl cursor-pointer transition-all border ${
                  selectedNode === i
                    ? "bg-[#12294B] border-secondary shadow-2xl ring-2 ring-secondary/60"
                    : "bg-[#0D1F3C] border-white/10 hover:bg-[#12294B]"
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-primary-700 text-white text-[10px] font-mono font-bold uppercase">
                    {node.journal}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Zap size={13} /> {node.trustScore}% TrustRank
                  </span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mb-1">{node.title}</h4>
                <p className="text-xs text-primary-200 font-mono mb-3">{node.author}</p>
                <div className="flex items-center justify-between text-xs text-primary-200 font-medium">
                  <span>{node.citations} Direct Citations</span>
                  <span className="text-secondary-300 font-bold flex items-center gap-1">
                    View Network <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Graph Visualizer Panel */}
          <div className="lg:col-span-7 bg-[#12294B] p-8 rounded-3xl border border-white/20 relative min-h-[420px] flex flex-col justify-between shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-white/15">
              <div className="flex items-center gap-2">
                <Network className="text-secondary-300" size={20} />
                <span className="text-sm font-mono font-bold uppercase text-white">Citation Mesh Topology</span>
              </div>
              <span className="text-xs font-mono text-primary-200 font-bold">DOI: {nodes[selectedNode].doi}</span>
            </div>

            <div className="my-6 space-y-4">
              <h3 className="text-2xl font-serif font-bold text-white">
                {nodes[selectedNode].title}
              </h3>
              <p className="text-primary-100 text-sm leading-relaxed font-medium bg-[#0A192F] p-4 rounded-xl border border-white/10">
                "{nodes[selectedNode].abstract}"
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/15">
                <div className="bg-[#0A192F] p-4 rounded-xl text-center border border-white/10">
                  <div className="text-[10px] text-primary-200 font-mono uppercase font-bold">Citations</div>
                  <div className="text-2xl font-bold text-white mt-1">{nodes[selectedNode].citations}</div>
                </div>
                <div className="bg-[#0A192F] p-4 rounded-xl text-center border border-white/10">
                  <div className="text-[10px] text-primary-200 font-mono uppercase font-bold">Trust Score</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{nodes[selectedNode].trustScore}%</div>
                </div>
                <div className="bg-[#0A192F] p-4 rounded-xl text-center border border-white/10">
                  <div className="text-[10px] text-primary-200 font-mono uppercase font-bold">Node Depth</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">Level 4</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/15 text-xs font-mono text-primary-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Verified by Crossref & ORCID
              </span>
              <span className="text-secondary-300 font-bold">Neo4j Graph Database Connected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
