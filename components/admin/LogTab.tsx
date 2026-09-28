"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { teacherNames } from "@/components/TeacherMark";
import { friendlyError } from "@/lib/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { CLASS_NAMES, type ProgressLogRow, type SubtopicRow, type TeacherRow } from "@/types/db";

type Props = {
  subtopics: SubtopicRow[];
  teachers?: TeacherRow[];
};

const LIMIT = 500;

/**
 * Dziennik oznaczeń: kto, kiedy i w której klasie odhaczył lub cofnął temat.
 *
 * Wpisy tworzy trigger w bazie (migracja 014), więc historia zostaje nawet po
 * odznaczeniu tematu — sama tabela progress trzyma tylko stan bieżący.
 */
export function LogTab({ subtopics, teachers = [] }: Props) {
  const [rows, setRows] = useState<ProgressLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brakMigracji, setBrakMigracji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [klasa, setKlasa] = useState<string>("");
  const [filtr, setFiltr] = useState("");
  const [sprzatanie, setSprzatanie] = useState(false);

  const names = useMemo(() => teacherNames(teachers), [teachers]);
  const tematy = useMemo(() => new Map(subtopics.map((s) => [s.id, s.title])), [subtopics]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: dbError } = await getBrowserSupabase()
      .from("progress_log")
      .select("id, class_name, subtopic_id, action, actor, at")
      .order("at", { ascending: false })
      .limit(LIMIT);
    setLoading(false);
    if (dbError) {
      // 42P01 / brak w cache schematu = migracja jeszcze nieuruchomiona
      const brak = dbError.code === "42P01" || /does not exist|schema cache/i.test(dbError.message ?? "");
      setBrakMigracji(brak);
      if (!brak) setError(friendlyError(dbError, "Nie udało się pobrać dziennika."));
      setRows([]);
      return;
    }
    setBrakMigracji(false);
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const widoczne = useMemo(() => {
    if (!rows) return [];
    const f = filtr.trim().toLowerCase();
    return rows.filter((r) => {
      if (klasa !== "" && r.class_name !== klasa) return false;
      if (f === "") return true;
      const temat = (tematy.get(r.subtopic_id) ?? r.subtopic_id).toLowerCase();
      const kto = (r.actor === null ? "" : (names.get(r.actor) ?? "")).toLowerCase();
      return temat.includes(f) || kto.includes(f);
    });
  }, [rows, klasa, filtr, tematy, names]);

  /** Sprzątanie: dziennik rośnie z każdą lekcją, więc da się obciąć starsze wpisy. */
  const wyczysc = async (dni: number) => {
    if (sprzatanie) return;
    const granica = new Date(Date.now() - dni * 86_400_000);
    const ile = (rows ?? []).filter((r) => new Date(r.at) < granica).length;
    if (ile === 0) {
      window.alert(`Nie ma wpisów starszych niż ${dni} dni.`);
      return;
    }
    if (!window.confirm(`Usunąć ${ile} wpisów starszych niż ${dni} dni?\n\nTej operacji nie da się cofnąć.`)) return;

    setSprzatanie(true);
    setError(null);
    const { error: dbError } = await getBrowserSupabase()
      .from("progress_log")
      .delete()
      .lt("at", granica.toISOString());
    setSprzatanie(false);
    if (dbError) {
      setError(friendlyError(dbError, "Nie udało się wyczyścić dziennika."));
      return;
    }
    void load();
  };

  const kto = (actor: string | null) => (actor === null ? "—" : (names.get(actor) ?? "nauczyciel bez podpisu"));
  const kiedy = (at: string) => new Date(at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });

  if (brakMigracji) {
    return (
      <p className="alert-error">
        Baza nie ma jeszcze tabeli dziennika. Uruchom w Supabase migrację{" "}
        <span className="font-mono">014_progress_log.sql</span> — od tego momentu każde zaznaczenie i odznaczenie
        tematu będzie tu zapisane.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="filtruj: temat lub nauczyciel…"
          value={filtr}
          maxLength={100}
          onChange={(e) => setFiltr(e.target.value)}
          aria-label="Filtruj dziennik"
        />
        <select className="input max-w-[10rem]" value={klasa} onChange={(e) => setKlasa(e.target.value)} aria-label="Klasa">
          <option value="">wszystkie klasy</option>
          {CLASS_NAMES.map((c) => (
            <option key={c} value={c}>
              klasa {c}
            </option>
          ))}
        </select>
        <button type="button" className="btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
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
            {widoczne.length} / {rows.length} wpisów
          </span>
        )}
        <button
          type="button"
          className="btn-danger btn-sm"
          onClick={() => void wyczysc(90)}
          disabled={sprzatanie || rows === null}
          title="Usuwa wpisy starsze niż 90 dni"
        >
          <Trash2 size={14} aria-hidden />
          {sprzatanie ? "Czyszczenie…" : "Wyczyść starsze niż 90 dni"}
        </button>
      </div>

      {error && (
        <p className="alert-error" role="alert">
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="text-sm text-muted">Ładowanie…</p>
      ) : widoczne.length === 0 ? (
        <p className="card p-6 text-muted">
          Brak wpisów. Dziennik zapisuje oznaczenia tematów od momentu uruchomienia migracji 014.
        </p>
      ) : (
        <>
          {/* telefon: wpis jako karta */}
          <ul className="space-y-2 md:hidden">
            {widoczne.map((r) => (
              <li key={r.id} className="card p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 break-words font-medium">{tematy.get(r.subtopic_id) ?? r.subtopic_id}</p>
                  <span
                    className={`chip shrink-0 ${
                      r.action === "zaznaczono" ? "border-accent/40 text-accent" : "border-warn/50 text-warn"
                    }`}
                  >
                    {r.action}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="chip">klasa {r.class_name}</span>
                  <span className="chip">{kto(r.actor)}</span>
                  <span className="chip">{kiedy(r.at)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3">Kiedy</th>
                  <th className="px-4 py-3">Klasa</th>
                  <th className="px-4 py-3">Temat</th>
                  <th className="px-4 py-3">Co zrobiono</th>
                  <th className="px-4 py-3">Kto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {widoczne.map((r) => (
                  <tr key={r.id} className="transition hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{kiedy(r.at)}</td>
                    <td className="px-4 py-3 font-mono">{r.class_name}</td>
                    <td className="px-4 py-3">{tematy.get(r.subtopic_id) ?? r.subtopic_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`chip ${
                          r.action === "zaznaczono" ? "border-accent/40 text-accent" : "border-warn/50 text-warn"
                        }`}
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{kto(r.actor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
