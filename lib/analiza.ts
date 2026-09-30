import type { PublicQuestion } from "@/types/db";

/**
 * Analiza pytań: co klasa faktycznie odpowiadała.
 *
 * Wejściem są podejścia z kolumn `attempts.answers` / `attempts.results`
 * (migracja 018) zestawione z treścią pytań i kluczem odpowiedzi. Moduł jest
 * czysty — liczy i nic nie pobiera — żeby dało się go sprawdzić bez bazy
 * i żeby komponent zajmował się wyłącznie rysowaniem.
 *
 * Zasada: o tym, czy pytanie zostało zaliczone, decyduje `results` policzone
 * przez serwer przy oddaniu testu. Nie oceniamy tu niczego od nowa — klucz
 * służy tylko do pokazania, która odpowiedź była poprawna. Gdyby nauczyciel
 * zmienił klucz po napisaniu testu, procenty nadal opisują to, co uczniowie
 * rzeczywiście dostali.
 */

/** Tak samo jak normalize_answer() w bazie: bez wielkości liter i nadmiaru spacji. */
export function normalizuj(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export type PodejscieDoAnalizy = {
  score: number;
  total: number;
  answers: unknown;
  results: unknown;
};

export type Wariant = {
  /** Treść opcji albo to, co uczeń wpisał. */
  etykieta: string;
  liczba: number;
  /** Udział w podejściach wziętych do analizy, 0–1. */
  udzial: number;
  poprawna: boolean;
  /** Wiersz „nie odpowiedziano” — wyróżniamy go w widoku. */
  brak: boolean;
};

export type Para = {
  lewa: string;
  poprawna: string;
  trafien: number;
  udzial: number;
};

export type AnalizaPytania = {
  index: number;
  pytanie: PublicQuestion;
  /** Poprawne odpowiedzi z klucza (dla matching: prawa kolumna w kolejności lewej). */
  klucz: string[];
  trafien: number;
  udzial: number;
  warianty: Wariant[];
  /** Skuteczność każdego dopasowania z osobna — tylko dla pytań typu matching. */
  pary: Para[];
};

export type AnalizaTestu = {
  pytania: AnalizaPytania[];
  /** Podejścia, które weszły do analizy. */
  uwzglednione: number;
  /** Podejścia sprzed migracji 018 — bez zapisanych odpowiedzi. */
  bezOdpowiedzi: number;
  /** Podejścia do innej wersji testu (inna liczba pytań) — pominięte. */
  niezgodne: number;
  /** Średni wynik uwzględnionych podejść, 0–1. */
  srednia: number | null;
};

const jestTablicaNapisow = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

export function analizuj(
  podejscia: readonly PodejscieDoAnalizy[],
  pytania: readonly PublicQuestion[],
  klucze: readonly (readonly string[])[],
): AnalizaTestu {
  // Do analizy wchodzą tylko podejścia pasujące do obecnej wersji testu:
  // po dopisaniu pytania stare tablice miałyby inną długość i odpowiedzi
  // wylądowałyby pod cudzymi pytaniami.
  const dobre: { answers: unknown[]; results: unknown[]; score: number; total: number }[] = [];
  let bezOdpowiedzi = 0;
  let niezgodne = 0;

  for (const p of podejscia) {
    if (p.answers === null || p.results === null || !Array.isArray(p.answers) || !Array.isArray(p.results)) {
      bezOdpowiedzi++;
    } else if (p.answers.length !== pytania.length || p.results.length !== pytania.length) {
      niezgodne++;
    } else {
      dobre.push({ answers: p.answers, results: p.results, score: p.score, total: p.total });
    }
  }

  const n = dobre.length;
  const udzialem = (ile: number) => (n > 0 ? ile / n : 0);

  const wynik: AnalizaPytania[] = pytania.map((pytanie, i) => {
    const klucz = jestTablicaNapisow(klucze[i]) ? [...(klucze[i] as string[])] : [];
    const trafien = dobre.filter((d) => d.results[i] === true).length;

    const odpowiedzi = dobre.map((d) => d.answers[i]);
    const brakow = odpowiedzi.filter((o) => o === null || o === undefined || o === "").length;
    const kluczNorm = new Set(klucz.map(normalizuj));

    const warianty: Wariant[] = [];
    const pary: Para[] = [];

    if (pytanie.type === "matching") {
      // matching ocenia się zero-jedynkowo, więc sam procent niewiele mówi:
      // rozbijamy go na pary, bo zwykle sypie się jedna konkretna.
      pytanie.left.forEach((lewa, j) => {
        const poprawna = klucz[j] ?? "";
        const trafienia = odpowiedzi.filter(
          (o) => Array.isArray(o) && typeof o[j] === "string" && normalizuj(o[j] as string) === normalizuj(poprawna),
        ).length;
        pary.push({ lewa, poprawna, trafien: trafienia, udzial: udzialem(trafienia) });
      });
    } else if (pytanie.type === "closed" || pytanie.type === "select") {
      // Opcje w kolejności z testu — nauczyciel widzi je tak, jak widział je uczeń.
      const teksty = odpowiedzi.filter((o): o is string => typeof o === "string" && o !== "");
      const zajete = new Set<string>();
      for (const opcja of pytanie.options) {
        const norma = normalizuj(opcja);
        zajete.add(norma);
        const liczba = teksty.filter((t) => normalizuj(t) === norma).length;
        warianty.push({ etykieta: opcja, liczba, udzial: udzialem(liczba), poprawna: kluczNorm.has(norma), brak: false });
      }
      const inne = teksty.filter((t) => !zajete.has(normalizuj(t))).length;
      if (inne > 0) {
        warianty.push({ etykieta: "odpowiedź spoza listy opcji", liczba: inne, udzial: udzialem(inne), poprawna: false, brak: true });
      }
    } else if (pytanie.type === "input") {
      // Grupujemy tak, jak ocenia baza: bez wielkości liter i nadmiaru spacji.
      // Etykietą zostaje pierwszy zapis, żeby było widać, jak uczniowie piszą.
      const grupy = new Map<string, { etykieta: string; liczba: number }>();
      for (const o of odpowiedzi) {
        if (typeof o !== "string" || o.trim() === "") continue;
        const norma = normalizuj(o);
        const g = grupy.get(norma);
        if (g) g.liczba++;
        else grupy.set(norma, { etykieta: o.trim(), liczba: 1 });
      }
      for (const [norma, g] of grupy) {
        warianty.push({
          etykieta: g.etykieta,
          liczba: g.liczba,
          udzial: udzialem(g.liczba),
          poprawna: kluczNorm.has(norma),
          brak: false,
        });
      }
      warianty.sort((a, b) => b.liczba - a.liczba || a.etykieta.localeCompare(b.etykieta, "pl"));
    }

    if (brakow > 0) {
      warianty.push({ etykieta: "bez odpowiedzi", liczba: brakow, udzial: udzialem(brakow), poprawna: false, brak: true });
    }

    return { index: i, pytanie, klucz, trafien: trafien, udzial: udzialem(trafien), warianty, pary };
  });

  const srednia =
    n > 0 ? dobre.reduce((s, d) => s + (d.total > 0 ? d.score / d.total : 0), 0) / n : null;

  return { pytania: wynik, uwzglednione: n, bezOdpowiedzi, niezgodne, srednia };
}
