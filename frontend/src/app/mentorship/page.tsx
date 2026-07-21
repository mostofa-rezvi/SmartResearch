"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { RecommendedMentors } from "@/components/mentorship/RecommendedMentors";
import { OpenSlots } from "@/components/mentorship/OpenSlots";
import { CreateSlotForm } from "@/components/mentorship/CreateSlotForm";
import { MyMentorships } from "@/components/mentorship/MyMentorships";
import { Sparkles, Compass, PlusCircle, Handshake } from "lucide-react";

type Tab = "recommended" | "slots" | "create" | "my";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "recommended", label: "Recommended", icon: <Sparkles size={16} /> },
  { key: "slots", label: "Open Slots", icon: <Compass size={16} /> },
  { key: "create", label: "Offer Mentorship", icon: <PlusCircle size={16} /> },
  { key: "my", label: "My Mentorships", icon: <Handshake size={16} /> },
];

export default function MentorshipPage() {
  const [tab, setTab] = useState<Tab>("recommended");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617]">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-black mb-4 text-primary dark:text-white">
            Mentorship
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg">
            Find mentors matched to your interests, browse open slots, offer your own guidance, and
            manage sessions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === "recommended" && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-4">
              Recommended Mentors
            </h2>
            <RecommendedMentors />
          </section>
        )}

        {tab === "slots" && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-4">
              Open Mentorship Slots
            </h2>
            <OpenSlots />
          </section>
        )}

        {tab === "create" && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-4">
              Offer Mentorship
            </h2>
            <CreateSlotForm />
          </section>
        )}

        {tab === "my" && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white mb-4">
              My Mentorships & Sessions
            </h2>
            <MyMentorships />
          </section>
        )}
      </div>
    </div>
  );
}
