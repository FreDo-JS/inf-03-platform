"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { LINK_COLUMNS, sortLinks } from "@/lib/links";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { SubtopicLinkRow } from "@/types/db";

/**
 * Wszystkie materiały (linki) podtematów, odświeżane na żywo przez Supabase
 * Realtime. Linków jest niewiele, więc trzymamy je w całości — popup otwiera
 * się natychmiast, a zmiany admina widać bez odświeżania strony.
 */
export function useRealtimeLinks(initial: readonly SubtopicLinkRow[]) {
  const [links, setLinks] = useState<SubtopicLinkRow[]>(() => sortLinks(initial));
  // unikalna nazwa kanału na instancję — dwa komponenty nie mogą dzielić tematu
  const channelId = useId();

  const refetch = useCallback(async () => {
    const { data, error } = await getBrowserSupabase().from("subtopic_links").select(LINK_COLUMNS);
    if (!error && data) setLinks(sortLinks(data));
    return { ok: !error };
  }, []);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    const reload = async () => {
      const { data, error } = await supabase.from("subtopic_links").select(LINK_COLUMNS);
      if (!cancelled && !error && data) setLinks(sortLinks(data));
    };

    const channel = supabase
      .channel(`subtopic-links-live:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subtopic_links" }, () => void reload())
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void reload();
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [channelId]);

  /** Linki pogrupowane po subtopic_id, już posortowane. */
  const bySubtopic = useMemo(() => {
    const m = new Map<string, SubtopicLinkRow[]>();
    for (const l of links) m.set(l.subtopic_id, [...(m.get(l.subtopic_id) ?? []), l]);
    return m;
  }, [links]);

  return { links, bySubtopic, setLinks, refetch };
}
