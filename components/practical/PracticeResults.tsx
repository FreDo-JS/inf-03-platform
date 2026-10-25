"use client";

import { Check, X } from "lucide-react";
import type { AutoResult, PracticeTask } from "@/types/practical";

type Props = {
  task: PracticeTask;
  results: AutoResult[] | null;
  running: boolean;
  progress: string | null;
};

/** Wyniki testów w trybie ćwiczeniowym: widzi je tylko uczeń, niczego to nie zapisuje. */
export function PracticeResults({ task, results, running, progress }: Props) {
  const maxPoints = task.tests.reduce((s, t) => s + t.points, 0);
  const points = results?.reduce((s, r) => s + r.points, 0) ?? 0;
  const passed = results?.filter((r) => r.passed).length ?? 0;
  const manualMax = task.criteria.reduce((s, c) => s + c.points, 0);

  return (
    <div className="h-full overflow-y-auto p-4">
      <p className="rounded-lg border border-line p-3 text-xs leading-relaxed text-muted">
        To <strong className="text-fg">ćwiczenie</strong>: wyniki widzisz tylko Ty, nic nie jest zapisywane ani oceniane.
        Testy możesz uruchamiać, ile razy chcesz — poprawiaj kod i sprawdzaj ponownie.
      </p>

      {running && (
        <p className="mt-3 text-sm text-accent" role="status">
          Sprawdzanie… {progress ?? ""}
        </p>
      )}

      {results === null && !running ? (
        <p className="mt-4 text-sm text-muted">
          Kliknij <strong className="text-fg">Uruchom testy</strong>, aby sprawdzić swoją pracę. Zadanie ma {task.tests.length}{" "}
          testów za {maxPoints} pkt.
        </p>
      ) : (
        results !== null && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className={`font-mono text-3xl font-bold ${passed === task.tests.length ? "text-accent" : "text-fg"}`}>
                {points}/{maxPoints} pkt
              </p>
              <span className="chip">
                zaliczone testy: {passed}/{task.tests.length}
              </span>
            </div>
            <ul className="mt-3 divide-y divide-white/[0.06] rounded-xl border border-line">
              {task.tests.map((t) => {
                const r = results.find((x) => x.id === t.id);
                return (
                  <li key={t.id} className="flex items-start gap-3 p-3">
                    <span
                      role="img"
                      aria-label={r?.passed ? "zaliczony" : "niezaliczony"}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        r?.passed ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {r?.passed ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{t.name}</p>
                      {r && !r.passed && r.message && <p className="mt-0.5 text-xs text-muted">{r.message}</p>}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {r?.points ?? 0}/{t.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )
      )}

      {task.criteria.length > 0 && (
        <div className="mt-5">
          <h3 className="label">W egzaminie ocenia nauczyciel ({manualMax} pkt)</h3>
          <ul className="mt-1 space-y-1.5 text-sm">
            {task.criteria.map((c) => (
              <li key={c.name} className="flex gap-2">
                <span className="min-w-0 flex-1">
                  {c.name}
                  {c.description && <span className="block text-xs text-muted">{c.description}</span>}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">{c.points} pkt</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
