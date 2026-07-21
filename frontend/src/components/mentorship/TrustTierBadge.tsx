"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface TrustTierBadgeProps {
  tier?: string | null;
  className?: string;
}

// Maps a trust tier (Gold / Silver / Bronze, case-insensitive) to a Tailwind style.
const TIER_STYLES: Record<string, string> = {
  gold: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  silver: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
  bronze: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
};

export function TrustTierBadge({ tier, className = "" }: TrustTierBadgeProps) {
  if (!tier) return null;
  const key = tier.toLowerCase();
  const style = TIER_STYLES[key] || TIER_STYLES.bronze;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${style} ${className}`}
    >
      <ShieldCheck size={12} />
      {tier}
    </span>
  );
}
