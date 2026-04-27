'use client';
import React, { useState, useEffect } from 'react';
import { ForumThread } from '@/components/forum/ForumThread';

export default function ForumPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forum')
      .then(res => res.json())
      .then(data => {
        setThreads(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Community Forum</h1>
          <p className="text-gray-500">Ranked by TrustRank • Moderated by community reputation</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          New Thread
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading threads...</div>
      ) : (
        <div className="space-y-8">
          {threads.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
              <p className="text-gray-500">No threads found in your domain.</p>
            </div>
          ) : (
            threads.map((thread: any) => (
              <ForumThread key={thread.id} thread={thread} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
