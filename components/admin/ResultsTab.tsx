"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/tests";
import type { AttemptRow, EndedReason } from "@/types/db";
import { RefreshCw } from "lucide-react";

// Powód zakończenia podejścia. „Zmiana karty" to sygnał do sprawdzenia,
// nie dowód ściągania — wykrywa tylko przełączenie karty w tej przeglądarce.
const REASON: Record<EndedReason, { label: string; className: string }> = {
  completed: { label: "ukończony", className: "border-line text-muted" },
  time_up: { label: "koniec czasu", className: "border-warn/50 text-warn" },
  tab_switch: { label: "zmiana karty", className: "border-danger/60 bg-danger/10 text-danger" },
};

const PAGE_LIMIT = 1000;

export function ResultsTab() {
  const [rows, setRows] = useState<AttemptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await getBrowserSupabase()
      .from("attempts")
      .select("id, test_id, test_title, student_name, score, total, duration_sec, created_at, ended_reason, tab_switch_count")
      .order("created_at", { ascending: false })
      .limit(PAGE_LIMIT);
    setLoading(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się pobrać wyników."));
      setRows([]);
      return;
    }
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!rows) return [];
    if (!f) return rows;
    return rows.filter((r) => r.student_name.toLowerCase().includes(f) || r.test_title.toLowerCase().includes(f));
  }, [rows, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="filtruj: imię lub test…"
          value={filter}
          maxLength={100}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtruj wyniki"
        />
        <button type="button" className="btn-ghost" onClick={() => void load()} disabled={loading}>
          {loading ? (
            "odświeżanie…"
          ) : (
            <>
              <RefreshCw size={14} aria-hidden /> odśwież
            </>
          )}
        </button>
        {rows && (
          <span className="chip">
            {visible.length} / {rows.length} wpisów
          </span>
        )}
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
