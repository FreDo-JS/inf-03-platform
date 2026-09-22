"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isClassName, isSubtopicId } from "@/lib/validation";
import type { ClassName, ProgressRow } from "@/types/db";

export type LiveStatus = "connecting" | "live" | "offline";

export const progressKey = (cls: ClassName, subtopicId: string) => `${cls}|${subtopicId}`;

function toKeys(rows: readonly Pick<ProgressRow, "class_name" | "subtopic_id">[]): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    if (isClassName(r.class_name) && isSubtopicId(r.subtopic_id)) s.add(progressKey(r.class_name, r.subtopic_id));
  }
  return s;
}

function rowKey(rec: unknown): string | null {
  if (typeof rec !== "object" || rec === null) return null;
  const { class_name, subtopic_id } = rec as Record<string, unknown>;
  return isClassName(class_name) && isSubtopicId(subtopic_id) ? progressKey(class_name, subtopic_id) : null;
}

/**
 * Stan ukończonych podtematów wszystkich klas, aktualizowany na żywo przez
 * Supabase Realtime (postgres_changes na tabeli progress).
 */
export function useRealtimeProgress(initial: readonly Pick<ProgressRow, "class_name" | "subtopic_id">[]) {
  const [done, setDone] = useState<Set<string>>(() => toKeys(initial));
  const [status, setStatus] = useState<LiveStatus>("connecting");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    // Po (ponownym) połączeniu dociągamy pełny stan — nie gubimy zmian
    // z okresu między renderem serwerowym a subskrypcją / po zerwaniu połączenia.
    const refetch = async () => {
      const { data, error } = await supabase.from("progress").select("class_name, subtopic_id");
      if (!cancelled && !error && data) setDone(toKeys(data));
    };

    const channel = supabase
      .channel("progress-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, (payload) => {
        setDone((prev) => {
          const next = new Set(prev);
          if (payload.eventType === "DELETE") {
            const k = rowKey(payload.old);
            if (k) next.delete(k);
          } else {
            const k = rowKey(payload.new);
            if (k) next.add(k);
          }
          return next;
        });
      })
      .subscribe((s) => {
        if (cancelled) return;
        if (s === "SUBSCRIBED") {
          setStatus("live");
          void refetch();
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { done, setDone, status };
}
