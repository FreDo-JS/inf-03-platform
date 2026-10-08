"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analizuj, type AnalizaPytania, type AnalizaTestu, type Klucz } from "@/lib/analiza";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { pluralPytania } from "@/lib/tests";
import { parseQuestions } from "@/lib/validation";
import type { AttemptRow, PublicQuestion } from "@/types/db";
import { Check, TriangleAlert } from "lucide-react";

/**
 * Analiza pytań: które pytania klasa oblała i w co dokładnie wpadła.
 *
 * Dane biorą się z podejść wczytanych w zakładce Wyniki (kolumny answers /
 * results z migracji 018) zestawionych z treścią pytań i kluczem. Klucz
 * czytamy dopiero tutaj i tylko dla wybranego testu — to najbardziej wrażliwa
 * tabela w bazie, nie ma powodu trzymać jej w pamięci przy zwykłym przeglądaniu
 * wyników.
 */

type Props = { attempts: AttemptRow[] };

type Tresc = { questions: PublicQuestion[]; klucze: Klucz[] };

/** Kolor procentu: te same progi, co przy wynikach podejść. */
function kolor(udzial: number): string {
  return udzial >= 0.75 ? "text-accent" : udzial >= 0.5 ? "text-warn" : "text-danger";
}
function kolorTla(udzial: number): string {
  return udzial >= 0.75 ? "bg-accent" : udzial >= 0.5 ? "bg-warn" : "bg-danger";
}
const procent = (u: number) => `${Math.round(u * 100)}%`;

const TYP: Record<PublicQuestion["type"], string> = {
  closed: "zamknięte",
  select: "wybór z listy",
  input: "otwarte",
  matching: "dopasowanie",
  gaps: "luki w kodzie",
};

/** Pasek udziału — bez etykiety, bo liczby stoją obok w tabeli wariantów. */
function Pasek({ udzial, mocny }: { udzial: number; mocny: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={`h-full rounded-full ${mocny ? "bg-accent" : "bg-white/25"}`}
        style={{ width: `${Math.round(udzial * 100)}%` }}
      />
    </div>
  );
}

export function QuestionAnalysis({ attempts }: Props) {
  const [testId, setTestId] = useState<string>("");
  const [tresc, setTresc] = useState<Tresc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wgTrudnosci, setWgTrudnosci] = useState(true);

  // Testy, do których są jakiekolwiek podejścia. Usunięte testy odpadają:
  // bez treści pytań nie ma czego analizować (attempts.test_id = null).
  const testy = useMemo(() => {
    const mapa = new Map<string, { id: string; title: string; ile: number }>();
    for (const a of attempts) {
      if (a.test_id === null) continue;
      const wpis = mapa.get(a.test_id);
      if (wpis) wpis.ile++;
      else mapa.set(a.test_id, { id: a.test_id, title: a.test_title, ile: 1 });
    }
    return [...mapa.values()].sort((x, y) => y.ile - x.ile || x.title.localeCompare(y.title, "pl"));
  }, [attempts]);

  const usuniete = useMemo(() => attempts.filter((a) => a.test_id === null).length, [attempts]);

  // Pierwszy test wybieramy sami — najczęściej jest tylko jeden świeżo pisany.
  useEffect(() => {
    if (testId === "" && testy.length > 0) setTestId(testy[0]?.id ?? "");
  }, [testy, testId]);

  const load = useCallback(async () => {
    if (testId === "") return;
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const [testRes, keyRes] = await Promise.all([
      supabase.from("tests").select("questions").eq("id", testId).maybeSingle(),
      supabase.from("test_keys").select("answers").eq("test_id", testId).maybeSingle(),
    ]);
    setLoading(false);

    if (testRes.error || keyRes.error) {
      setTresc(null);
      setError(friendlyError(testRes.error ?? keyRes.error, "Nie udało się pobrać treści testu."));
      return;
    }
    const questions = parseQuestions(testRes.data?.questions);
    if (questions === null) {
      setTresc(null);
      setError("Nie udało się odczytać pytań tego testu.");
      return;
    }
    const surowy = keyRes.data?.answers;
    // Klucz pytania z lukami jest zagnieżdżony (warianty per luka), więc
    // zachowujemy obie postacie zamiast spłaszczać wszystko do listy napisów.
    const klucze: Klucz[] = Array.isArray(surowy)
      ? surowy.map((k) => {
          if (!Array.isArray(k)) return [];
          if (k.every((x) => Array.isArray(x))) {
            return (k as unknown[]).map((g) =>
              Array.isArray(g) ? g.filter((x): x is string => typeof x === "string") : [],
            );
          }
          return k.filter((x): x is string => typeof x === "string");
        })
      : [];
    setTresc({ questions, klucze });
  }, [testId]);

  useEffect(() => {
    void load();
  }, [load]);

  const analiza: AnalizaTestu | null = useMemo(() => {
    if (tresc === null) return null;
    const wybrane = attempts.filter((a) => a.test_id === testId);
    return analizuj(
      wybrane.map((a) => ({ score: a.score, total: a.total, answers: a.answers, results: a.results })),
      tresc.questions,
      tresc.klucze,
    );
  }, [attempts, testId, tresc]);

  const kolejnosc = useMemo(() => {
    if (analiza === null) return [];
    const lista = [...analiza.pytania];
    if (wgTrudnosci) lista.sort((a, b) => a.udzial - b.udzial || a.index - b.index);
    return lista;
  }, [analiza, wgTrudnosci]);

  if (testy.length === 0) {
    return (
      <p className="card p-6 text-muted">
        Brak podejść do analizy.
        {usuniete > 0 && " Wyniki, które tu są, dotyczą usuniętych testów — bez treści pytań nie ma czego analizować."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Test do analizy</span>
          <select className="input w-full" value={testId} onChange={(e) => setTestId(e.target.value)}>
            {testy.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.ile})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={wgTrudnosci ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
          onClick={() => setWgTrudnosci((v) => !v)}
          aria-pressed={wgTrudnosci}
        >
          {wgTrudnosci ? "od najtrudniejszych" : "w kolejności testu"}
        </button>
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      {loading || analiza === null ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
            <span className="text-sm">
              <span className="font-mono text-lg font-semibold">{analiza.uwzglednione}</span>{" "}
              <span className="text-muted">
                {analiza.uwzglednione === 1 ? "podejście w analizie" : "podejść w analizie"}
              </span>
            </span>
            {analiza.srednia !== null && (
              <span className="text-sm">
                <span className={`font-mono text-lg font-semibold ${kolor(analiza.srednia)}`}>
                  {procent(analiza.srednia)}
                </span>{" "}
                <span className="text-muted">średni wynik</span>
              </span>
            )}
            <span className="text-sm text-muted">
              {analiza.pytania.length} {pluralPytania(analiza.pytania.length)}
            </span>
          </div>

          {(analiza.bezOdpowiedzi > 0 || analiza.niezgodne > 0) && (
            <p className="card flex items-start gap-2 p-3 text-sm text-muted">
              <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warn" aria-hidden />
              <span>
                {analiza.bezOdpowiedzi > 0 && (
                  <>
                    Pominięto {analiza.bezOdpowiedzi}{" "}
                    {analiza.bezOdpowiedzi === 1 ? "podejście bez zapisanych odpowiedzi" : "podejść bez zapisanych odpowiedzi"}{" "}
                    (sprzed migracji <code>018_attempt_answers.sql</code>).{" "}
                  </>
                )}
                {analiza.niezgodne > 0 && (
                  <>
                    Pominięto {analiza.niezgodne}{" "}
                    {analiza.niezgodne === 1 ? "podejście do innej wersji testu" : "podejść do innej wersji testu"} — pytania
                    zmieniły się po ich napisaniu.
                  </>
                )}
              </span>
            </p>
          )}

          {analiza.uwzglednione === 0 ? (
            <p className="card p-6 text-muted">
              Żadne podejście do tego testu nie ma zapisanych odpowiedzi — analiza obejmuje testy pisane po wykonaniu
              migracji <code>018_attempt_answers.sql</code>.
            </p>
          ) : (
            <ol className="space-y-2">
              {kolejnosc.map((q) => (
                <PytanieKarta key={q.index} q={q} />
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function PytanieKarta({ q }: { q: AnalizaPytania }) {
  const { pytanie } = q;
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-xs text-muted">pytanie {q.index + 1}</span>
          <span className="chip">{TYP[pytanie.type]}</span>
        </div>
        <span className={`font-mono text-sm font-semibold ${kolor(q.udzial)}`}>
          {procent(q.udzial)} <span className="text-xs font-normal text-muted">poprawnych</span>
        </span>
      </div>

      <p className="mt-2 break-words leading-snug">{pytanie.text}</p>

      {pytanie.type === "gaps" && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-white/[0.03] p-3 font-mono text-xs leading-6">
          {pytanie.code}
        </pre>
      )}

      <div className="mt-2">
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full ${kolorTla(q.udzial)}`}
            style={{ width: `${Math.round(q.udzial * 100)}%` }}
          />
        </div>
      </div>

      {q.pary.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {q.pary.map((p) => (
            <li key={p.lewa} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 break-words">
                  {p.lewa} <span className="text-muted">→</span>{" "}
                  <span className="text-accent">{p.poprawna}</span>
                </span>
                <span className={`shrink-0 font-mono text-xs ${kolor(p.udzial)}`}>
                  {p.trafien} · {procent(p.udzial)}
                </span>
              </div>
              <div className="mt-1">
                <Pasek udzial={p.udzial} mocny={false} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 space-y-2">
          {q.warianty.map((w) => (
            <li key={`${w.etykieta}-${w.brak}`} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={`flex min-w-0 items-baseline gap-1.5 break-words ${w.brak ? "text-muted" : ""}`}>
                  {w.poprawna && <Check size={13} className="shrink-0 text-accent" aria-label="poprawna" />}
                  <span className={w.poprawna ? "text-accent" : undefined}>{w.etykieta}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {w.liczba} · {procent(w.udzial)}
                </span>
              </div>
              <div className="mt-1">
                <Pasek udzial={w.udzial} mocny={w.poprawna} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Klucz przy pytaniu otwartym: uczeń mógł trafić w wariant, którego nie
          widać w rozkładzie, bo nikt go nie użył. */}
      {pytanie.type === "input" && q.klucz.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          klucz: <span className="text-accent">{q.klucz.join(" · ")}</span>
        </p>
      )}
    </li>
  );
}
