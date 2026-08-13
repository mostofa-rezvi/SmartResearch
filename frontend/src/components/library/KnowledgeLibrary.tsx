"use client";

import React, { useState } from "react";
import { LibraryItemForm } from "./LibraryItemForm";
import { LibraryItemList } from "./LibraryItemList";
import { LibrarySemanticSearch } from "./LibrarySemanticSearch";
import { LibraryDiscover } from "./LibraryDiscover";

/**
 * Knowledge Library items experience (proposal Module 4).
 * "My Library" (create + semantic search + own items) and "Discover" (shared
 * content across all users). Wired to /api/v1/library/{items,search,discover}.
 */
export default function KnowledgeLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<"mine" | "discover">("mine");

  return (
    <div className="space-y-6">
      <div className="inline-flex neu-inset p-1">
        {(["mine", "discover"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t ? "neu-btn text-primary dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t === "mine" ? "My Library" : "Discover"}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LibraryItemForm onCreated={() => setRefreshKey((k) => k + 1)} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <LibrarySemanticSearch />
            <LibraryItemList refreshKey={refreshKey} />
          </div>
        </div>
      ) : (
        <LibraryDiscover />
      )}
    </div>
  );
}
