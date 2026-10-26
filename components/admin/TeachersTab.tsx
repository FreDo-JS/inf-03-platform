"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Portal } from "@/components/shell/Portal";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { PlanTeacherRow, SubjectRow } from "@/types/db";
import { Plus, Trash2, X } from "lucide-react";

/**
 * Przydział przedmiotów: kto co prowadzi.
 *
 * Tabela z kartki nauczyciela — przedmioty u góry, nauczyciele po lewej,
 * krzyżyki w środku. Nagłówek kolumny otwiera okno z działami mapy nauki
 * przypisanymi do tego przedmiotu (same główne tematy, bez podtematów).
 *
 * Lista nauczycieli jest niezależna od kont w aplikacji (tabela `plan_teachers`)
 * — plan układa się dla całego grona, nie tylko dla osób, które się logują.
 */

type Dzial = { id: string; title: string; subject_id: string | null };
type Powiazanie = { category_id: string; subject_id: string };

/** Klucz krzyżyka w zbiorze — para nauczyciel + przedmiot. */
const klucz = (teacherId: string, subjectId: string) => `${teacherId}|${subjectId}`;

export function TeachersTab() {
  const [subjects, setSubjects] = useState<SubjectRow[] | null>(null);
  const [teachers, setTeachers] = useState<PlanTeacherRow[]>([]);
  const [krzyzyki, setKrzyzyki] = useState<Set<string>>(new Set());
  const [dzialy, setDzialy] = useState<Dzial[]>([]);
  const [powiazania, setPowiazania] = useState<Powiazanie[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brakMigracji, setBrakMigracji] = useState(false);
  const [busy, setBusy] = useState(false);
  const [podglad, setPodglad] = useState<SubjectRow | null>(null);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    const [przedmioty, nauczyciele, przydzialy, kategorie, zakresy] = await Promise.all([
      supabase.from("subjects").select("id, title, position, qualification").order("position"),
      supabase.from("plan_teachers").select("id, name, position, created_at").order("position"),
      supabase.from("teacher_subjects").select("teacher_id, subject_id"),
      supabase.from("categories").select("id, title, subject_id").order("position"),
      supabase.from("category_subjects").select("category_id, subject_id"),
    ]);

    // Brak tabel = migracja 022 jeszcze nie wklejona w SQL Editorze.
    const brakTabeli = [przedmioty, nauczyciele, przydzialy].some(
      (r) => r.error !== null && (r.error.code === "42P01" || r.error.message.includes("does not exist")),
    );
    if (brakTabeli) {
      setBrakMigracji(true);
      setSubjects([]);
      return;
    }
    if (przedmioty.error || nauczyciele.error || przydzialy.error) {
      setError(friendlyError(przedmioty.error ?? nauczyciele.error ?? przydzialy.error, "Nie udało się pobrać planu."));
      setSubjects([]);
      return;
    }

    setBrakMigracji(false);
    setError(null);
    setSubjects(przedmioty.data);
    setTeachers(nauczyciele.data);
    setKrzyzyki(new Set(przydzialy.data.map((p) => klucz(p.teacher_id, p.subject_id))));
    setDzialy(kategorie.error ? [] : kategorie.data);
    // Brak tabeli = baza jest jeszcze przed migracją 030. Wtedy null włącza
    // starą ścieżkę: jeden dział = jeden przedmiot (categories.subject_id).
    setPowiazania(zakresy.error ? null : zakresy.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

/**
   * Działy mapy przypisane do przedmiotu — treść okna po kliknięciu w nagłówek.
   *
   * Źródłem jest tabela `category_subjects` (migracja 030): dział może należeć
   * do kilku przedmiotów, więc „Programowanie aplikacji internetowych" i trzy
   * pokrewne przedmioty pokazują te same działy, a mapa pozostaje jedna.
   * Dopóki migracji nie ma, działa stara ścieżka z `categories.subject_id`.
   */
  const dzialyPrzedmiotu = useMemo(() => {
    const mapa = new Map<string, Dzial[]>();
    const kolejnosc = new Map(dzialy.map((d, i) => [d.id, i]));

    if (powiazania === null) {
      for (const d of dzialy) {
        if (d.subject_id === null) continue;
        mapa.set(d.subject_id, [...(mapa.get(d.subject_id) ?? []), d]);
      }
      return mapa;
    }

    const poId = new Map(dzialy.map((d) => [d.id, d]));
    for (const p of powiazania) {
      const dzial = poId.get(p.category_id);
      if (dzial === undefined) continue;
      mapa.set(p.subject_id, [...(mapa.get(p.subject_id) ?? []), dzial]);
    }
    // Kolejność jak w mapie nauki, nie jak w tabeli powiązań.
    for (const [przedmiot, lista] of mapa) {
      mapa.set(przedmiot, [...lista].sort((a, b) => (kolejnosc.get(a.id) ?? 0) - (kolejnosc.get(b.id) ?? 0)));
    }
    return mapa;
  }, [dzialy, powiazania]);

  /**
   * Krzyżyk stawiamy od razu w interfejsie i cofamy przy błędzie — klikanie
   * po całej tabeli ma być płynne, a to jedna wartość logiczna, nie formularz.
   */
  const przelacz = async (teacherId: string, subjectId: string) => {
    const k = klucz(teacherId, subjectId);
    const byl = krzyzyki.has(k);
    setKrzyzyki((prev) => {
      const next = new Set(prev);
      if (byl) next.delete(k);
      else next.add(k);
      return next;
    });
    setError(null);

    const supabase = getBrowserSupabase();
    const { error: dbError } = byl
      ? await supabase.from("teacher_subjects").delete().eq("teacher_id", teacherId).eq("subject_id", subjectId)
      : await supabase.from("teacher_subjects").insert({ teacher_id: teacherId, subject_id: subjectId });

    if (dbError) {
      setKrzyzyki((prev) => {
        const next = new Set(prev);
        if (byl) next.add(k);
        else next.delete(k);
        return next;
      });
      setError(friendlyError(dbError, "Nie udało się zapisać zmiany."));
    }
  };

  const dodajNauczyciela = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const pozycja = Math.min((teachers.at(-1)?.position ?? 0) + 1, 99);
    const { data, error: dbError } = await getBrowserSupabase()
      .from("plan_teachers")
      .insert({ name: `Nauczyciel ${teachers.length + 1}`, position: pozycja })
      .select("id, name, position, created_at")
      .single();
    setBusy(false);
    if (dbError || !data) {
      setError(friendlyError(dbError, "Nie udało się dodać nauczyciela."));
      return;
    }
    setTeachers((prev) => [...prev, data]);
  };

  const zmienNazwe = async (t: PlanTeacherRow, nazwa: string) => {
    const czysta = nazwa.replace(/\s+/g, " ").trim();
    if (czysta === "" || czysta === t.name) {
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: t.name } : x)));
      return;
    }
    const { error: dbError } = await getBrowserSupabase()
      .from("plan_teachers")
      .update({ name: czysta })
      .eq("id", t.id);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się zmienić nazwiska."));
      setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: t.name } : x)));
      return;
    }
    setTeachers((prev) => prev.map((x) => (x.id === t.id ? { ...x, name: czysta } : x)));
  };

  const usunNauczyciela = async (t: PlanTeacherRow) => {
    if (busy) return;
    if (!window.confirm(`Usunąć z planu: ${t.name}?\n\nZnikną też jego krzyżyki przy przedmiotach.`)) return;
    setBusy(true);
    setError(null);
    const { error: dbError } = await getBrowserSupabase().from("plan_teachers").delete().eq("id", t.id);
    setBusy(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się usunąć nauczyciela."));
      return;
    }
    setTeachers((prev) => prev.filter((x) => x.id !== t.id));
    setKrzyzyki((prev) => new Set([...prev].filter((k) => !k.startsWith(`${t.id}|`))));
  };

  if (subjects === null) return <p className="text-sm text-muted">Ładowanie…</p>;

  if (brakMigracji) {
    return (
      <p className="card p-6 text-muted">
        Ta sekcja potrzebuje tabel z migracji <code>supabase/022_przedmioty_nauczyciele.sql</code> — uruchom ją
        w SQL Editorze, a potem odśwież stronę.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <h2 className="section-title">Kto prowadzi który przedmiot</h2>
        <p className="mt-1 text-sm text-muted">
          Kliknij kratkę, żeby postawić lub zdjąć krzyżyk. Nazwisko zmienisz, pisząc wprost w polu. Kliknięcie
          w nazwę przedmiotu pokazuje działy mapy nauki, które się na nim realizuje.
        </p>
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      {/* Telefon: tabela z sześcioma kolumnami byłaby nieczytelna, więc każdy
          nauczyciel dostaje kartę z przedmiotami jako przełącznikami. */}
      <ul className="space-y-2 md:hidden">
        {teachers.map((t) => (
          <li key={t.id} className="card p-3">
            <div className="flex items-center gap-2">
              <input
                className="input min-w-0 flex-1 py-1.5 font-medium"
                defaultValue={t.name}
                maxLength={80}
                onBlur={(e) => void zmienNazwe(t, e.target.value)}
                aria-label="Nazwisko nauczyciela"
              />
              <button
                type="button"
                className="btn-danger btn-sm shrink-0"
                onClick={() => void usunNauczyciela(t)}
                disabled={busy}
                aria-label={`Usuń z planu: ${t.name}`}
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const ma = krzyzyki.has(klucz(t.id, s.id));
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${ma ? "border-accent/60 bg-accent/10 text-accent" : ""}`}
                    onClick={() => void przelacz(t.id, s.id)}
                    aria-pressed={ma}
                  >
                    {ma && <X size={12} aria-hidden />} {s.title}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-muted">Nauczyciel</th>
              {subjects.map((s) => (
                <th key={s.id} className="px-2 py-2 align-bottom">
                  <button
                    type="button"
                    className="nav-link w-full justify-center text-center text-xs leading-tight"
                    onClick={() => setPodglad(s)}
                    title="Pokaż działy tego przedmiotu"
                  >
                    {s.title}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {teachers.map((t) => (
              <tr key={t.id} className="transition hover:bg-white/[0.03]">
                <td className="px-4 py-2">
                  <input
                    className="input w-48 py-1.5 font-medium"
                    defaultValue={t.name}
                    maxLength={80}
                    onBlur={(e) => void zmienNazwe(t, e.target.value)}
                    aria-label="Nazwisko nauczyciela"
                  />
                </td>
                {subjects.map((s) => {
                  const ma = krzyzyki.has(klucz(t.id, s.id));
                  return (
                    <td key={s.id} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                          ma
                            ? "border-accent/60 bg-accent/10 text-accent"
                            : "border-line text-muted hover:border-accent/40 hover:text-fg"
                        }`}
                        onClick={() => void przelacz(t.id, s.id)}
                        aria-pressed={ma}
                        aria-label={`${t.name} — ${s.title}`}
                      >
                        {ma ? <X size={16} aria-hidden /> : <span className="text-xs">—</span>}
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => void usunNauczyciela(t)}
                    disabled={busy}
                    aria-label={`Usuń z planu: ${t.name}`}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={subjects.length + 2}>
                  Brak nauczycieli na liście — dodaj pierwszego.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-ghost btn-sm" onClick={() => void dodajNauczyciela()} disabled={busy}>
        <Plus size={14} aria-hidden /> dodaj nauczyciela
      </button>

      {podglad !== null && (
        <SubjectModal
          subject={podglad}
          dzialy={dzialyPrzedmiotu.get(podglad.id) ?? []}
          onClose={() => setPodglad(null)}
        />
      )}
    </div>
  );
}

/**
 * Działy mapy przypisane do przedmiotu. Modal idzie przez Portal — nakładka
 * `fixed` w drzewie treści łapie marginesy kontenera (patrz CLAUDE.md).
 */
function SubjectModal({
  subject,
  dzialy,
  onClose,
}: {
  subject: SubjectRow;
  dzialy: Dzial[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`Działy przedmiotu: ${subject.title}`}
        onClick={onClose}
      >
        <div
          className="card max-h-[80vh] w-full max-w-lg overflow-y-auto p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">{"// przedmiot"}</p>
              <h3 className="mt-1 break-words text-lg font-semibold">{subject.title}</h3>
            </div>
            <button type="button" className="btn-ghost btn-sm shrink-0" onClick={onClose} aria-label="Zamknij">
              <X size={14} aria-hidden />
            </button>
          </div>

          {dzialy.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Do tego przedmiotu nie przypisano jeszcze żadnego działu mapy nauki.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">
                Działy mapy nauki realizowane na tym przedmiocie:
              </p>
              <ol className="mt-2 space-y-1.5">
                {dzialy.map((d, i) => (
                  <li key={d.id} className="flex items-baseline gap-2 text-sm">
                    <span className="font-mono text-xs text-muted">{i + 1}.</span>
                    <span className="break-words">{d.title}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
