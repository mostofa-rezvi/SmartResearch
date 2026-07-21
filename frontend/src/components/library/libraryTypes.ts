// Shared types & metadata for the Knowledge Library items UI (proposal Module 4).

export interface LibraryItem {
  id: string | number;
  item_type: string;
  title: string;
  abstract?: string | null;
  authors?: string | null;
  doi?: string | null;
  tags?: string[] | null;
  file_url?: string | null;
  created_at?: string;
}

export interface LibrarySearchResult {
  id: string | number;
  _score?: number;
  title: string;
  abstract?: string | null;
  authors?: string | null;
  tags?: string[] | null;
}

export const ITEM_TYPE_ORDER = ["paper", "dataset", "note", "literature_review"] as const;
export type ItemType = (typeof ITEM_TYPE_ORDER)[number];

export const ITEM_TYPE_META: Record<string, { label: string; badge: string; accent: string }> = {
  paper: {
    label: "Paper",
    badge: "bg-primary/10 text-primary border-primary/20",
    accent: "border-l-primary",
  },
  dataset: {
    label: "Dataset",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    accent: "border-l-emerald-500",
  },
  note: {
    label: "Note",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    accent: "border-l-amber-500",
  },
  literature_review: {
    label: "Literature Review",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    accent: "border-l-violet-500",
  },
};

export function typeLabel(type: string): string {
  return ITEM_TYPE_META[type]?.label ?? type;
}
