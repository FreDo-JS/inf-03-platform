"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkReview } from "@/components/admin/practical/WorkReview";
import { downloadCsv, toCsv } from "@/lib/practical/csv";
import { parseAutoResults, parseFiles, parseManualScores, parseOverrides } from "@/lib/practical/parse";
import { runAutoTests, type RunProgress } from "@/lib/practical/runner";
import { fetchTasks } from "@/lib/practical/tasks";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Json } from "@/types/db";
import type { PracticalAttemptRow, PracticalSessionRow, PracticalTaskRow } from "@/types/practical";
import { Download } from "lucide-react";

const ATTEMPT_COLUMNS =
  "id, session_id, student_name, result_token, files, last_saved_at, status, submitted_at, ended_reason, tab_switch_count, large_paste_count, auto_results, auto_checked_at, overrides, manual_scores, teacher_comment, final_percent, published_at, created_at" as const;
const SESSION_COLUMNS = "id, task_id, class_name, pin, status, minutes, allow_paste, pass_threshold, started_at, ends_at, created_at" as const;

type AttemptDb = Record<string, unknown>;

function parseAttempt(row: AttemptDb): PracticalAttemptRow {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    student_name: String(row.student_name),
    result_token: String(row.result_token),
    files: parseFiles(row.files),
    last_saved_at: typeof row.last_saved_at === "string" ? row.last_saved_at : null,
    status: (row.status as PracticalAttemptRow["status"]) ?? "in_progress",
    submitted_at: typeof row.submitted_at === "string" ? row.submitted_at : null,
    ended_reason: (row.ended_reason as PracticalAttemptRow["ended_reason"]) ?? null,
    tab_switch_count: Number(row.tab_switch_count ?? 0),
    large_paste_count: Number(row.large_paste_count ?? 0),
    auto_results: parseAutoResults(row.auto_results),
    auto_checked_at: typeof row.auto_checked_at === "string" ? row.auto_checked_at : null,
    overrides: parseOverrides(row.overrides),
    manual_scores: parseManualScores(row.manual_scores),
    teacher_comment: String(row.teacher_comment ?? ""),
    final_percent: row.final_percent === null || row.final_percent === undefined ? null : Number(row.final_percent),
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    created_at: String(row.created_at),
  };
}

export function PracticalWorksTab() {
  const [sessions, setSessions] = useState<PracticalSessionRow[]>([]);
  const [tasks, setTasks] = useState<PracticalTaskRow[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [attempts, setAttempts] = useState<PracticalAttemptRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<(RunProgress & { student: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    const [taskRes, sessionRes] = await Promise.all([
      fetchTasks(),
      supabase.from("practical_sessions").select(SESSION_COLUMNS).order("created_at", { ascending: false }).limit(50),
    ]);
    setTasks(taskRes.tasks);
    if (sessionRes.error || !sessionRes.data) {
      setError("Nie udało się pobrać sesji.");
      return;
    }
    const list = sessionRes.data as PracticalSessionRow[];
    setSessions(list);
    setSessionId((current) => (current === "" ? (list[0]?.id ?? "") : current));
  }, []);

  const loadAttempts = useCallback(async (id: string) => {
    if (id === "") {
      setAttempts([]);
      return;
    }
    const { data, error: dbError } = await getBrowserSupabase()
      .from("practical_attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("session_id", id)
      .order("student_name");
    if (dbError || !data) {
      setError("Nie udało się pobrać prac.");
      return;
    }
    setAttempts((data as AttemptDb[]).map(parseAttempt));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadAttempts(sessionId);
  }, [sessionId, loadAttempts]);

  const session = sessions.find((s) => s.id === sessionId) ?? null;
  const task = useMemo(() => tasks.find((t) => t.id === session?.task_id) ?? null, [tasks, session]);
  const open = attempts.find((a) => a.id === openId) ?? null;

  const maxPoints = useMemo(() => {
    const auto = task?.auto_tests.reduce((s, t) => s + t.points, 0) ?? 0;
    const manual = task?.manual_criteria.reduce((s, c) => s + c.points, 0) ?? 0;
    return { auto, manual, total: auto + manual };
  }, [task]);

  /** Ocena automatyczna: kod ucznia działa w sandboxie, wynik zapisujemy do bazy. */
  const checkAttempt = useCallback(
    async (attempt: PracticalAttemptRow) => {
      if (!task || task.auto_tests.length === 0) return;
      const results = await runAutoTests(attempt.files, task.auto_tests, (p) =>
        setProgress({ ...p, student: attempt.student_name }),
      );
      const supabase = getBrowserSupabase();
      const { error: dbError } = await supabase
        .from("practical_attempts")
        .update({
          auto_results: results as unknown as Json,
          auto_checked_at: new Date().toISOString(),
          status: attempt.status === "published" ? attempt.status : "auto_checked",
        })
        .eq("id", attempt.id);
      if (dbError) {
        setError("Nie udało się zapisać wyników automatycznych.");
        return;
      }
      await supabase.rpc("practical_recalc", { p_attempt_id: attempt.id });
    },
    [task],
  );

  const checkOne = async (attempt: PracticalAttemptRow) => {
    setBusy(true);
    setError(null);
    await checkAttempt(attempt);
    setProgress(null);
    setBusy(false);
    void loadAttempts(sessionId);
  };

  const checkAllUnchecked = async () => {
    const pending = attempts.filter((a) => a.status !== "in_progress" && a.auto_checked_at === null);
    if (pending.length === 0) return;
    setBusy(true);
    setError(null);
    for (const attempt of pending) await checkAttempt(attempt);
    setProgress(null);
    setBusy(false);
    void loadAttempts(sessionId);
  };

  const publish = async (attempt: PracticalAttemptRow, published: boolean) => {
    setBusy(true);
    const { error: dbError } = await getBrowserSupabase()
      .from("practical_attempts")
      .update({
        published_at: published ? new Date().toISOString() : null,
        status: published ? "published" : "reviewed",
      })
      .eq("id", attempt.id);
    setBusy(false);
    if (dbError) {
      setError("Nie udało się zmienić publikacji.");
      return;
    }
    void loadAttempts(sessionId);
  };

  const publishAllReviewed = async () => {
    const ready = attempts.filter((a) => a.published_at === null && a.final_percent !== null);
    if (ready.length === 0) return;
    if (!window.confirm(`Opublikować ${ready.length} ocenionych prac?`)) return;
    setBusy(true);
    for (const a of ready) await publish(a, true);
    setBusy(false);
  };

  const exportCsv = () => {
    if (!task || !session) return;
    const header = [
      "Imię",
      "Klasa",
      "Status",
      "Powód zakończenia",
      "Zmiany karty",
      "Duże wklejenia",
      ...task.auto_tests.map((t) => `T: ${t.name}`),
      ...task.manual_criteria.map((c) => `K: ${c.name}`),
      "Procent",
      "Zaliczone",
      "Oddano",
    ];
    const rows = attempts.map((a) => {
      const testPoints = task.auto_tests.map((t) => {
        const override = a.overrides.find((o) => o.id === t.id);
        const result = a.auto_results.find((r) => r.id === t.id);
        return override?.points ?? result?.points ?? 0;
      });
      const manualPoints = task.manual_criteria.map((c) => a.manual_scores.find((m) => m.id === c.id)?.points ?? 0);
      return [
        a.student_name,
        session.class_name,
        a.status,
        a.ended_reason ?? "",
        a.tab_switch_count,
        a.large_paste_count,
        ...testPoints,
        ...manualPoints,
        a.final_percent ?? "",
        a.final_percent !== null && a.final_percent >= session.pass_threshold ? "tak" : "nie",
        a.submitted_at ? new Date(a.submitted_at).toLocaleString("pl-PL") : "",
      ];
    });
    downloadCsv(`wyniki-${session.class_name}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([header, ...rows]));
  };

  if (open && task && session) {
    return (
      <WorkReview
        attempt={open}
        task={task}
        session={session}
        onClose={() => {
          setOpenId(null);
          void loadAttempts(sessionId);
        }}
        onCheck={() => void checkOne(open)}
        onPublish={(published) => void publish(open, published)}
        busy={busy}
        progress={progress}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-full min-w-0 sm:min-w-[16rem] sm:flex-1">
          <label className="label" htmlFor="works-session">
            Sesja
          </label>
          <select id="works-session" className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
            {sessions.length === 0 && <option value="">brak sesji</option>}
            {sessions.map((s) => {
              const t = tasks.find((x) => x.id === s.task_id);
              return (
                <option key={s.id} value={s.id}>
                  {t?.title ?? "(zadanie usunięte)"} · klasa {s.class_name} · {new Date(s.created_at).toLocaleDateString("pl-PL")}
                </option>
              );
            })}
          </select>
        </div>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void checkAllUnchecked()} disabled={busy || !task}>
          ▶ Sprawdź wszystkie niesprawdzone
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void publishAllReviewed()} disabled={busy}>
          Opublikuj wszystkie ocenione
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={exportCsv} disabled={!task || attempts.length === 0}>
          <Download size={14} aria-hidden /> Eksport CSV
        </button>
      </div>

      {progress && (
        <p className="alert-ok">
          Sprawdzanie: {progress.student} — {progress.done}/{progress.total} {progress.current && `(${progress.current})`}
        </p>
      )}
      {error && <p className="alert-error">{error}</p>}

      {attempts.length === 0 ? (
        <p className="card p-8 text-center text-muted">W tej sesji nie ma jeszcze prac.</p>
      ) : (
        <>
          {/* Telefon: praca jako karta — ośmiokolumnowa tabela nie mieści się
              na ekranie, a nauczyciel i tak potrzebuje tu jednego przycisku. */}
          <ul className="space-y-2 md:hidden">
            {attempts.map((a) => {
              const autoPoints = (task?.auto_tests ?? []).reduce((sum, t) => {
                const override = a.overrides.find((o) => o.id === t.id);
                const result = a.auto_results.find((r) => r.id === t.id);
                return sum + (override?.points ?? result?.points ?? 0);
              }, 0);
              const statusLabel =
                a.status === "in_progress"
                  ? "pracuje"
                  : a.published_at
                    ? "opublikowane"
                    : a.auto_checked_at
                      ? "sprawdzone"
                      : "oddane";
              return (
                <li key={a.id} className="card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 break-words font-medium">{a.student_name}</p>
                    {a.final_percent !== null && (
                      <span
                        className={`shrink-0 font-mono font-semibold ${
                          session && a.final_percent >= session.pass_threshold ? "text-accent" : "text-danger"
                        }`}
                      >
                        {a.final_percent}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="chip">{statusLabel}</span>
                    {a.auto_checked_at && (
                      <span className="chip">
                        auto {autoPoints}/{maxPoints.auto}
                      </span>
                    )}
                    {a.tab_switch_count > 0 && (
                      <span className="chip border-danger/40 text-danger">karta: {a.tab_switch_count}</span>
                    )}
                    {a.large_paste_count > 0 && (
                      <span className="chip border-warn/40 text-warn">wklejenia: {a.large_paste_count}</span>
                    )}
                    {a.ended_reason === "tab_switch" && (
                      <span className="chip border-danger/60 text-danger">zmiana karty</span>
                    )}
                    {a.ended_reason === "time_up" && <span className="chip border-warn/50 text-warn">koniec czasu</span>}
                    {a.ended_reason === "teacher_ended" && <span className="chip">zakończone przez nauczyciela</span>}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-sm mt-3 w-full"
                    onClick={() => setOpenId(a.id)}
                    disabled={a.status === "in_progress"}
                  >
                    Otwórz pracę
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Imię</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Auto</th>
                <th className="px-4 py-3 text-right">Procent</th>
                <th className="px-4 py-3 text-right">Karta</th>
                <th className="px-4 py-3 text-right">Wklejenia</th>
                <th className="px-4 py-3">Zakończenie</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {attempts.map((a) => {
                const autoPoints = (task?.auto_tests ?? []).reduce((sum, t) => {
                  const override = a.overrides.find((o) => o.id === t.id);
                  const result = a.auto_results.find((r) => r.id === t.id);
                  return sum + (override?.points ?? result?.points ?? 0);
                }, 0);
                return (
                  <tr key={a.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium">{a.student_name}</td>
                    <td className="px-4 py-3 text-muted">
                      {a.status === "in_progress"
                        ? "pracuje"
                        : a.published_at
                          ? "opublikowane"
                          : a.auto_checked_at
                            ? "sprawdzone"
                            : "oddane"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">
                      {a.auto_checked_at ? `${autoPoints}/${maxPoints.auto}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {a.final_percent === null ? (
                        "—"
                      ) : (
                        <span className={session && a.final_percent >= session.pass_threshold ? "text-accent" : "text-danger"}>
                          {a.final_percent}%
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${a.tab_switch_count > 0 ? "text-danger" : "text-muted"}`}>
                      {a.tab_switch_count}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${a.large_paste_count > 0 ? "text-warn" : "text-muted"}`}>
                      {a.large_paste_count}
                    </td>
                    <td className="px-4 py-3">
                      {a.ended_reason === "tab_switch" ? (
                        <span className="chip border-danger/60 bg-danger/10 text-danger">zmiana karty</span>
                      ) : a.ended_reason === "time_up" ? (
                        <span className="chip border-warn/50 text-warn">koniec czasu</span>
                      ) : a.ended_reason === "teacher_ended" ? (
                        <span className="chip">zakończone przez nauczyciela</span>
                      ) : a.ended_reason === "completed" ? (
                        <span className="chip">oddane</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setOpenId(a.id)}
                        disabled={a.status === "in_progress"}
                      >
                        Otwórz
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
    </div>
  );
}
