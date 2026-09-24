"use client";

import { useCallback, useMemo, useState } from "react";
import { ClassTabs } from "@/components/ClassTabs";
import { teacherNames } from "@/components/TeacherMark";
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
  const [cls, setCls] = useSelectedClass();
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
      <section className="animate-fade-up space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="eyebrow">{`// kwalifikacja ${QUALIFICATION_LABEL[qualification]}`}</p>
            <h1 className="page-title mt-2">
              Mapa <span className="text-gradient">nauki</span>
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {QUALIFICATION_FULL[qualification]}. Kliknij kafelek, aby zobaczyć podtematy i materiały.
            </p>
          </div>
          <ClassTabs value={cls} onChange={setCls} />
        </div>

        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-sm font-semibold">
              Postęp klasy <span className="text-accent">{cls}</span>
            </h2>
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
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shownCategories.map((c, i) => {
            const subs = byCategory.get(c.id) ?? [];
            const n = subs.filter((s) => done.has(progressKey(cls, s.id))).length;
            const complete = subs.length > 0 && n === subs.length;
            const started = n > 0;
            return (
              <li key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <button
                  type="button"
                  onClick={() => setOpenId(c.id)}
                  className={`card-interactive group flex h-full w-full flex-col p-5 text-left ${
                    complete ? "border-accent/40 bg-accent/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold ${
                        complete
                          ? "bg-gradient-to-br from-accent to-accent2 text-bg"
                          : "border border-line bg-white/[0.03] text-accent"
                      }`}
                    >
                      {complete ? "✓" : String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`chip ${
                        complete ? "border-accent/40 text-accent" : started ? "border-accent2/30 text-accent2" : ""
                      }`}
                    >
                      {complete ? "ukończone" : started ? "w trakcie" : "do zrobienia"}
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-snug transition group-hover:text-accent">{c.title}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{c.description}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar value={n} max={subs.length} size="sm" />
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {n}/{subs.length}
                    </span>
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
