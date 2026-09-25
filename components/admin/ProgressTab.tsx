"use client";

import { useMemo, useState } from "react";
import { LiveBadge } from "@/components/LiveBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { friendlyError } from "@/lib/errors";
import { progressKey, useRealtimeProgress } from "@/lib/hooks/useRealtimeProgress";
import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { isClassName, isSubtopicId } from "@/lib/validation";
import { TeacherMark, teacherNames } from "@/components/TeacherMark";
import {
  CLASS_QUALIFICATION,
  type CategoryRow,
  type ClassName,
  type ProgressRow,
  type SubtopicRow,
  type TeacherRow,
} from "@/types/db";

type Props = {
  categories: CategoryRow[];
  teachers?: TeacherRow[];
  /** false, gdy baza nie zna jeszcze kolumny progress.marked_by (migracja 012) */
  authorColumn?: boolean;
  /** identyfikator zalogowanego nauczyciela — do podpisu „Ty” */
  myId?: string;
  subtopics: SubtopicRow[];
  initialProgress: (Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by: string | null })[];
};

export function ProgressTab({
  categories,
  subtopics,
  initialProgress,
  teachers = [],
  myId = "",
  authorColumn = true,
}: Props) {
  const [cls] = useSelectedClass();
  const { done, setDone, authors, setAuthors, status } = useRealtimeProgress(initialProgress);
  const names = useMemo(() => teacherNames(teachers), [teachers]);

  /** Podpis przy wpisie: nazwa autora, a przy własnych wpisach bez nazwy — „Ty”. */
  const signature = (key: string): string | null => {
    const who = authors.get(key);
    if (who === undefined) return null;
    return names.get(who) ?? (who === myId ? "Ty" : null);
  };
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
    // Optymistyczna aktualizacja. Autora dopisujemy od razu: baza i tak stempluje
    // wpis tożsamością z tokenu, więc wiemy, co tam wyląduje. Bez tego podpis
    // pojawiałby się dopiero po powiadomieniu z Realtime, a gdyby ono nie
    // działało — dopiero po odświeżeniu strony.
    const previousAuthor = authors.get(key);
    setDone((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(key);
      else next.add(key);
      return next;
    });
    setAuthors((prev) => {
      const next = new Map(prev);
      if (wasDone) next.delete(key);
      else if (myId !== "") next.set(key, myId);
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
      setAuthors((prev) => {
        const next = new Map(prev);
        if (previousAuthor === undefined) next.delete(key);
        else next.set(key, previousAuthor);
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

  // Liczymy w obrębie kwalifikacji wybranej klasy — inaczej 4a miałaby w mianowniku
  // także podtematy INF.03, których się nie uczy.
  const shownSubtopics = useMemo(() => {
    const ids = new Set(shownCategories.map((c) => c.id));
    return subtopics.filter((s) => ids.has(s.category_id));
  }, [subtopics, shownCategories]);
  const totalDone = shownSubtopics.filter((s) => done.has(progressKey(cls, s.id))).length;

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">Postęp klasy {cls}</h2>
          <LiveBadge status={status} />
        </div>
        <ProgressBar value={totalDone} max={shownSubtopics.length} label="ukończone podtematy" />
      </div>
      {!authorColumn && (
        <p className="alert-error">
          Baza nie ma jeszcze kolumny z autorem oznaczeń — przy tematach nie pojawi się, kto je odhaczył. Uruchom w
          Supabase migracje <span className="font-mono">012_progress_author.sql</span> i{" "}
          <span className="font-mono">013_progress_author_fix.sql</span>.
        </p>
      )}
      {authorColumn && myId !== "" && !names.has(myId) && (
        <p className="alert-ok">
          Ustaw swój podpis w polu u góry — bez niego przy odhaczonych tematach widnieje samo „oznaczone”.
        </p>
      )}
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {shownCategories.map((cat, i) => {
          const subs = byCategory.get(cat.id) ?? [];
          const n = subs.filter((s) => done.has(progressKey(cls, s.id))).length;
          return (
            <section key={cat.id} className="card p-4">
              <h2 className="flex items-baseline justify-between gap-2 text-[15px] font-semibold">
                <span>
                  <span className="mr-1.5 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {cat.title}
                </span>
                <span className="chip shrink-0">
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
                        <span className={`min-w-0 flex-1 text-[15px] leading-snug ${checked ? "text-fg" : "text-fg/70"}`}>
                          {s.title}
                        </span>
                        <TeacherMark done={checked} name={signature(key)} size="sm" />
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
