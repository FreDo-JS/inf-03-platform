"use client";

import { useState } from "react";
import type { MatchingQuestion } from "@/types/db";

type Props = {
  question: MatchingQuestion;
  /** kolumna „prawa” potasowana na czas tego podejścia */
  right: string[];
  /** przypisania: indeks = pozycja w kolumnie lewej, wartość = tekst z prawej */
  value: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  disabled?: boolean;
};

/**
 * Dopasowywanie par. Dwie równoważne metody, obie kończą się tym samym stanem:
 *  - myszka: HTML5 Drag and Drop (draggable / onDragOver / onDrop),
 *  - dotyk: tap na element z prawej (zaznacza), tap na slot po lewej (wstawia).
 * Telefony nie obsługują dobrze HTML5 DnD, dlatego tap-tap jest pełnoprawną drogą.
 */
export function MatchingQuestionView({ question, right, value, onChange, disabled }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const used = new Set(value.filter((v): v is string => v !== null));

  /** Wstawia element do slotu; jeśli był użyty gdzie indziej, przenosi go (bez duplikatów). */
  const assign = (slot: number, item: string | null) => {
    const next = value.map((v, i) => {
      if (i === slot) return item;
      return item !== null && v === item ? null : v;
    });
    onChange(next);
    setPicked(null);
  };

  const tapSlot = (slot: number) => {
    if (disabled) return;
    if (picked !== null) assign(slot, picked);
    else if (value[slot]) assign(slot, null); // tap na zajętym slocie zwalnia go
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* lewa kolumna: stała kolejność + slot na odpowiedź */}
      <ul className="space-y-2">
        {question.left.map((leftItem, i) => {
          const assigned = value[i] ?? null;
          const isTarget = dragOver === i;
          return (
            <li key={leftItem}>
              <div
                onDragOver={(e) => {
                  if (disabled) return;
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDragLeave={() => setDragOver((d) => (d === i ? null : d))}
                onDrop={(e) => {
                  if (disabled) return;
                  e.preventDefault();
                  setDragOver(null);
                  const item = e.dataTransfer.getData("text/plain");
                  if (right.includes(item)) assign(i, item);
                }}
                className={`flex items-stretch gap-2 rounded-xl border-2 p-2 transition ${
                  isTarget ? "border-accent bg-accent/10" : assigned ? "border-accent/40 bg-bg/50" : "border-line bg-bg/50"
                }`}
              >
                <span className="flex flex-1 items-center gap-2 px-1 py-2 text-[15px] font-medium">
                  <span className="font-mono text-xs text-accent">{i + 1}</span>
                  <span className="break-words">{leftItem}</span>
                </span>
                <button
                  type="button"
                  onClick={() => tapSlot(i)}
                  disabled={disabled}
                  aria-label={
                    assigned
                      ? `Dopasowano: ${assigned}. Kliknij, aby usunąć.`
                      : picked
                        ? `Wstaw „${picked}” tutaj`
                        : "Puste pole — wybierz element z prawej kolumny"
                  }
                  className={`min-h-[3rem] flex-1 rounded-lg border-2 border-dashed px-2 py-1.5 text-left text-sm transition ${
                    assigned
                      ? "border-solid border-accent/60 bg-accent/10 text-fg"
                      : picked
                        ? "border-accent/70 bg-accent/5 text-accent"
                        : "border-line text-muted"
                  }`}
                >
                  {assigned ?? (picked ? "wstaw tutaj" : "upuść lub kliknij")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* prawa kolumna: elementy do przeciągnięcia / kliknięcia */}
      <ul className="space-y-2" aria-label="Elementy do dopasowania">
        {right.map((item) => {
          const isUsed = used.has(item);
          const isPicked = picked === item;
          return (
            <li key={item}>
              <button
                type="button"
                draggable={!disabled && !isUsed}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", item);
                  e.dataTransfer.effectAllowed = "move";
                  setPicked(item);
                }}
                onDragEnd={() => setPicked(null)}
                onClick={() => {
                  if (disabled || isUsed) return;
                  setPicked((p) => (p === item ? null : item));
                }}
                disabled={disabled || isUsed}
                aria-pressed={isPicked}
                className={`w-full cursor-grab rounded-xl border-2 p-3 text-left text-[15px] transition active:cursor-grabbing ${
                  isPicked
                    ? "border-accent bg-accent/15 text-fg shadow-glow"
                    : isUsed
                      ? "border-line bg-white/[0.02] text-muted/50 line-through"
                      : "border-line bg-bg/50 hover:border-accent/50 hover:bg-white/[0.03]"
                }`}
              >
                <span className="mr-2 text-muted" aria-hidden>
                  ⠿
                </span>
                <span className="break-words">{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted sm:col-span-2">
        Przeciągnij element z prawej na pole obok pasującego hasła — albo dotknij elementu, a potem pola. Ponowne
        kliknięcie wypełnionego pola je zwalnia.
      </p>
    </div>
  );
}
