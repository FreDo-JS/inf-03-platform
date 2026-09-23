"use client";

import { useMemo, useState } from "react";
import { PreviewPane } from "@/components/practical/PreviewPane";
import { StudentFilesViewer } from "@/components/practical/StudentFilesViewer";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { RunProgress } from "@/lib/practical/runner";
import type { Json } from "@/types/db";
import type { ManualScore, PracticalAttemptRow, PracticalSessionRow, PracticalTaskRow, TestOverride } from "@/types/practical";

type Props = {
  attempt: PracticalAttemptRow;
  task: PracticalTaskRow;
  session: PracticalSessionRow;
  onClose: () => void;
  onCheck: () => void;
  onPublish: (published: boolean) => void;
  busy: boolean;
  progress: (RunProgress & { student: string }) | null;
};

export function WorkReview({ attempt, task, session, onClose, onCheck, onPublish, busy, progress }: Props) {
  const [overrides, setOverrides] = useState<TestOverride[]>(attempt.overrides);
  const [scores, setScores] = useState<ManualScore[]>(attempt.manual_scores);
  const [comment, setComment] = useState(attempt.teacher_comment);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<Record<string, { points: string; reason: string }>>({});

  const maxAuto = task.auto_tests.reduce((s, t) => s + t.points, 0);
  const maxManual = task.manual_criteria.reduce((s, c) => s + c.points, 0);

  const autoPoints = useMemo(
    () =>
      task.auto_tests.reduce((sum, t) => {
        const o = overrides.find((x) => x.id === t.id);
        const r = attempt.auto_results.find((x) => x.id === t.id);
        return sum + Math.min(t.points, Math.max(0, o?.points ?? r?.points ?? 0));
      }, 0),
    [task.auto_tests, overrides, attempt.auto_results],
  );
  const manualPoints = useMemo(
    () =>
      task.manual_criteria.reduce(
        (sum, c) => sum + Math.min(c.points, Math.max(0, scores.find((s) => s.id === c.id)?.points ?? 0)),
        0,
      ),
    [task.manual_criteria, scores],
  );
  const percent = maxAuto + maxManual > 0 ? Math.round(((autoPoints + manualPoints) / (maxAuto + maxManual)) * 1000) / 10 : 0;

  const setScore = (id: string, points: number) =>
    setScores((prev) => {
      const without = prev.filter((s) => s.id !== id);
      return [...without, { id, points }];
    });

  const applyOverride = (testId: string) => {
    const draft = overrideDraft[testId];
    const test = task.auto_tests.find((t) => t.id === testId);
    if (!draft || !test) return;
    const points = Number(draft.points);
    if (!Number.isFinite(points) || points < 0 || points > test.points) {
      setError(`Punkty korekty: od 0 do ${test.points}.`);
      return;
    }
    if (draft.reason.trim().length < 3) {
      setError("Podaj uzasadnienie korekty (min. 3 znaki).");
      return;
    }
    setError(null);
    setOverrides((prev) => [
      ...prev.filter((o) => o.id !== testId),
      { id: testId, passed: points > 0, points, reason: draft.reason.trim() },
    ]);
    setOverrideDraft((d) => ({ ...d, [testId]: { points: "", reason: "" } }));
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    setError(null);
    setInfo(null);
    const supabase = getBrowserSupabase();
    const { error: dbError } = await supabase
      .from("practical_attempts")
      .update({
        overrides: overrides as unknown as Json,
        manual_scores: scores as unknown as Json,
        teacher_comment: comment,
        status: publish ? "published" : "reviewed",
        ...(publish ? { published_at: new Date().toISOString() } : {}),
      })
      .eq("id", attempt.id);
    if (dbError) {
      setSaving(false);
      setError("Nie udało się zapisać oceny.");
      return;
    }
    // procent liczy baza — ta sama formuła dla wszystkich
    await supabase.rpc("practical_recalc", { p_attempt_id: attempt.id });
    setSaving(false);
    setInfo(publish ? "Zapisano i opublikowano." : "Zapisano ocenę.");
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">{attempt.student_name}</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="chip">klasa {session.class_name}</span>
            <span className="chip">{task.title}</span>
            {attempt.ended_reason === "tab_switch" && <span className="chip border-danger/60 bg-danger/10 text-danger">zmiana karty</span>}
            <span className={`chip ${attempt.tab_switch_count > 0 ? "border-danger/50 text-danger" : ""}`}>
              zmiany karty: {attempt.tab_switch_count}
            </span>
            <span className={`chip ${attempt.large_paste_count > 0 ? "border-warn/50 text-warn" : ""}`}>
              duże wklejenia: {attempt.large_paste_count}
            </span>
            {attempt.published_at && <span className="chip border-accent/40 text-accent">opublikowane</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            ← lista prac
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={onCheck} disabled={busy || task.auto_tests.length === 0}>
            {progress ? `Sprawdzanie… ${progress.done}/${progress.total}` : "▶ Sprawdź automatycznie"}
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => void save(false)} disabled={saving}>
            Zapisz ocenę
          </button>
          {attempt.published_at ? (
            <button type="button" className="btn-danger btn-sm" onClick={() => onPublish(false)} disabled={busy}>
              Cofnij publikację
            </button>
          ) : (
            <button type="button" className="btn-primary btn-sm" onClick={() => void save(true)} disabled={saving}>
              Opublikuj wynik
            </button>
          )}
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {info && <p className="alert-ok">{info}</p>}

      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="chip">
            automatyczne: {autoPoints}/{maxAuto}
          </span>
          <span className="chip">
            ręczne: {manualPoints}/{maxManual}
          </span>
          <span className="chip">próg {session.pass_threshold}%</span>
        </div>
        <p className={`font-mono text-3xl font-bold ${percent >= session.pass_threshold ? "text-accent" : "text-danger"}`}>
          {percent}%
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <h3 className="border-b border-white/[0.06] px-4 py-2.5 font-semibold">Pliki ucznia (tylko odczyt)</h3>
          <StudentFilesViewer files={attempt.files} height={360} />
        </div>
        <div className="card overflow-hidden" style={{ minHeight: 420 }}>
          <h3 className="border-b border-white/[0.06] px-4 py-2.5 font-semibold">Podgląd pracy</h3>
          <div style={{ height: 380 }}>
            <PreviewPane files={attempt.files} revision={0} />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h3 className="border-b border-white/[0.06] px-4 py-2.5 font-semibold">Testy automatyczne</h3>
        {attempt.auto_checked_at === null ? (
          <p className="p-4 text-sm text-muted">Praca nie była jeszcze sprawdzona automatycznie.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {task.auto_tests.map((t) => {
              const result = attempt.auto_results.find((r) => r.id === t.id);
              const override = overrides.find((o) => o.id === t.id);
              const effective = override ?? result;
              const draft = overrideDraft[t.id] ?? { points: "", reason: "" };
              return (
                <li key={t.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                        effective?.passed ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {effective?.passed ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{t.name}</p>
                      {result && <p className="mt-0.5 text-sm text-muted">{result.message}</p>}
                      {override && (
                        <p className="mt-1 text-xs text-warn">
                          Korekta nauczyciela: {override.points} pkt — {override.reason}
                          {result && ` (automat: ${result.points} pkt)`}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-sm text-muted">
                      {effective?.points ?? 0}/{t.points}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      className="input w-20 py-1 font-mono text-xs"
                      type="number"
                      min={0}
                      max={t.points}
                      step={0.5}
                      placeholder="pkt"
                      value={draft.points}
                      onChange={(e) => setOverrideDraft((d) => ({ ...d, [t.id]: { ...draft, points: e.target.value } }))}
                      aria-label={`Korekta punktów: ${t.name}`}
                    />
                    <input
                      className="input min-w-[12rem] flex-1 py-1 text-xs"
                      placeholder="uzasadnienie korekty (wymagane)"
                      value={draft.reason}
                      maxLength={300}
                      onChange={(e) => setOverrideDraft((d) => ({ ...d, [t.id]: { ...draft, reason: e.target.value } }))}
                      aria-label={`Uzasadnienie korekty: ${t.name}`}
                    />
                    <button type="button" className="btn-ghost btn-sm" onClick={() => applyOverride(t.id)}>
                      Nadpisz
                    </button>
                    {override && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setOverrides((prev) => prev.filter((o) => o.id !== t.id))}
                      >
                        Cofnij korektę
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {task.manual_criteria.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="border-b border-white/[0.06] px-4 py-2.5 font-semibold">Kryteria oceniane ręcznie</h3>
          <ul className="divide-y divide-white/[0.06]">
            {task.manual_criteria.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-sm text-muted">{c.description}</p>}
                </div>
                <input
                  className="input w-24 py-1.5 font-mono text-sm"
                  type="number"
                  min={0}
                  max={c.points}
                  step={0.5}
                  value={scores.find((s) => s.id === c.id)?.points ?? 0}
                  onChange={(e) => setScore(c.id, Number(e.target.value))}
                  aria-label={`Punkty: ${c.name}`}
                />
                <span className="text-sm text-muted">/ {c.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4">
        <label className="label" htmlFor="teacher-comment">
          Komentarz dla ucznia
        </label>
        <textarea
          id="teacher-comment"
          className="input min-h-[6rem]"
          value={comment}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
    </div>
  );
}
