"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { TEST_SUMMARY_COLUMNS, pluralPytania, toSummaries, type TestSummary } from "@/lib/tests";
import { isUuid, validatePin } from "@/lib/validation";
import { PinPresenter } from "./PinPresenter";

type TestWithPin = TestSummary & { pin: string | null };

export function TestsTab() {
  const [tests, setTests] = useState<TestWithPin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [presenting, setPresenting] = useState<TestWithPin | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const closePresenter = useCallback(() => setPresenting(null), []);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    const [t, k] = await Promise.all([
      supabase.from("tests").select(TEST_SUMMARY_COLUMNS).order("created_at", { ascending: false }),
      supabase.from("test_keys").select("test_id, pin"),
    ]);
    if (t.error || k.error) {
      setError(friendlyError(t.error ?? k.error, "Nie udało się pobrać testów."));
      setTests([]);
      return;
    }
    const pins = new Map(k.data.map((r) => [r.test_id, r.pin]));
    setTests(toSummaries(t.data).map((s) => ({ ...s, pin: pins.get(s.id) ?? null })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rotatePin = async (t: TestWithPin) => {
    if (busyId || !isUuid(t.id)) return;
    if (!window.confirm(`Wygenerować nowy PIN dla „${t.title}”? Stary PIN przestanie działać (rozpoczęte testy dokończą się normalnie).`)) return;
    setBusyId(t.id);
    setError(null);
    const { data, error: dbError } = await getBrowserSupabase().rpc("set_test_pin", { p_test_id: t.id });
    setBusyId(null);
    const pin = validatePin(data);
    if (dbError || !pin.ok) {
      setError(friendlyError(dbError, "Nie udało się zmienić PIN-u."));
      return;
    }
    setTests((prev) => (prev ?? []).map((x) => (x.id === t.id ? { ...x, pin: pin.value } : x)));
    setRevealed((prev) => new Set(prev).add(t.id));
  };

  const copyPin = async (t: TestWithPin) => {
    if (!t.pin) return;
    try {
      await navigator.clipboard.writeText(t.pin);
      setCopied(t.id);
      window.setTimeout(() => setCopied((c) => (c === t.id ? null : c)), 1500);
    } catch {
      /* schowek niedostępny */
    }
  };

  const remove = async (t: TestWithPin) => {
    if (busyId || !isUuid(t.id)) return;
    if (!window.confirm(`Usunąć test „${t.title}”? Wyniki uczniów zostaną zachowane.`)) return;
    setBusyId(t.id);
    setError(null);
    const { error: dbError } = await getBrowserSupabase().from("tests").delete().eq("id", t.id);
    setBusyId(null);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się usunąć testu."));
      return;
    }
    setTests((prev) => (prev ?? []).filter((x) => x.id !== t.id));
  };

  if (tests === null) return <p className="text-sm text-muted">Ładowanie…</p>;

  return (
    <div className="space-y-4">
      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}
      {tests.length === 0 ? (
        <p className="card p-8 text-center text-muted">Brak testów — utwórz pierwszy w zakładce „Nowy test”.</p>
      ) : (
        <ul className="space-y-3">
          {tests.map((t) => {
            const show = revealed.has(t.id);
            const busy = busyId === t.id;
            return (
              <li key={t.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-lg font-semibold leading-snug">{t.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">
                        {t.questionCount} {pluralPytania(t.questionCount)}
                      </span>
                      <span className="chip">⏱ {Math.round(t.timeLimitSec / 60)} min</span>
                      <span className="chip">📅 {new Date(t.createdAt).toLocaleDateString("pl-PL")}</span>
                    </div>
                  </div>

                  {/* PIN */}
                  <div className="rounded-xl border border-line bg-bg/60 p-3">
                    <p className="label mb-1">PIN testu</p>
                    <div className="flex items-center gap-2">
                      <span className="min-w-[7.5rem] font-mono text-2xl font-bold tracking-[0.25em] text-accent">
                        {t.pin ? (show ? t.pin : "••••••") : "—"}
                      </span>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => toggleReveal(t.id)}
                        disabled={!t.pin}
                        aria-label={show ? "Ukryj PIN" : "Pokaż PIN"}
                      >
                        {show ? "ukryj" : "pokaż"}
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => void copyPin(t)} disabled={!t.pin}>
                        {copied === t.id ? "✓" : "kopiuj"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  <button type="button" className="btn-primary btn-sm" onClick={() => setPresenting(t)} disabled={!t.pin}>
                    📺 Pokaż PIN klasie
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => void rotatePin(t)} disabled={busyId !== null}>
                    {busy ? "…" : "🔄 Nowy PIN"}
                  </button>
                  <Link href={`/testy/${t.id}`} className="btn-ghost btn-sm" target="_blank">
                    Podgląd ↗
                  </Link>
                  <button
                    type="button"
                    className="btn-danger btn-sm ml-auto"
                    disabled={busyId !== null}
                    onClick={() => void remove(t)}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {presenting?.pin && (
        <PinPresenter
          title={presenting.title}
          pin={presenting.pin}
          onClose={closePresenter}
        />
      )}
    </div>
  );
}
