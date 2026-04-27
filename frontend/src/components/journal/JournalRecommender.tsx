import React from 'react';

export const JournalRecommender = ({ journals }: { journals: any[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {journals.map(journal => (
        <div key={journal.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-2">{journal.title}</h3>
          <p className="text-sm text-gray-600 mb-4">Topic: {journal.topic}</p>
          <div className="flex justify-between items-center">
            <span className="text-blue-600 font-medium">Impact: {journal.impactFactor}</span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Score: {journal.relevance}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
