"use client";

import React from "react";

export const SkeletonAnswerCard = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-xl animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
          </div>
        </div>
        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-900">
        <div className="flex items-center gap-6">
          <div className="h-9 w-24 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700"></div>
          <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
      </div>
    </div>
  );
};
