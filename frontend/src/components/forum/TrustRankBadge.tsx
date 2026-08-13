import React from 'react';

export const TrustRankBadge = ({ rank }: { rank: number }) => {
  const getBadgeColor = () => {
    if (rank >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50'; // Gold
    if (rank >= 50) return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'; // Silver
    return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50'; // Bronze
  };

  return (
    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getBadgeColor()}`}>
      TR {rank}
    </span>
  );
};
