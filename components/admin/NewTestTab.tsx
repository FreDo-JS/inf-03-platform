"use client";

import { useState } from "react";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  LIMITS,
  emptyPair,
  emptyQuestion,
  parseCreateTestResult,
  validateTestDraft,
  type DraftErrors,
  type DraftQuestion,
  type TestDraft,
} from "@/lib/validation";
import type { QuestionType } from "@/types/db";

const TYPE_LABEL: Record<QuestionType, string> = {
  closed: "zamknięte (jednokrotny wybór)",
  select: "lista rozwijana",
  input: "pole tekstowe",
  matching: "dopasowywanie (drag & drop)",
};

/** Losowy PIN po stronie klienta (crypto) — tylko podpowiedź, baza i tak waliduje format. */
function randomPin(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String((buf[0] ?? 0) % 1_000_000).padStart(6, "0");
}

const initialDraft = (): TestDraft => ({ title: "", timeLimitMinutes: "10", pin: "", questions: [emptyQuestion("closed")] });

export function NewTestTab() {
  const [draft, setDraft] = useState<TestDraft>(initialDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ title: string; pin: string } | null>(null);

  // Walidacja na żywo (po pierwszej próbie zapisu) — ta sama funkcja co przed zapytaniem.
  const validation = validateTestDraft(draft);
  const errors: DraftErrors | null = showErrors && !validation.ok ? validation.errors : null;

  const updateQuestion = (i: number, fn: (q: DraftQuestion) => DraftQuestion) =>
    setDraft((d) => ({ ...d, questions: d.questions.map((q, j) => (j === i ? fn(q) : q)) }));

  const moveQuestion = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.questions.length) return d;
      const qs = [...d.questions];
      const a = qs[i];
      const b = qs[j];
      if (!a || !b) return d;
      qs[i] = b;
      qs[j] = a;
      return { ...d, questions: qs };
    });

  const removeQuestion = (i: number) =>
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, j) => j !== i) }));

  const addQuestion = (type: QuestionType) =>
    setDraft((d) =>
      d.questions.length >= LIMITS.questions.max ? d : { ...d, questions: [...d.questions, emptyQuestion(type)] },
    );

  const changeType = (i: number, type: QuestionType) =>
    updateQuestion(i, (q) => {
      if (type === q.type) return q;
      if (type === "input") {
        return { ...q, type, options: [], correctIndex: null, accepted: q.accepted.length ? q.accepted : [""], pairs: [] };
      }
      if (type === "matching") {
        return { ...q, type, options: [], correctIndex: null, accepted: [], pairs: q.pairs.length >= 2 ? q.pairs : [emptyPair(), emptyPair()] };
      }
      const options = q.options.length >= 2 ? q.options : ["", ""];
      const keepCorrect = q.type === "closed" || q.type === "select";
      return { ...q, type, options, correctIndex: keepCorrect ? q.correctIndex : null, accepted: [], pairs: [] };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setShowErrors(true);
    setSaveError(null);
    setCreated(null);

    // Walidacja tuż przed wysłaniem do Supabase.
    const r = validateTestDraft(draft);
    if (!r.ok) {
      setSaveError("Popraw zaznaczone pola.");
      return;
    }

    setSaving(true);
    const { data, error } = await getBrowserSupabase().rpc("create_test", {
      p_title: r.value.title,
      p_time_limit: r.value.timeLimitSec,
      p_questions: r.value.questions,
      p_keys: r.value.keys,
      p_pin: r.value.pin,
    });
    setSaving(false);

    if (error) {
      setSaveError(friendlyError(error, "Nie udało się zapisać testu."));
      return;
    }
    const res = parseCreateTestResult(data);
    setCreated({ title: r.value.title, pin: res?.pin ?? "—" });
    setDraft(initialDraft());
    setShowErrors(false);
  };

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      {created && (
        <div className="card flex flex-wrap items-center justify-between gap-4 border-accent/40 bg-accent/[0.06] p-5" role="status">
          <div>
            <p className="font-semibold text-accent">✓ Zapisano test „{created.title}”</p>
            <p className="mt-1 text-sm text-muted">Test jest już widoczny dla uczniów. Podaj im PIN (znajdziesz go też w zakładce Testy).</p>
          </div>
          <div className="text-right">
            <p className="label mb-0">PIN</p>
            <p className="font-mono text-3xl font-bold tracking-[0.25em] text-accent">{created.pin}</p>
          </div>
        </div>
      )}
      <div className="card grid gap-4 p-4 sm:grid-cols-[1fr_10rem_13rem] sm:p-6">
        <div>
          <label htmlFor="t-title" className="label">
            Tytuł testu
          </label>
          <input
            id="t-title"
            className="input"
            value={draft.title}
            maxLength={LIMITS.title.max}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            aria-invalid={Boolean(errors?.title)}
          />
          <p className="mt-1 flex justify-between text-xs text-muted">
            <span className="text-danger">{errors?.title}</span>
            <span>
              {draft.title.length}/{LIMITS.title.max}
            </span>
          </p>
        </div>
        <div>
          <label htmlFor="t-time" className="label">
            Limit czasu (min)
          </label>
          <input
            id="t-time"
            className="input font-mono"
            type="number"
            inputMode="numeric"
            min={LIMITS.timeLimitMinutes.min}
            max={LIMITS.timeLimitMinutes.max}
            step={1}
            value={draft.timeLimitMinutes}
            onChange={(e) => setDraft((d) => ({ ...d, timeLimitMinutes: e.target.value }))}
            aria-invalid={Boolean(errors?.timeLimit)}
          />
          {errors?.timeLimit && <p className="field-error">{errors.timeLimit}</p>}
        </div>
        <div>
          <label htmlFor="t-pin" className="label">
            PIN (6 cyfr)
          </label>
          <div className="flex gap-2">
            <input
              id="t-pin"
              className="input font-mono tracking-[0.2em]"
              inputMode="numeric"
              maxLength={LIMITS.pinLength}
              placeholder="auto"
              value={draft.pin}
              onChange={(e) => {
                const v = e.target.value.replace(/D/g, "").slice(0, LIMITS.pinLength);
                setDraft((d) => ({ ...d, pin: v }));
              }}
              aria-invalid={Boolean(errors?.pin)}
            />
            <button
              type="button"
              className="btn-ghost btn-sm shrink-0"
              title="Wylosuj PIN"
              onClick={() => setDraft((d) => ({ ...d, pin: randomPin() }))}
            >
              🎲
            </button>
          </div>
          {errors?.pin ? (
            <p className="field-error">{errors.pin}</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">puste = wylosuje baza</p>
          )}
        </div>
      </div>

      {errors?.general && <p className="field-error">{errors.general}</p>}

      <ol className="space-y-4">
        {draft.questions.map((q, i) => (
          <QuestionEditor
            key={i}
            index={i}
            count={draft.questions.length}
            question={q}
            errors={errors?.questions[i]}
            onChange={(fn) => updateQuestion(i, fn)}
            onType={(t) => changeType(i, t)}
            onMove={(dir) => moveQuestion(i, dir)}
            onRemove={() => removeQuestion(i)}
          />
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <span className="self-center text-sm text-muted">Dodaj pytanie:</span>
        {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
          <button key={t} type="button" className="btn-ghost btn-sm" onClick={() => addQuestion(t)}>
            + {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="card sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">
          {saveError && (
            <p className="text-danger" role="alert">
              {saveError}
            </p>
          )}
          {!saveError && !created && (
            <p className="font-mono text-xs text-muted">
              {draft.questions.length} pyt. · walidacja: {validation.ok ? "OK ✓" : "niekompletne"}
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "zapisywanie…" : "Zapisz test"}
        </button>
      </div>
    </form>
  );
}

type EditorProps = {
  index: number;
  count: number;
  question: DraftQuestion;
  errors: string[] | undefined;
  onChange: (fn: (q: DraftQuestion) => DraftQuestion) => void;
  onType: (t: QuestionType) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

function QuestionEditor({ index, count, question: q, errors, onChange, onType, onMove, onRemove }: EditorProps) {
  const hasErrors = errors !== undefined && errors.length > 0;
  const name = `correct-${index}`;

  return (
    <li className={`card p-4 sm:p-5 ${hasErrors ? "border-danger/60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 font-mono text-xs text-accent">{index + 1}</span> Pytanie</p>
        <div className="flex flex-wrap items-center gap-1">
          <select
            className="input w-auto py-1.5 text-sm"
            value={q.type}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "closed" || v === "select" || v === "input" || v === "matching") onType(v);
            }}
            aria-label="Typ pytania"
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <button type="button" className="btn-ghost px-2 py-1" onClick={() => onMove(-1)} disabled={index === 0} aria-label="W górę">
            ↑
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label="W dół"
          >
            ↓
          </button>
          <button type="button" className="btn-danger px-2 py-1" onClick={onRemove} disabled={count <= 1} aria-label="Usuń pytanie">
            ✕
          </button>
        </div>
      </div>

      <label className="label mt-3" htmlFor={`q-text-${index}`}>
        Treść pytania
      </label>
      <textarea
        id={`q-text-${index}`}
        className="input min-h-[4.5rem]"
        value={q.text}
        maxLength={LIMITS.questionText.max}
        onChange={(e) => {
          const v = e.target.value;
          onChange((x) => ({ ...x, text: v }));
        }}
      />
      <p className="mt-1 text-right text-xs text-muted">
        {q.text.length}/{LIMITS.questionText.max}
      </p>

      {q.type === "closed" || q.type === "select" ? (
        <fieldset className="mt-2">
          <legend className="label">Opcje — zaznacz poprawną</legend>
          <ul className="space-y-2">
            {q.options.map((opt, oi) => (
              <li key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={name}
                  className="h-4 w-4 shrink-0 accent-[#2de2c1]"
                  checked={q.correctIndex === oi}
                  onChange={() => onChange((x) => ({ ...x, correctIndex: oi }))}
                  aria-label={`Opcja ${oi + 1} jest poprawna`}
                />
                <input
                  className="input py-1.5"
                  value={opt}
                  maxLength={LIMITS.option.max}
                  placeholder={`opcja ${oi + 1}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange((x) => ({ ...x, options: x.options.map((o, k) => (k === oi ? v : o)) }));
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-2 py-1"
                  disabled={q.options.length <= LIMITS.options.min}
                  aria-label={`Usuń opcję ${oi + 1}`}
                  onClick={() =>
                    onChange((x) => {
                      const options = x.options.filter((_, k) => k !== oi);
                      let correctIndex = x.correctIndex;
                      if (correctIndex === oi) correctIndex = null;
                      else if (correctIndex !== null && correctIndex > oi) correctIndex -= 1;
                      return { ...x, options, correctIndex };
                    })
                  }
                >
                  −
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-ghost mt-2 px-3 py-1 text-xs"
            disabled={q.options.length >= LIMITS.options.max}
            onClick={() => onChange((x) => ({ ...x, options: [...x.options, ""] }))}
          >
            + opcja
          </button>
        </fieldset>
      ) : q.type === "matching" ? (
        <fieldset className="mt-2">
          <legend className="label">Pary do dopasowania (lewa ↔ prawa)</legend>
          <ul className="space-y-2">
            {q.pairs.map((pair, pi) => (
              <li key={pi} className="flex items-center gap-2">
                <span className="w-5 shrink-0 font-mono text-xs text-muted">{pi + 1}.</span>
                <input
                  className="input py-1.5"
                  value={pair.left}
                  maxLength={LIMITS.pairSide.max}
                  placeholder={`lewa ${pi + 1}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange((x) => ({ ...x, pairs: x.pairs.map((p, k) => (k === pi ? { ...p, left: v } : p)) }));
                  }}
                  aria-label={`Lewa strona pary ${pi + 1}`}
                />
                <span className="shrink-0 text-muted" aria-hidden>
                  ↔
                </span>
                <input
                  className="input py-1.5"
                  value={pair.right}
                  maxLength={LIMITS.pairSide.max}
                  placeholder={`prawa ${pi + 1}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange((x) => ({ ...x, pairs: x.pairs.map((p, k) => (k === pi ? { ...p, right: v } : p)) }));
                  }}
                  aria-label={`Prawa strona pary ${pi + 1}`}
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-2 py-1"
                  disabled={q.pairs.length <= LIMITS.pairs.min}
                  aria-label={`Usuń parę ${pi + 1}`}
                  onClick={() => onChange((x) => ({ ...x, pairs: x.pairs.filter((_, k) => k !== pi) }))}
                >
                  −
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-ghost mt-2 px-3 py-1 text-xs"
            disabled={q.pairs.length >= LIMITS.pairs.max}
            onClick={() => onChange((x) => ({ ...x, pairs: [...x.pairs, emptyPair()] }))}
          >
            + dodaj parę
          </button>
          <p className="mt-2 text-xs text-muted">
            Uczeń zobaczy prawą kolumnę potasowaną i przeciąga ją na pasujące pola po lewej.
          </p>
        </fieldset>
      ) : (
        <fieldset className="mt-2">
          <legend className="label">Akceptowane odpowiedzi (wielkość liter i spacje na brzegach bez znaczenia)</legend>
          <ul className="space-y-2">
            {q.accepted.map((a, ai) => (
              <li key={ai} className="flex items-center gap-2">
                <input
                  className="input py-1.5 font-mono"
                  value={a}
                  maxLength={LIMITS.option.max}
                  placeholder={`wariant ${ai + 1}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange((x) => ({ ...x, accepted: x.accepted.map((o, k) => (k === ai ? v : o)) }));
                  }}
                />
                <button
                  type="button"
                  className="btn-ghost shrink-0 px-2 py-1"
                  disabled={q.accepted.length <= 1}
                  aria-label={`Usuń wariant ${ai + 1}`}
                  onClick={() => onChange((x) => ({ ...x, accepted: x.accepted.filter((_, k) => k !== ai) }))}
                >
                  −
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-ghost mt-2 px-3 py-1 text-xs"
            disabled={q.accepted.length >= LIMITS.accepted.max}
            onClick={() => onChange((x) => ({ ...x, accepted: [...x.accepted, ""] }))}
          >
            + wariant
          </button>
        </fieldset>
      )}

      {hasErrors && (
        <ul className="mt-3 space-y-0.5">
          {errors.map((er) => (
            <li key={er} className="text-sm text-danger">
              • {er}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
