"use client";

import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { SearchBar } from "@/components/search-bar";
import { FilterSidebar } from "@/components/filter-sidebar";
import { RecommendationFeed } from "@/components/recommendation-feed";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

const matchUserInterestsToSidebarDomains = (interests: any[]): string[] => {
  if (!Array.isArray(interests)) return [];
  const selected: string[] = [];
  const lowercaseInterests = interests
    .filter(i => typeof i === 'string')
    .map((i: string) => i.toLowerCase().trim());
  
  // AI & ML
  const aiMlKeywords = ["machine learning", "artificial intelligence", "data science & ai", "ethics in ai", "ai & ml"];
  const hasAiMl = lowercaseInterests.some(interest => 
    interest === "ai" || interest === "ml" ||
    aiMlKeywords.some(keyword => interest === keyword || interest.includes(keyword))
  );
  if (hasAiMl) selected.push("AI & ML");

  // Bioinformatics
  const hasBioinformatics = lowercaseInterests.some(interest => 
    interest === "bioinformatics" || interest.includes("bioinformatics")
  );
  if (hasBioinformatics) selected.push("Bioinformatics");

  // Quantum Computing
  const hasQuantum = lowercaseInterests.some(interest => 
    interest === "quantum" || interest.includes("quantum")
  );
  if (hasQuantum) selected.push("Quantum Computing");

  // Robotics
  const hasRobotics = lowercaseInterests.some(interest => 
    interest === "robotics" || interest.includes("robotics") || 
    interest === "iot" || interest.includes("iot")
  );
  if (hasRobotics) selected.push("Robotics");

  return selected;
};

export default function DiscoveryPage() {
  const { token } = useAuth();
  const [selectedDomains, setSelectedDomains] = React.useState<string[]>([]);
  const [userMatchedDomains, setUserMatchedDomains] = React.useState<string[]>([]);
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);
  const [institutionSearch, setInstitutionSearch] = React.useState("");

  React.useEffect(() => {
    const fetchUserInterests = async () => {
      try {
        const res = await fetch(API.onboarding.userInterests, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data && json.data.interests) {
          const matchedDomains = matchUserInterestsToSidebarDomains(json.data.interests);
          setUserMatchedDomains(matchedDomains);
        }
      } catch (err) {
        console.error("Failed to fetch user interests for filtering:", err);
      }
    };
    if (token) {
      fetchUserInterests();
    }
  }, [token]);

  const handleDomainChange = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

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
          <FilterSidebar 
            selectedDomains={selectedDomains}
            onDomainChange={handleDomainChange}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            institutionSearch={institutionSearch}
            onInstitutionChange={setInstitutionSearch}
            userMatchedDomains={userMatchedDomains}
          />
          
          <main className="flex-1 min-w-0">
            <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading recommendations...</div>}>
              <RecommendationFeed filters={{
                domains: selectedDomains,
                tier: selectedTier,
                institution: institutionSearch
              }} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
