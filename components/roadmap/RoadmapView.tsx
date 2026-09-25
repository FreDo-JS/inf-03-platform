"use client";

import { useCallback, useMemo, useState } from "react";
import { teacherNames } from "@/components/TeacherMark";
import { ChevronRight } from "lucide-react";
import { LiveBadge } from "@/components/LiveBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useRealtimeLinks } from "@/lib/hooks/useRealtimeLinks";
import { progressKey, useRealtimeProgress } from "@/lib/hooks/useRealtimeProgress";
import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import {
  CLASS_QUALIFICATION,
  QUALIFICATION_FULL,
  QUALIFICATION_LABEL,
  type CategoryRow,
  type ProgressRow,
  type SubtopicLinkRow,
  type SubtopicRow,
  type TeacherRow,
} from "@/types/db";
import { CategoryModal } from "./CategoryModal";

type Props = {
  categories: CategoryRow[];
  subtopics: SubtopicRow[];
  initialProgress: (Pick<ProgressRow, "class_name" | "subtopic_id"> & { marked_by: string | null })[];
  initialLinks: SubtopicLinkRow[];
  teachers: TeacherRow[];
};

export function RoadmapView({ categories, subtopics, initialProgress, initialLinks, teachers }: Props) {
  const [cls] = useSelectedClass();
  const { done, authors, status } = useRealtimeProgress(initialProgress);
  const names = useMemo(() => teacherNames(teachers), [teachers]);
  const { bySubtopic } = useRealtimeLinks(initialLinks);
  const [openId, setOpenId] = useState<string | null>(null);
  const closeModal = useCallback(() => setOpenId(null), []);

  // Klasa wyznacza kwalifikację, a kwalifikacja — zestaw kategorii i podtematów.
  const qualification = CLASS_QUALIFICATION[cls];
  const shownCategories = useMemo(
    () => categories.filter((c) => c.qualification === qualification),
    [categories, qualification],
  );
  const shownSubtopics = useMemo(() => {
    const ids = new Set(shownCategories.map((c) => c.id));
    return subtopics.filter((s) => ids.has(s.category_id));
  }, [subtopics, shownCategories]);

  const byCategory = useMemo(() => {
    const m = new Map<string, SubtopicRow[]>();
    for (const s of subtopics) {
      const list = m.get(s.category_id) ?? [];
      list.push(s);
      m.set(s.category_id, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.position - b.position);
    return m;
  }, [subtopics]);

  const totalDone = shownSubtopics.filter((s) => done.has(progressKey(cls, s.id))).length;
  const openIndex = shownCategories.findIndex((c) => c.id === openId);
  const openCategory = openIndex >= 0 ? shownCategories[openIndex] : undefined;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="page-title">Mapa nauki</h1>
          <p className="text-sm text-muted">
            klasa <span className="font-mono text-fg">{cls}</span> ·{" "}
            <span className="font-mono">{QUALIFICATION_LABEL[qualification]}</span>
          </p>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          {QUALIFICATION_FULL[qualification]}. Wybierz kategorię, aby zobaczyć podtematy i materiały.
        </p>

        <div className="card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title">Postęp klasy {cls}</h2>
            <LiveBadge status={status} />
          </div>
          <ProgressBar value={totalDone} max={shownSubtopics.length} label="ukończone podtematy" />
        </div>
      </section>

      {shownCategories.length === 0 ? (
        <p className="card p-6 text-muted">
          Brak kategorii dla tej kwalifikacji. Zainicjuj bazę plikami z katalogu supabase/.
        </p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shownCategories.map((c, i) => {
            const subs = byCategory.get(c.id) ?? [];
            const n = subs.filter((s) => done.has(progressKey(cls, s.id))).length;
            const complete = subs.length > 0 && n === subs.length;
            const started = n > 0;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className={`card-interactive group flex h-full w-full flex-col p-4 text-left ${
                    complete ? "border-accent/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md border font-mono text-xs font-semibold ${
                        complete ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`chip ${
                        complete ? "border-accent/40 text-accent" : started ? "border-accent2/30 text-accent2" : ""
                      }`}
                    >
                      {complete ? "ukończone" : started ? "w trakcie" : "do zrobienia"}
                    </span>
                  </div>
                  <h2 className="mt-3 font-semibold leading-snug transition-colors group-hover:text-accent">
                    {c.title}
                  </h2>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{c.description}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar value={n} max={subs.length} size="sm" />
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {n}/{subs.length}
                    </span>
                    <ChevronRight size={15} className="shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden />
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {openCategory && (
        <CategoryModal
          index={openIndex + 1}
          category={openCategory}
          subtopics={byCategory.get(openCategory.id) ?? []}
          isDone={(id) => done.has(progressKey(cls, id))}
          markedBy={(id) => {
            const who = authors.get(progressKey(cls, id));
            return who === undefined ? null : (names.get(who) ?? null);
          }}
          linksBySubtopic={bySubtopic}
          className={cls}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
