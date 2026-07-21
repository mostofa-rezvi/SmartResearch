"use client";

import React, { useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, PlusCircle, CheckCircle2 } from "lucide-react";

interface CreateSlotFormProps {
  onCreated?: () => void;
}

export function CreateSlotForm({ onCreated }: CreateSlotFormProps) {
  const { fetchWithAuth } = useApi();
  const [domain, setDomain] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState<number>(1);
  const [availability, setAvailability] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.mentorship.slots, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          capacity,
          availability: availability.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to create slot");
      }
      setSuccess(true);
      setDomain("");
      setTitle("");
      setDescription("");
      setCapacity(1);
      setAvailability("");
      onCreated?.();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 max-w-2xl"
    >
      <div className="flex items-center gap-2">
        <PlusCircle size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Offer a Mentorship Slot</h3>
      </div>
      <p className="text-sm text-slate-500">
        Publish an open slot so mentees can discover and request your mentorship.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold">
          <CheckCircle2 size={16} /> Slot created successfully.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
            Domain <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Machine Learning"
            className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
            Capacity
          </label>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Math.max(1, Number(e.target.value)))}
            className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Guidance on ML research careers"
          className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
          Availability
        </label>
        <input
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          placeholder="e.g. Weekday evenings, 2 sessions/month"
          className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What can mentees expect from this mentorship?"
          className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !domain.trim()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
        Create Slot
      </button>
    </form>
  );
}
