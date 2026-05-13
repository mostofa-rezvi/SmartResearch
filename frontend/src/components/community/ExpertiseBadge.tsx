"use client";

import React from "react";
import { ShieldCheck, Award, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface ExpertiseBadgeProps {
  field: string;
  score: number;
  level?: "expert" | "senior" | "contributor";
}

export const ExpertiseBadge: React.FC<ExpertiseBadgeProps> = ({ field, score, level = "contributor" }) => {
  const getLevelConfig = () => {
    switch (level) {
      case "expert":
        return {
          icon: <ShieldCheck size={12} className="text-emerald-500" />,
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
          textColor: "text-emerald-700 dark:text-emerald-400",
          borderColor: "border-emerald-100 dark:border-emerald-800",
          label: "Expert"
        };
      case "senior":
        return {
          icon: <Award size={12} className="text-blue-500" />,
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          textColor: "text-blue-700 dark:text-blue-400",
          borderColor: "border-blue-100 dark:border-blue-800",
          label: "Senior"
        };
      default:
        return {
          icon: <Zap size={12} className="text-amber-500" />,
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          textColor: "text-amber-700 dark:text-amber-400",
          borderColor: "border-amber-100 dark:border-amber-800",
          label: "Contributor"
        };
    }
  };

  const config = getLevelConfig();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor} shadow-sm`}
    >
      {config.icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {field} • {config.label} ({score})
      </span>
    </motion.div>
  );
};

export const ReputationScore: React.FC<{ score: number }> = ({ score }) => {
  return (
    <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
      <Star size={12} className="text-amber-400 fill-amber-400" />
      <span>{score.toLocaleString()} Impact</span>
    </div>
  );
};
