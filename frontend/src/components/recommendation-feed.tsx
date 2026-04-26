import React from "react";
import { CollaboratorCard } from "./collaborator-card";

export function RecommendationFeed() {
  const MOCK_RECOMMENDATIONS = [
    { name: "Dr. Alice Smith", institution: "MIT", similarityScore: 94, publications: 42 },
    { name: "Prof. John Doe", institution: "Stanford University", similarityScore: 88, publications: 112 },
    { name: "Elena Rostova", institution: "ETH Zurich", similarityScore: 85, publications: 19 },
    { name: "Dr. David Chen", institution: "University of Toronto", similarityScore: 81, publications: 67 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">Recommended Collaborators</h2>
        <span className="text-sm text-slate-500">{MOCK_RECOMMENDATIONS.length} matches found</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_RECOMMENDATIONS.map((rec, i) => (
          <CollaboratorCard key={i} {...rec} />
        ))}
      </div>
    </div>
  );
}
