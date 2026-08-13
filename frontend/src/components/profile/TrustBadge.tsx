"use client";

import React from "react";
import { ShieldCheck, BadgeCheck } from "lucide-react";

export type TrustTier = "unverified" | "basic" | "verified" | "professor";

const TIER_CONFIG: Record<TrustTier, { label: string; className: string }> = {
  unverified: { label: "Unverified", className: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  basic: { label: "Basic", className: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800/50" },
  verified: { label: "Verified", className: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50" },
  professor: { label: "Professor", className: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50" },
};

interface TrustBadgeProps {
  tier?: TrustTier | string | null;
  institutionVerified?: boolean;
  className?: string;
}

/**
 * Renders a trust-tier chip (tier → color/label) with an institution-verified
 * checkmark when applicable. Falls back to "unverified" for unknown tiers.
 */
const TrustBadge: React.FC<TrustBadgeProps> = ({ tier, institutionVerified, className = "" }) => {
  const config = TIER_CONFIG[(tier as TrustTier)] || TIER_CONFIG.unverified;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${config.className} ${className}`}
    >
      <ShieldCheck size={13} />
      {config.label} Tier
      {institutionVerified && (
        <span
          title="Institution Verified"
          className="inline-flex items-center gap-0.5 text-emerald-600"
        >
          <BadgeCheck size={13} />
        </span>
      )}
    </span>
  );
};

export default TrustBadge;
