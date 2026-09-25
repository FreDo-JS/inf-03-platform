"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { TEST_SUMMARY_COLUMNS, pluralPytania, toSummaries, type TestSummary } from "@/lib/tests";
import { useSelectedClass } from "@/lib/hooks/useSelectedClass";
import { CLASS_QUALIFICATION, QUALIFICATIONS, QUALIFICATION_LABEL, type Qualification } from "@/types/db";
import { ArrowRight, FileText, FolderOpen, Lock, Timer } from "lucide-react";

/** Lista testów odświeżana na żywo, gdy admin doda lub usunie test. */
export function TestsList({ initial }: { initial: TestSummary[] }) {
  const [tests, setTests] = useState(initial);
  const channelId = useId();
  // Domyślnie pokazujemy kwalifikację klasy zapamiętanej na mapie nauki,
  // ale uczeń może przełączyć — lista testów nie jest niczym chronionym.
  const [cls] = useSelectedClass();
  const [picked, setPicked] = useState<Qualification | null>(null);
  const qualification = picked ?? CLASS_QUALIFICATION[cls];

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
      .channel(`tests-live:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => void refetch())
      .subscribe((s) => {
        if (s === "SUBSCRIBED") void refetch();
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [channelId]);

  const shown = tests.filter((t) => t.qualification === qualification);

  const picker = (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kwalifikacja">
      {QUALIFICATIONS.map((q) => (
        <button
          key={q}
          type="button"
          role="tab"
          aria-selected={qualification === q}
          onClick={() => setPicked(q)}
          className={`rounded-xl border px-4 py-2 font-mono text-sm font-semibold transition ${
            qualification === q
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-line text-muted hover:bg-white/[0.04] hover:text-fg"
          }`}
        >
          {QUALIFICATION_LABEL[q]}
          <span className="ml-2 text-xs opacity-70">{tests.filter((t) => t.qualification === q).length}</span>
        </button>
      ))}
    </div>
  );

  if (shown.length === 0) {
    return (
      <div className="space-y-5">
        {picker}
        <div className="card p-10 text-center">
          <FolderOpen size={32} className="mx-auto text-muted" aria-hidden />
          <p className="mt-3 text-muted">Nie ma jeszcze testów dla {QUALIFICATION_LABEL[qualification]}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {picker}
      <ul className="grid gap-4 sm:grid-cols-2">
      {shown.map((t, i) => (
        <li key={t.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
          <Link href={`/testy/${t.id}`} className="card-interactive group flex h-full flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-xl">
                <FileText size={18} aria-hidden />
              </span>
              <span className="chip">
                <Lock size={12} aria-hidden /> PIN
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold leading-snug transition group-hover:text-accent">{t.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">
                {t.questionCount} {pluralPytania(t.questionCount)}
              </span>
              <span className="chip">
                <Timer size={12} aria-hidden /> {Math.round(t.timeLimitSec / 60)} min
              </span>
            </div>
            <div className="flex-1" />
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
              Rozpocznij <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
      </ul>
    </div>
  );
}
