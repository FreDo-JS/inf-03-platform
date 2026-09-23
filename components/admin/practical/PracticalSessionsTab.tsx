"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { PinPresenter } from "@/components/admin/PinPresenter";
import { friendlyError } from "@/lib/errors";
import { fetchTasks } from "@/lib/practical/tasks";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { CLASS_NAMES } from "@/types/db";
import type { PracticalAttemptRow, PracticalSessionRow, PracticalTaskRow, SessionStatus } from "@/types/practical";

const SESSION_COLUMNS = "id, task_id, class_name, pin, status, minutes, allow_paste, pass_threshold, started_at, ends_at, created_at" as const;
const ATTEMPT_MONITOR_COLUMNS =
  "id, session_id, student_name, status, last_saved_at, submitted_at, ended_reason, tab_switch_count, large_paste_count, created_at" as const;

type MonitorRow = Pick<
  PracticalAttemptRow,
  "id" | "session_id" | "student_name" | "status" | "last_saved_at" | "submitted_at" | "ended_reason" | "tab_switch_count" | "large_paste_count" | "created_at"
>;

const STATUS_LABEL: Record<SessionStatus, string> = {
  lobby: "poczekalnia",
  active: "trwa",
  finished: "zakończona",
};

export function PracticalSessionsTab() {
  const channelId = useId();
  const [tasks, setTasks] = useState<PracticalTaskRow[]>([]);
  const [sessions, setSessions] = useState<PracticalSessionRow[] | null>(null);
  const [attempts, setAttempts] = useState<MonitorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [presenting, setPresenting] = useState<{ title: string; pin: string } | null>(null);

  // formularz nowej sesji
  const [taskId, setTaskId] = useState("");
  const [className, setClassName] = useState<string>("4e");
  const [minutes, setMinutes] = useState(150);
  const [allowPaste, setAllowPaste] = useState(true);
  const [threshold, setThreshold] = useState(75);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    const [taskRes, sessionRes, attemptRes] = await Promise.all([
      fetchTasks(),
      supabase.from("practical_sessions").select(SESSION_COLUMNS).order("created_at", { ascending: false }).limit(50),
      supabase.from("practical_attempts").select(ATTEMPT_MONITOR_COLUMNS).order("created_at", { ascending: true }).limit(500),
    ]);
    setTasks(taskRes.tasks.filter((t) => t.is_ready));
    if (sessionRes.error || attemptRes.error) {
      setError("Nie udało się pobrać sesji.");
      setSessions([]);
      return;
    }
    setSessions(sessionRes.data as PracticalSessionRow[]);
    setAttempts(attemptRes.data as MonitorRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // monitoring na żywo — dołączający uczniowie, autozapisy, oddania
  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`practical-monitor:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "practical_attempts" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "practical_sessions" }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, load]);

  useEffect(() => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setMinutes(task.default_minutes);
  }, [taskId, tasks]);

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || taskId === "") return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await getBrowserSupabase().rpc("practical_create_session", {
      p_task_id: taskId,
      p_class: className,
      p_minutes: minutes,
      p_allow_paste: allowPaste,
      p_pass_threshold: threshold,
    });
    setBusy(false);
    if (rpcError) {
      setError(friendlyError(rpcError, "Nie udało się utworzyć sesji."));
      return;
    }
    void load();
  };

  const startSession = async (session: PracticalSessionRow) => {
    if (!window.confirm(`Rozpocząć sesję dla klasy ${session.class_name}? Od tej chwili liczy się czas dla wszystkich.`)) return;
    setBusy(true);
    const { error: rpcError } = await getBrowserSupabase().rpc("practical_start_session", { p_session_id: session.id });
    setBusy(false);
    if (rpcError) setError(friendlyError(rpcError, "Nie udało się wystartować sesji."));
    void load();
  };

  const finishSession = async (session: PracticalSessionRow) => {
    if (!window.confirm("Zakończyć sesję dla wszystkich? Prace w toku zostaną oddane automatycznie.")) return;
    setBusy(true);
    const { error: rpcError } = await getBrowserSupabase().rpc("practical_finish_session", { p_session_id: session.id });
    setBusy(false);
    if (rpcError) setError(friendlyError(rpcError, "Nie udało się zakończyć sesji."));
    void load();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={createSession} className="card grid gap-3 p-4 sm:grid-cols-[1fr_6rem_7rem_7rem_auto]">
        <div>
          <label className="label" htmlFor="sess-task">
            Zadanie (tylko gotowe)
          </label>
          <select id="sess-task" className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">— wybierz —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sess-class">
            Klasa
          </label>
          <select id="sess-class" className="input" value={className} onChange={(e) => setClassName(e.target.value)}>
            {CLASS_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sess-minutes">
            Czas (min)
          </label>
          <input
            id="sess-minutes"
            className="input font-mono"
            type="number"
            min={5}
            max={300}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="sess-threshold">
            Próg (%)
          </label>
          <input
            id="sess-threshold"
            className="input font-mono"
            type="number"
            min={1}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2de2c1]"
              checked={allowPaste}
              onChange={(e) => setAllowPaste(e.target.checked)}
            />
            wklejanie
          </label>
          <button type="submit" className="btn-primary btn-sm" disabled={busy || taskId === ""}>
            Utwórz sesję
          </button>
        </div>
      </form>

      <p className="text-xs text-muted">
        Wykrywanie zmiany karty i pełnego ekranu to sygnały dla Ciebie, nie pełna blokada. Pełną kontrolę daje dopiero
        Safe Exam Browser (tu nie zintegrowany).
      </p>

      {error && <p className="alert-error">{error}</p>}

      {sessions === null ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : sessions.length === 0 ? (
        <p className="card p-8 text-center text-muted">Brak sesji.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const task = taskById.get(s.task_id);
            const rows = attempts.filter((a) => a.session_id === s.id);
            const submitted = rows.filter((a) => a.status !== "in_progress").length;
            return (
              <li key={s.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{task?.title ?? "(zadanie usunięte)"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">klasa {s.class_name}</span>
                      <span
                        className={`chip ${s.status === "active" ? "border-accent/50 text-accent" : s.status === "lobby" ? "border-warn/50 text-warn" : ""}`}
                      >
                        {STATUS_LABEL[s.status]}
                      </span>
                      <span className="chip">⏱ {s.minutes} min</span>
                      <span className="chip">próg {s.pass_threshold}%</span>
                      <span className="chip">{s.allow_paste ? "wklejanie: tak" : "wklejanie: nie"}</span>
                      <span className="chip">
                        uczniowie: {rows.length} · oddane: {submitted}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-bg/60 p-3 text-center">
                    <p className="label mb-1">PIN</p>
                    <p className="font-mono text-2xl font-bold tracking-[0.25em] text-accent">{s.pin}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setPresenting({ title: task?.title ?? "Praktyka", pin: s.pin })}
                  >
                    📺 Pokaż PIN klasie
                  </button>
                  {s.status === "lobby" && (
                    <button type="button" className="btn-primary btn-sm" onClick={() => void startSession(s)} disabled={busy}>
                      ▶ Start dla wszystkich
                    </button>
                  )}
                  {s.status !== "finished" && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => void finishSession(s)} disabled={busy}>
                      Zakończ sesję
                    </button>
                  )}
                  {s.ends_at && s.status === "active" && (
                    <span className="self-center text-xs text-muted">
                      koniec o {new Date(s.ends_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                {rows.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-white/[0.06] font-mono text-[11px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-2 py-2">Imię</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Ostatni zapis</th>
                          <th className="px-2 py-2 text-right">Zmiany karty</th>
                          <th className="px-2 py-2 text-right">Duże wklejenia</th>
                          <th className="px-2 py-2">Oddane</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {rows.map((a) => (
                          <tr key={a.id}>
                            <td className="px-2 py-2 font-medium">{a.student_name}</td>
                            <td className="px-2 py-2 text-muted">{a.status === "in_progress" ? "pracuje" : "oddane"}</td>
                            <td className="px-2 py-2 font-mono text-xs text-muted">
                              {a.last_saved_at ? new Date(a.last_saved_at).toLocaleTimeString("pl-PL") : "—"}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono ${a.tab_switch_count > 0 ? "text-danger" : "text-muted"}`}>
                              {a.tab_switch_count}
                            </td>
                            <td className={`px-2 py-2 text-right font-mono ${a.large_paste_count > 0 ? "text-warn" : "text-muted"}`}>
                              {a.large_paste_count}
                            </td>
                            <td className="px-2 py-2 text-xs">
                              {a.submitted_at ? (
                                <span className={a.ended_reason === "tab_switch" ? "text-danger" : "text-accent"}>
                                  {new Date(a.submitted_at).toLocaleTimeString("pl-PL")}
                                  {a.ended_reason === "tab_switch" && " (zmiana karty)"}
                                  {a.ended_reason === "time_up" && " (czas)"}
                                  {a.ended_reason === "teacher_ended" && " (zakończone przez nauczyciela)"}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {presenting && (
        <PinPresenter title={presenting.title} pin={presenting.pin} path="/praktyka" onClose={() => setPresenting(null)} />
      )}
    </div>
  );
}
