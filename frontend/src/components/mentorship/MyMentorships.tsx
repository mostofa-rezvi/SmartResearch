"use client";

import React, { useEffect, useState } from "react";
import { useApi, useAuth } from "@/context/AuthContext";
import { API } from "@/config/api";
import { Loader2, Handshake } from "lucide-react";
import { SessionsPanel } from "./SessionsPanel";

interface Mentorship {
  id: number;
  mentor_id: number;
  mentee_id: number;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at?: string;
  mentor_name: string;
  mentor_avatar?: string;
  mentee_name: string;
  mentee_avatar?: string;
}

export function MyMentorships() {
  const { fetchWithAuth } = useApi();
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(API.mentorship.my);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMentorships(json.data);
        }
      } catch (err) {
        console.error("Failed to load mentorships:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user, fetchWithAuth]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin h-7 w-7 text-primary" />
      </div>
    );
  }

  const accepted = mentorships.filter((m) => m.status === "accepted");

  if (accepted.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-500">
        No active mentorships yet. Once a request is accepted, you can schedule sessions here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accepted.map((m) => {
        const isMentor = user?.id?.toString() === m.mentor_id?.toString();
        const counterpart = isMentor
          ? { name: m.mentee_name, role: "Mentee" }
          : { name: m.mentor_name, role: "Mentor" };

        return (
          <div
            key={m.id}
            className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Handshake size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {counterpart.name}{" "}
                  <span className="text-xs font-normal text-slate-400">({counterpart.role})</span>
                </h4>
                <span className="text-xs font-semibold text-emerald-600">Active mentorship</span>
              </div>
            </div>

            <SessionsPanel mentorshipId={m.id} />
          </div>
        );
      })}
    </div>
  );
}
