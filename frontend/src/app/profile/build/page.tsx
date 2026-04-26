"use client";

import React, { useState } from "react";
import { SkillsTag } from "@/components/skills-tag";
import { DomainSelect } from "@/components/domain-select";
import { PaperUpload } from "@/components/paper-upload";

export default function ProfileBuilderPage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [paper, setPaper] = useState<File | null>(null);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submission logic here
    console.log({ skills, domains, bio, paper });
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Build Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            rows={4}
            placeholder="Tell us about your research background..."
          />
        </div>

        <DomainSelect selectedDomains={domains} onChange={setDomains} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Skills & Methodologies</label>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
            placeholder="Type a skill and press Enter"
            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          />
          <div className="pt-2">
            <SkillsTag skills={skills} onRemove={handleRemoveSkill} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Upload Featured Paper</label>
          <PaperUpload onUpload={(file) => setPaper(file)} />
          {paper && <p className="text-sm text-emerald-600 mt-2">Selected: {paper.name}</p>}
        </div>

        <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-2xl">
          Complete Profile
        </button>

      </form>
    </div>
  );
}
