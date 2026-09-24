"use client";

import { useMemo, useState } from "react";
import { ClassTabs } from "@/components/ClassTabs";
import { LiveBadge } from "@/components/LiveBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { friendlyError } from "@/lib/errors";
import { progressKey, useRealtimeProgress } from "@/lib/hooks/useRealtimeProgress";
import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isClassName, isSubtopicId } from "@/lib/validation";
import { CLASS_QUALIFICATION, type CategoryRow, type ClassName, type ProgressRow, type SubtopicRow } from "@/types/db";

type Props = {
  categories: CategoryRow[];
  subtopics: SubtopicRow[];
  initialProgress: Pick<ProgressRow, "class_name" | "subtopic_id">[];
};

export function ProgressTab({ categories, subtopics, initialProgress }: Props) {
  const [cls, setCls] = useSelectedClass();
  const { done, setDone, status } = useRealtimeProgress(initialProgress);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const m = new Map<string, SubtopicRow[]>();
    for (const s of subtopics) m.set(s.category_id, [...(m.get(s.category_id) ?? []), s]);
    return m;
  }, [subtopics]);

  // Pokazujemy tylko kategorie kwalifikacji, której uczy się wybrana klasa.
  const shownCategories = useMemo(
    () => categories.filter((c) => c.qualification === CLASS_QUALIFICATION[cls]),
    [categories, cls],
  );

  const toggle = async (c: ClassName, subtopicId: string) => {
    // walidacja przed zapytaniem
    if (!isClassName(c) || !isSubtopicId(subtopicId)) return;
    const key = progressKey(c, subtopicId);
    if (pending.has(key)) return;
    const wasDone = done.has(key);

    setError(null);
    setPending((p) => new Set(p).add(key));
    // optymistyczna aktualizacja
    setDone((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(key);
      else next.add(key);
      return next;
    });

    const supabase = getBrowserSupabase();
    const { error: dbError } = wasDone
      ? await supabase.from("progress").delete().eq("class_name", c).eq("subtopic_id", subtopicId)
      : await supabase
          .from("progress")
          .upsert({ class_name: c, subtopic_id: subtopicId }, { onConflict: "class_name,subtopic_id", ignoreDuplicates: true });

    if (dbError) {
      // cofnięcie zmiany
      setDone((prev) => {
        const next = new Set(prev);
        if (wasDone) next.add(key);
        else next.delete(key);
        return next;
      });
      setError(friendlyError(dbError, "Nie udało się zapisać zmiany."));
    }
    setPending((p) => {
      const next = new Set(p);
      next.delete(key);
      return next;
    });
  };

  const totalDone = subtopics.filter((s) => done.has(progressKey(cls, s.id))).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ClassTabs value={cls} onChange={setCls} />
        <LiveBadge status={status} />
      </div>
      <div className="card p-5">
        <ProgressBar value={totalDone} max={subtopics.length} label={`klasa ${cls}`} />
      </div>
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {shownCategories.map((cat, i) => {
          const subs = byCategory.get(cat.id) ?? [];
          const n = subs.filter((s) => done.has(progressKey(cls, s.id))).length;
          return (
            <section key={cat.id} className="card p-5">
              <h2 className="flex items-baseline justify-between gap-2 font-semibold">
                <span>
                  <span className="mr-1.5 font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                  {cat.title}
                </span>
                <span className="chip">
                  {n}/{subs.length}
                </span>
              </h2>
              <ul className="mt-3 space-y-1">
                {subs.map((s) => {
                  const key = progressKey(cls, s.id);
                  const checked = done.has(key);
                  const busy = pending.has(key);
                  return (
                    <li key={s.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 transition hover:bg-white/[0.04] ${
                          busy ? "opacity-60" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 shrink-0 accent-[#2de2c1]"
                          checked={checked}
                          disabled={busy}
                          onChange={() => void toggle(cls, s.id)}
                        />
                        <span className={`text-[15px] leading-snug ${checked ? "text-fg" : "text-fg/70"}`}>{s.title}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
