"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyError, isDuplicateAttempt } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatDuration, pluralPytania } from "@/lib/tests";
import {
  LIMITS,
  parseBeginSession,
  parseOpenTest,
  parseSubmitResult,
  sanitizeAnswers,
  validatePin,
  validateStudentName,
} from "@/lib/validation";
import type { OpenedTest, SubmitResult } from "@/types/db";
import { PinInput } from "./PinInput";

type Props = {
  testId: string;
  title: string;
  timeLimitSec: number;
  questionCount: number;
};

type Phase = "pin" | "name" | "running" | "submitting" | "done" | "error";

// Kolory odpowiedzi w stylu Kahoot (pełne nazwy klas — wymagane przez Tailwind).
const OPTION_STYLES = [
  { badge: "bg-accent text-bg", ring: "border-accent bg-accent/10" },
  { badge: "bg-accent2 text-bg", ring: "border-accent2 bg-accent2/10" },
  { badge: "bg-violet text-bg", ring: "border-violet bg-violet/10" },
  { badge: "bg-warn text-bg", ring: "border-warn bg-warn/10" },
] as const;

const SESSION_ERRORS = ["session_invalid", "session_used", "session_expired"];

export function Quiz({ testId, title, timeLimitSec, questionCount }: Props) {
  const [phase, setPhase] = useState<Phase>("pin");
  const [test, setTest] = useState<OpenedTest | null>(null);

  // PIN
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinShake, setPinShake] = useState(0);
  const [checkingPin, setCheckingPin] = useState(false);

  // imię
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [studentName, setStudentName] = useState("");

  // przebieg
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(timeLimitSec);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const answersRef = useRef(answers);
  const startedAtRef = useRef(0);
  const submittingRef = useRef(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const total = test?.questions.length ?? questionCount;
  const limitSec = test?.timeLimitSec ?? timeLimitSec;

  // ------------------------------------------------------------ 1. PIN
  const checkPin = useCallback(
    async (raw: string) => {
      if (checkingPin) return;
      const v = validatePin(raw);
      if (!v.ok) {
        setPinError(v.error);
        return;
      }
      setCheckingPin(true);
      setPinError(null);
      const { data, error } = await getBrowserSupabase().rpc("open_test", { p_test_id: testId, p_pin: v.value });
      setCheckingPin(false);

      if (error) {
        setPinError(friendlyError(error, "Nie udało się sprawdzić PIN-u. Spróbuj ponownie."));
        return;
      }
      const parsed = parseOpenTest(data);
      if (!parsed) {
        setPinError("Nie udało się otworzyć testu.");
        return;
      }
      if (!parsed.ok) {
        setPin("");
        setPinShake((n) => n + 1);
        setPinError(
          parsed.reason === "bad_pin"
            ? "Nieprawidłowy PIN. Zapytaj nauczyciela o aktualny kod."
            : parsed.reason === "rate_limited"
              ? "Zbyt wiele błędnych prób. Odczekaj kilka minut."
              : "Ten test już nie istnieje.",
        );
        return;
      }
      setTest(parsed.value);
      setAnswers(Array<string | null>(parsed.value.questions.length).fill(null));
      setCurrent(0);
      setPhase("name");
    },
    [checkingPin, testId],
  );

  // ------------------------------------------------------------ 2. imię + start
  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test || starting) return;
    const r = validateStudentName(nameInput);
    if (!r.ok) {
      setNameError(r.error);
      return;
    }
    setStarting(true);
    setNameError(null);
    const { data, error } = await getBrowserSupabase().rpc("begin_session", {
      p_session_id: test.sessionId,
      p_student_name: r.value,
    });
    setStarting(false);

    if (error) {
      if (SESSION_ERRORS.some((s) => error.message.includes(s))) {
        resetToPin(friendlyError(error));
        return;
      }
      setNameError(friendlyError(error, "Nie udało się rozpocząć testu."));
      return;
    }
    const name = parseBeginSession(data);
    if (!name) {
      setNameError("Nie udało się rozpocząć testu.");
      return;
    }
    setStudentName(name);
    startedAtRef.current = Date.now();
    setRemaining(test.timeLimitSec);
    setPhase("running");
  };

  const resetToPin = (msg: string) => {
    setTest(null);
    setPin("");
    setPinError(msg);
    setPhase("pin");
  };

  // ------------------------------------------------------------ 3. wysłanie
  const submit = useCallback(async () => {
    if (!test || submittingRef.current || submittedRef.current) return;
    submittingRef.current = true;
    setPhase("submitting");
    setErrorMsg(null);

    const { data, error } = await getBrowserSupabase().rpc("submit_attempt", {
      p_session_id: test.sessionId,
      p_answers: sanitizeAnswers(answersRef.current, test.questions.length),
    });
    submittingRef.current = false;

    if (error) {
      const fatal = isDuplicateAttempt(error) || SESSION_ERRORS.some((s) => error.message.includes(s));
      if (fatal) submittedRef.current = true;
      setCanRetry(!fatal);
      setErrorMsg(friendlyError(error, "Nie udało się zapisać wyniku. Sprawdź internet i spróbuj ponownie."));
      setPhase("error");
      return;
    }
    const parsed = parseSubmitResult(data);
    if (!parsed) {
      setCanRetry(false);
      setErrorMsg("Wynik zapisano, ale nie udało się go wyświetlić.");
      setPhase("error");
      return;
    }
    submittedRef.current = true;
    setResult(parsed);
    setPhase("done");
  }, [test]);

  // Odliczanie od znacznika startu (odporne na usypianie kart w tle).
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const left = limitSec - Math.floor((Date.now() - startedAtRef.current) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        setTimedOut(true);
        void submit();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [phase, limitSec, submit]);

  useEffect(() => {
    if (phase !== "running") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const setAnswer = (value: string | null) =>
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = value;
      return next;
    });

  const header = (
    <div className="text-center">
      <p className="eyebrow">{"$ ./start-test"}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{test?.title ?? title}</h1>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <span className="chip">
          {total} {pluralPytania(total)}
        </span>
        <span className="chip">⏱ {Math.round(limitSec / 60)} min</span>
      </div>
    </div>
  );

  // ================================================================ PIN
  if (phase === "pin") {
    return (
      <div className="mx-auto max-w-md animate-fade-up">
        <div className="card p-6 sm:p-8">
          {header}
          <form
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              void checkPin(pin);
            }}
            noValidate
          >
            <p className="label text-center">Wpisz PIN od nauczyciela</p>
            <div className="mt-3">
              <PinInput
                key={pinShake}
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (pinError) setPinError(null);
                }}
                onComplete={(v) => void checkPin(v)}
                disabled={checkingPin}
                invalid={pinError !== null && pinShake > 0}
                autoFocus
              />
            </div>
            <div className="mt-4 min-h-[1.5rem] text-center" aria-live="polite">
              {pinError && <p className="text-sm text-danger">{pinError}</p>}
            </div>
            <button type="submit" className="btn-primary mt-2 w-full py-3" disabled={checkingPin || pin.length !== LIMITS.pinLength}>
              {checkingPin ? "Sprawdzanie…" : "Dalej →"}
            </button>
          </form>
          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            🔒 PIN chroni test przed osobami spoza klasy. Nauczyciel może go zmienić przed każdą lekcją.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link href="/testy" className="text-sm text-muted transition hover:text-accent">
            ← wszystkie testy
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================ IMIĘ
  if (phase === "name") {
    return (
      <div className="mx-auto max-w-md animate-fade-up">
        <div className="card p-6 sm:p-8">
          {header}
          <div className="alert-ok mt-6 text-center">✓ PIN poprawny — możesz podejść do testu</div>
          <form onSubmit={start} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="student-name" className="label">
                Twoje imię
              </label>
              <input
                id="student-name"
                className="input py-3 text-base"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (nameError) setNameError(null);
                }}
                maxLength={LIMITS.studentName.max}
                autoComplete="given-name"
                placeholder="np. Ania K."
                autoFocus
                aria-invalid={nameError !== null}
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError && (
                <p id="name-error" className="field-error">
                  {nameError}
                </p>
              )}
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={starting}>
              {starting ? "Startowanie…" : "Rozpocznij test ▶"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted">
            Czas liczy się od kliknięcia. Po jego upływie test zakończy się automatycznie.
          </p>
        </div>
      </div>
    );
  }

  // ================================================================ WYNIK
  if (phase === "done" && result && test) {
    const pct = Math.round((result.score / result.total) * 100);
    const r = 52;
    const circ = 2 * Math.PI * r;
    const verdict = pct >= 75 ? "Świetnie! 🎉" : pct >= 50 ? "Nieźle, tak trzymaj 💪" : "Warto powtórzyć materiał 📚";
    return (
      <div className="mx-auto max-w-2xl animate-fade-up space-y-4">
        <div className="card p-6 text-center sm:p-8">
          <p className="eyebrow">{timedOut ? "// czas minął" : "// test zakończony"}</p>
          <div className="relative mx-auto mt-5 h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="ring" x1="0" x2="1">
                  <stop offset="0%" stopColor="#2de2c1" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="url(#ring)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                className="transition-[stroke-dashoffset] duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold">
                {result.score}/{result.total}
              </span>
              <span className="font-mono text-sm text-accent">{pct}%</span>
            </div>
          </div>
          <p className="mt-4 text-xl font-semibold">{verdict}</p>
          <p className="mt-1 text-muted">
            {studentName} · czas {formatDuration(result.durationSec)}
          </p>
        </div>

        <ol className="card divide-y divide-white/[0.06] overflow-hidden">
          {test.questions.map((q, i) => {
            const ok = result.results[i] === true;
            return (
              <li key={i} className="flex items-start gap-3 p-4 sm:p-5">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    ok ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                  }`}
                  aria-label={ok ? "poprawna" : "błędna"}
                  role="img"
                >
                  {ok ? "✓" : "✗"}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted">pytanie {i + 1}</p>
                  <p className="mt-0.5 break-words leading-snug">{q.text}</p>
                  <p className="mt-1.5 break-words text-sm text-muted">
                    Twoja odpowiedź: <span className={ok ? "text-accent" : "text-fg"}>{answers[i] ?? "— brak —"}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-center text-xs text-muted">Poprawne odpowiedzi nie są pokazywane — test można powtórzyć.</p>
        <div className="flex justify-center">
          <Link href="/testy" className="btn-ghost">
            ← wróć do listy testów
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================ BŁĄD
  if (phase === "error") {
    return (
      <div className="card mx-auto max-w-md animate-fade-up p-8 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="mt-3 text-lg font-semibold">Coś poszło nie tak</p>
        <p className="mt-1 text-muted">{errorMsg}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {canRetry && (
            <button type="button" className="btn-primary" onClick={() => void submit()}>
              Spróbuj ponownie
            </button>
          )}
          <Link href="/testy" className="btn-ghost">
            Lista testów
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================ PYTANIA
  if (!test) return null;
  const q = test.questions[current];
  if (!q) return null;
  const answer = answers[current] ?? null;
  const isLast = current === total - 1;
  const answeredCount = answers.filter((a) => a !== null && a.trim() !== "").length;
  const lowTime = remaining <= 30;
  const busy = phase === "submitting";
  const timePct = limitSec > 0 ? (remaining / limitSec) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* pasek: tytuł + zegar */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{test.title}</p>
            <p className="truncate text-sm text-muted">👤 {studentName}</p>
          </div>
          <div
            className={`shrink-0 rounded-xl border px-3.5 py-1.5 font-mono text-xl font-bold tabular-nums sm:text-2xl ${
              lowTime ? "animate-pulse border-danger/60 bg-danger/10 text-danger" : "border-accent/40 bg-accent/5 text-accent"
            }`}
            role="timer"
            aria-label="Pozostały czas"
          >
            {formatDuration(remaining)}
          </div>
        </div>
        <div className="h-1 bg-white/[0.05]">
          <div
            className={`h-full transition-[width] duration-300 ${lowTime ? "bg-danger" : "bg-gradient-to-r from-accent to-accent2"}`}
            style={{ width: `${timePct}%` }}
          />
        </div>
      </div>

      {/* nawigacja po pytaniach */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" aria-label="Pytania">
          {test.questions.map((_, i) => {
            const answered = answers[i] !== null && answers[i]?.trim() !== "";
            return (
              <button
                key={i}
                type="button"
                disabled={busy}
                onClick={() => setCurrent(i)}
                aria-label={`Pytanie ${i + 1}${answered ? " (odpowiedziano)" : ""}`}
                aria-current={i === current ? "step" : undefined}
                className={`h-8 w-8 rounded-lg font-mono text-xs font-semibold transition ${
                  i === current
                    ? "bg-gradient-to-br from-accent to-accent2 text-bg shadow-glow"
                    : answered
                      ? "border border-accent/40 bg-accent/10 text-accent"
                      : "border border-line bg-white/[0.02] text-muted hover:text-fg"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <span className="chip">
          odpowiedzi: {answeredCount}/{total}
        </span>
      </div>

      {/* pytanie */}
      <div key={current} className="card animate-fade-up p-5 sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">
            pytanie {current + 1} z {total}
          </span>
          <span className="chip">
            {q.type === "closed" ? "wybierz jedną" : q.type === "select" ? "wybierz z listy" : "wpisz odpowiedź"}
          </span>
        </div>
        <h2 className="mt-4 break-words text-xl font-semibold leading-snug sm:text-2xl">{q.text}</h2>

        <div className="mt-6">
          {q.type === "closed" && (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Odpowiedzi">
              {q.options.map((opt, i) => {
                const selected = answer === opt;
                const style = OPTION_STYLES[i % OPTION_STYLES.length] ?? OPTION_STYLES[0];
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={busy}
                    onClick={() => setAnswer(opt)}
                    className={`group flex min-h-[3.75rem] items-center gap-3 rounded-xl border-2 p-3 text-left transition active:scale-[0.99]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                        selected ? style.ring : "border-line bg-bg/50 hover:border-white/20 hover:bg-white/[0.03]"
                      }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${style.badge} ${
                        selected ? "" : "opacity-80 group-hover:opacity-100"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="break-words text-[15px] font-medium">{opt}</span>
                    {selected && <span className="ml-auto text-lg">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "select" && (
            <select
              className="input py-3 text-base"
              value={answer ?? ""}
              disabled={busy}
              onChange={(e) => setAnswer(e.target.value === "" ? null : e.target.value)}
              aria-label="Wybierz odpowiedź"
            >
              <option value="">— wybierz odpowiedź —</option>
              {q.options.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {q.type === "input" && (
            <input
              className="input py-3 font-mono text-lg"
              value={answer ?? ""}
              disabled={busy}
              maxLength={LIMITS.answer.max}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLast) {
                  e.preventDefault();
                  setCurrent((c) => Math.min(total - 1, c + 1));
                }
              }}
              placeholder="wpisz odpowiedź…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
              aria-label="Twoja odpowiedź"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-ghost"
          disabled={current === 0 || busy}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          ← Wstecz
        </button>
        {isLast ? (
          <button type="button" className="btn-primary px-6" disabled={busy} onClick={() => void submit()}>
            {busy ? "Zapisywanie…" : "Zakończ test ✓"}
          </button>
        ) : (
          <button type="button" className="btn-primary px-6" disabled={busy} onClick={() => setCurrent((c) => c + 1)}>
            Dalej →
          </button>
        )}
      </div>
    </div>
  );
}
