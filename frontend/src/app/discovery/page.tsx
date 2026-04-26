"use client";

import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/search-bar";
import { FilterSidebar } from "@/components/filter-sidebar";
import { RecommendationFeed } from "@/components/recommendation-feed";

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-black mb-6 text-primary dark:text-white">Discovery Dashboard</h1>
          <p className="text-slate-500 max-w-2xl mb-10 text-lg">
            Find peers, discover trending research, and build your collaborative network.
          </p>
          <SearchBar />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <FilterSidebar />
          
          <main className="flex-1 min-w-0">
            <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading recommendations...</div>}>
              <RecommendationFeed />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
