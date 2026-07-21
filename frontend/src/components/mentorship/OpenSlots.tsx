"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, Search, Users, CalendarClock } from "lucide-react";
import Image from "next/image";
import { TrustTierBadge } from "./TrustTierBadge";

interface Slot {
  id: number;
  domain: string;
  title: string;
  capacity: number;
  taken: number;
  availability?: string;
  mentor_name: string;
  mentor_avatar?: string;
  trust_tier?: string;
}

export function OpenSlots() {
  const { fetchWithAuth } = useApi();
  const { token } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(
    async (domainFilter: string) => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(API.mentorship.slotsByDomain(domainFilter));
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSlots(json.data);
        }
      } catch (err) {
        console.error("Failed to load open slots:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  useEffect(() => {
    if (token) load(domain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDomain(query.trim());
    load(query.trim());
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by domain (e.g. Machine Learning)"
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg"
        >
          Filter
        </button>
        {domain && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDomain("");
              load("");
            }}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin h-7 w-7 text-primary" />
        </div>
      ) : slots.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500">
          No open slots{domain ? ` for "${domain}"` : ""} right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot) => {
            const full = slot.taken >= slot.capacity;
            return (
              <div
                key={slot.id}
                className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {slot.mentor_avatar ? (
                    <Image
                      src={slot.mentor_avatar}
                      alt={slot.mentor_name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shrink-0">
                      {slot.mentor_name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900 dark:text-white truncate">{slot.mentor_name}</span>
                      <TrustTierBadge tier={slot.trust_tier} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{slot.title}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {slot.domain}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} />
                    <span className={full ? "text-red-500 font-semibold" : "font-semibold"}>
                      {slot.taken}/{slot.capacity} taken
                    </span>
                  </span>
                  {slot.availability && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock size={14} /> {slot.availability}
                    </span>
                  )}
                  {full && (
                    <span className="ml-auto text-[11px] font-bold uppercase text-red-500">Full</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
