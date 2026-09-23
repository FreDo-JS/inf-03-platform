import type { SubtopicLinkRow } from "@/types/db";

// Moduł bez "use client" — używany i na serwerze (app/roadmap/page.tsx),
// i w przeglądarce (useRealtimeLinks). Stała wyeksportowana z modułu
// klienckiego trafiłaby do Server Component jako referencja, nie jako napis.
export const LINK_COLUMNS = "id, subtopic_id, label, url, sort_order, created_at" as const;

export function sortLinks(rows: readonly SubtopicLinkRow[]): SubtopicLinkRow[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}
