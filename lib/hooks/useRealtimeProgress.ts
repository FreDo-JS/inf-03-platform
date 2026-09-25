"use client";

import { useEffect, useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isClassName, isSubtopicId } from "@/lib/validation";
import type { ClassName, ProgressRow } from "@/types/db";

export type LiveStatus = "connecting" | "live" | "offline";

export const progressKey = (cls: ClassName, subtopicId: string) => `${cls}|${subtopicId}`;

export type ProgressInput = Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by?: string | null };

function toKeys(rows: readonly ProgressInput[]): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    if (isClassName(r.class_name) && isSubtopicId(r.subtopic_id)) s.add(progressKey(r.class_name, r.subtopic_id));
  }
  return s;
}

/** Mapa „który wpis czyją ręką” — klucz postępu → identyfikator nauczyciela. */
function toAuthors(rows: readonly ProgressInput[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    if (!isClassName(r.class_name) || !isSubtopicId(r.subtopic_id)) continue;
    if (typeof r.marked_by === "string" && r.marked_by !== "") m.set(progressKey(r.class_name, r.subtopic_id), r.marked_by);
  }
  return m;
}

function rowAuthor(rec: unknown): string | null {
  if (typeof rec !== "object" || rec === null) return null;
  const { marked_by } = rec as Record<string, unknown>;
  return typeof marked_by === "string" && marked_by !== "" ? marked_by : null;
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
export function useRealtimeProgress(initial: readonly ProgressInput[]) {
  const [done, setDone] = useState<Set<string>>(() => toKeys(initial));
  const [authors, setAuthors] = useState<Map<string, string>>(() => toAuthors(initial));
  const [status, setStatus] = useState<LiveStatus>("connecting");
  // unikalna nazwa kanału na instancję — dwa komponenty nie mogą dzielić tematu
  const channelId = useId();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    // Po (ponownym) połączeniu dociągamy pełny stan — nie gubimy zmian
    // z okresu między renderem serwerowym a subskrypcją / po zerwaniu połączenia.
    const refetch = async () => {
      const { data, error } = await supabase.from("progress").select("class_name, subtopic_id, marked_by");
      if (!cancelled && !error && data) {
        setDone(toKeys(data));
        setAuthors(toAuthors(data));
      }
    };

    const channel = supabase
      .channel(`progress-live:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "progress" }, (payload) => {
        const removed = payload.eventType === "DELETE";
        const key = removed ? rowKey(payload.old) : rowKey(payload.new);
        setDone((prev) => {
          const next = new Set(prev);
          if (key) {
            if (removed) next.delete(key);
            else next.add(key);
          }
          return next;
        });
        setAuthors((prev) => {
          if (!key) return prev;
          const next = new Map(prev);
          const author = removed ? null : rowAuthor(payload.new);
          if (author === null) next.delete(key);
          else next.set(key, author);
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
  }, [channelId]);

  return { done, setDone, authors, setAuthors, status };
}
