'use client';
import React, { useState, useEffect } from 'react';
import { JournalRecommender } from '@/components/journal/JournalRecommender';
import { PublicationChecklist } from '@/components/publication/PublicationChecklist';

export default function PublicationPage() {
  const [data, setData] = useState({ journals: [], checklist: [], templates: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [jRes, cRes] = await Promise.all([
        fetch('/api/journals?topic=AI&domain=ComputerScience'),
        fetch('/api/checklist')
      ]);
      const journals = await jRes.json();
      const { checklist, templates } = await cRes.json();
      
      setData({ journals, checklist, templates });
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16">
      <section>
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Journal Recommender</h1>
          <p className="text-gray-500">AI-powered suggestions based on DOAJ and Scimago data</p>
        </header>
        {loading ? <p>Loading journals...</p> : <JournalRecommender journals={data.journals} />}
      </section>

      <section className="bg-gray-50 -mx-4 px-4 py-16 rounded-[2rem] border">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">Publication Assistant</h1>
            <p className="text-gray-500">Track your progress and access canonical templates</p>
          </header>
          {loading ? <p>Loading checklist...</p> : (
            <PublicationChecklist checklist={data.checklist} templates={data.templates} />
          )}
        </div>
      </section>
    </div>
  );
}
