"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestionAnalysis } from "@/components/admin/QuestionAnalysis";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/tests";
import type { AttemptRow, EndedReason } from "@/types/db";
import { RefreshCw, Trash2 } from "lucide-react";

// Powód zakończenia podejścia. „Zmiana karty" to sygnał do sprawdzenia,
// nie dowód ściągania — wykrywa tylko przełączenie karty w tej przeglądarce.
const REASON: Record<EndedReason, { label: string; className: string }> = {
  completed: { label: "ukończony", className: "border-line text-muted" },
  time_up: { label: "koniec czasu", className: "border-warn/50 text-warn" },
  tab_switch: { label: "zmiana karty", className: "border-danger/60 bg-danger/10 text-danger" },
};

const PAGE_LIMIT = 1000;

// Dwa zestawy kolumn: z odpowiedziami (migracja 018) i bez nich. Kod wchodzi
// na Vercela przed wklejeniem SQL-a, więc zapytanie o answers/results potrafi
// przez chwilę nie mieć pokrycia w bazie — wtedy wracamy do starego zestawu
// i pokazujemy, czego brakuje, zamiast wywalać całą zakładkę.
const KOLUMNY_STARE =
  "id, test_id, test_title, student_name, score, total, duration_sec, created_at, ended_reason, tab_switch_count" as const;
const KOLUMNY_Z_ODPOWIEDZIAMI =
  "id, test_id, test_title, student_name, score, total, duration_sec, created_at, ended_reason, tab_switch_count, answers, results" as const;

/** To samo rozpoznanie braku kolumny, co w lib/supabase/compat.ts (tamten moduł jest server-only). */
function brakKolumny(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "42P01") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("schema cache");
}

type Widok = "lista" | "analiza";

export function ResultsTab() {
  const [rows, setRows] = useState<AttemptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [usuwanie, setUsuwanie] = useState<string | null>(null);
  const [widok, setWidok] = useState<Widok>("lista");
  const [brakMigracji, setBrakMigracji] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const pelne = await supabase
      .from("attempts")
      .select(KOLUMNY_Z_ODPOWIEDZIAMI)
      .order("created_at", { ascending: false })
      .limit(PAGE_LIMIT);

    if (!pelne.error) {
      setLoading(false);
      setBrakMigracji(false);
      setRows(pelne.data);
      return;
    }
    if (!brakKolumny(pelne.error)) {
      setLoading(false);
      setError(friendlyError(pelne.error, "Nie udało się pobrać wyników."));
      setRows([]);
      return;
    }

    const stare = await supabase
      .from("attempts")
      .select(KOLUMNY_STARE)
      .order("created_at", { ascending: false })
      .limit(PAGE_LIMIT);
    setLoading(false);
    if (stare.error) {
      setError(friendlyError(stare.error, "Nie udało się pobrać wyników."));
      setRows([]);
      return;
    }
    setBrakMigracji(true);
    setRows(stare.data.map((r) => ({ ...r, answers: null, results: null })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Kasowanie wyników. Nieodwracalne — RLS pozwala na nie tylko nauczycielowi
   * (polityka z migracji 008), więc jedyną barierą po stronie strony jest
   * potwierdzenie z konkretną liczbą wpisów.
   */
  const usunJeden = async (r: AttemptRow) => {
    if (usuwanie !== null) return;
    const kiedy = new Date(r.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    if (!window.confirm(`Usunąć wynik: ${r.student_name} — ${r.test_title} (${kiedy})?\n\nTej operacji nie da się cofnąć.`)) return;

    setUsuwanie(r.id);
    setError(null);
    const { error: dbError } = await getBrowserSupabase().from("attempts").delete().eq("id", r.id);
    setUsuwanie(null);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się usunąć wyniku."));
      return;
    }
    setRows((prev) => (prev === null ? prev : prev.filter((x) => x.id !== r.id)));
  };

  const usunWidoczne = async () => {
    if (usuwanie !== null || visible.length === 0) return;
    const czego = filter.trim() === "" ? "WSZYSTKIE wyniki" : `wyniki pasujące do filtru „${filter.trim()}”`;
    if (!window.confirm(`Usunąć ${czego} — ${visible.length} wpisów?\n\nTej operacji nie da się cofnąć.`)) return;

    setUsuwanie("wiele");
    setError(null);
    const ids = visible.map((r) => r.id);
    const { error: dbError } = await getBrowserSupabase().from("attempts").delete().in("id", ids);
    setUsuwanie(null);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się usunąć wyników."));
      return;
    }
    setRows((prev) => (prev === null ? prev : prev.filter((x) => !ids.includes(x.id))));
  };

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!rows) return [];
    if (!f) return rows;
    return rows.filter((r) => r.student_name.toLowerCase().includes(f) || r.test_title.toLowerCase().includes(f));
  }, [rows, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Przełącznik widoku: lista podejść (kto ile) i analiza (czego klasa nie umie). */}
        <div className="flex gap-2" role="group" aria-label="Widok wyników">
          <button
            type="button"
            className={widok === "lista" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            onClick={() => setWidok("lista")}
            aria-pressed={widok === "lista"}
          >
            Podejścia
          </button>
          <button
            type="button"
            className={widok === "analiza" ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            onClick={() => setWidok("analiza")}
            aria-pressed={widok === "analiza"}
          >
            Analiza pytań
          </button>
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
          {loading ? (
            "odświeżanie…"
          ) : (
            <>
              <RefreshCw size={14} aria-hidden /> odśwież
            </>
          )}
        </button>
      </div>

      {brakMigracji && (
        <p className="card p-3 text-sm text-muted">
          Analiza pytań potrzebuje odpowiedzi zapisywanych przy wyniku — uruchom migrację{" "}
          <code>supabase/018_attempt_answers.sql</code> w SQL Editorze. Do tego czasu widać same punkty.
        </p>
      )}

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      {widok === "analiza" ? (
        rows === null ? (
          <p className="text-sm text-muted">Ładowanie…</p>
        ) : (
          <QuestionAnalysis attempts={rows} />
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="input max-w-xs"
              placeholder="filtruj: imię lub test…"
              value={filter}
              maxLength={100}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filtruj wyniki"
            />
            {rows && (
              <span className="chip">
                {visible.length} / {rows.length} wpisów
              </span>
            )}
            {rows !== null && visible.length > 0 && (
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => void usunWidoczne()}
                disabled={usuwanie !== null}
                title="Usuwa wpisy widoczne na liście — zawęź je filtrem, jeśli nie chcesz skasować wszystkiego"
              >
                <Trash2 size={14} aria-hidden />
                {usuwanie === "wiele" ? "Usuwanie…" : `Usuń widoczne (${visible.length})`}
              </button>
            )}
          </div>

          {rows === null ? (
            <p className="text-sm text-muted">Ładowanie…</p>
          ) : visible.length === 0 ? (
            <p className="card p-6 text-muted">Brak wyników.</p>
          ) : (
            <>
              {/* Telefon: każdy wynik jako karta. Tabela z siedmioma kolumnami
                  wymagałaby przewijania w bok, a tak wszystko widać od razu. */}
              <ul className="space-y-2 md:hidden">
                {visible.map((r) => {
                  const pct = r.total > 0 ? r.score / r.total : 0;
                  return (
                    <li key={r.id} className="card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 flex-1 break-words font-medium">{r.student_name}</p>
                        <span
                          className={`shrink-0 font-mono font-semibold ${
                            pct >= 0.75 ? "text-accent" : pct >= 0.5 ? "text-warn" : "text-danger"
                          }`}
                        >
                          {r.score}/{r.total}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted">
                        {r.test_title}
                        {r.test_id === null && <span className="ml-1 text-xs">(usunięty)</span>}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          className="btn-danger btn-sm ml-auto order-last"
                          onClick={() => void usunJeden(r)}
                          disabled={usuwanie !== null}
                          aria-label={`Usuń wynik: ${r.student_name}`}
                        >
                          <Trash2 size={13} aria-hidden /> usuń
                        </button>
                        <span className={`chip ${(REASON[r.ended_reason] ?? REASON.completed).className}`}>
                          {(REASON[r.ended_reason] ?? REASON.completed).label}
                        </span>
                        <span className="chip">{formatDuration(r.duration_sec)}</span>
                        {r.tab_switch_count > 0 && (
                          <span className="chip border-danger/40 text-danger">zmiany karty: {r.tab_switch_count}</span>
                        )}
                        <span className="chip">
                          {new Date(r.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="card hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Imię</th>
                      <th className="px-4 py-3">Test</th>
                      <th className="px-4 py-3 text-right">Wynik</th>
                      <th className="px-4 py-3 text-right">Czas</th>
                      <th className="px-4 py-3">Zakończenie</th>
                      <th className="px-4 py-3 text-right" title="Ile razy uczeń opuścił kartę w trakcie podejścia">
                        Zmiany karty
                      </th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3 text-right">Usuń</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {visible.map((r) => {
                      const pct = r.total > 0 ? r.score / r.total : 0;
                      return (
                        <tr key={r.id} className="transition hover:bg-white/[0.03]">
                          <td className="max-w-[12rem] truncate px-4 py-3 font-medium" title={r.student_name}>
                            {r.student_name}
                          </td>
                          <td className="max-w-[16rem] truncate px-4 py-3 text-muted">
                            {r.test_title}
                            {r.test_id === null && <span className="ml-1 text-xs">(usunięty)</span>}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-semibold ${
                              pct >= 0.75 ? "text-accent" : pct >= 0.5 ? "text-warn" : "text-danger"
                            }`}
                          >
                            {r.score}/{r.total}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-muted">{formatDuration(r.duration_sec)}</td>
                          <td className="px-4 py-3">
                            <span className={`chip ${(REASON[r.ended_reason] ?? REASON.completed).className}`}>
                              {(REASON[r.ended_reason] ?? REASON.completed).label}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono ${
                              r.tab_switch_count > 0 ? "font-semibold text-danger" : "text-muted"
                            }`}
                          >
                            {r.tab_switch_count}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                            {new Date(r.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="btn-danger btn-sm"
                              onClick={() => void usunJeden(r)}
                              disabled={usuwanie !== null}
                              aria-label={`Usuń wynik: ${r.student_name}`}
                            >
                              <Trash2 size={13} aria-hidden />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
