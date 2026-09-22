"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { TEST_SUMMARY_COLUMNS, pluralPytania, toSummaries, type TestSummary } from "@/lib/tests";

/** Lista testów odświeżana na żywo, gdy admin doda lub usunie test. */
export function TestsList({ initial }: { initial: TestSummary[] }) {
  const [tests, setTests] = useState(initial);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let cancelled = false;

    const refetch = async () => {
      const { data, error } = await supabase
        .from("tests")
        .select(TEST_SUMMARY_COLUMNS)
        .order("created_at", { ascending: false });
      if (!cancelled && !error && data) setTests(toSummaries(data));
    };

    // Payload zdarzenia ignorujemy — zawsze dociągamy listę (tylko kolumny publiczne).
    const channel = supabase
      .channel("tests-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => void refetch())
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void refetch();
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  if (tests.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl">🗂️</p>
        <p className="mt-3 text-muted">Nie ma jeszcze żadnych testów.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {tests.map((t, i) => (
        <li key={t.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <Link href={`/testy/${t.id}`} className="card-interactive group flex h-full flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-xl">
                📝
              </span>
              <span className="chip">🔒 PIN</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold leading-snug transition group-hover:text-accent">{t.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">
                {t.questionCount} {pluralPytania(t.questionCount)}
              </span>
              <span className="chip">⏱ {Math.round(t.timeLimitSec / 60)} min</span>
            </div>
            <div className="flex-1" />
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              Rozpocznij <span className="transition group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
