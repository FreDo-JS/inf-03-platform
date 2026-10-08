"use client";

import { LIMITS } from "@/lib/validation";
import type { GapsQuestion } from "@/types/db";

type Props = {
  question: GapsQuestion;
  /** treść kolejnych luk; indeks = numer luki − 1 */
  value: (string | null)[];
  onChange: (next: (string | null)[]) => void;
  disabled?: boolean;
};

/** Marker luki w kodzie: [[1]], [[2]]… */
const MARKER = /\[\[(\d+)\]\]/g;

type Fragment = { kind: "text"; text: string } | { kind: "gap"; index: number };

/**
 * Rozbija kod na kawałki tekstu i luki. Kod NIE jest wykonywany ani wstawiany
 * jako HTML — każdy fragment renderujemy jako tekst w <pre>.
 */
function podziel(code: string): Fragment[] {
  const out: Fragment[] = [];
  let last = 0;
  for (const m of code.matchAll(MARKER)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: code.slice(last, at) });
    out.push({ kind: "gap", index: Number(m[1]) - 1 });
    last = at + m[0].length;
  }
  if (last < code.length) out.push({ kind: "text", text: code.slice(last) });
  return out;
}

/**
 * Uzupełnianie luk w kodzie — odpowiednik „fill in the blanks”.
 *
 * Pola wstawiamy w miejsca markerów, zachowując układ kodu (<pre> z zawijaniem,
 * żeby na telefonie nie było przewijania w bok). Szerokość pola rośnie z treścią,
 * ale nie zdradza długości poprawnej odpowiedzi — startuje od stałego minimum.
 */
export function GapsQuestionView({ question, value, onChange, disabled }: Props) {
  const fragmenty = podziel(question.code);
  const luk = fragmenty.filter((f) => f.kind === "gap").length;

  const ustaw = (i: number, v: string) => {
    const next = Array.from({ length: luk }, (_, k) => value[k] ?? null);
    next[i] = v;
    onChange(next);
  };

  return (
    <div>
      <pre className="overflow-hidden whitespace-pre-wrap break-words rounded-xl border border-line bg-white/[0.03] p-4 font-mono text-sm leading-7 sm:text-base">
        {fragmenty.map((f, i) =>
          f.kind === "text" ? (
            <span key={i}>{f.text}</span>
          ) : (
            <input
              key={i}
              type="text"
              className="mx-1 inline-block rounded-md border border-accent/50 bg-bg px-2 py-0.5 align-baseline font-mono text-sm text-accent outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 sm:text-base"
              style={{ width: `${Math.min(Math.max((value[f.index] ?? "").length + 3, 8), 28)}ch` }}
              value={value[f.index] ?? ""}
              disabled={disabled}
              maxLength={LIMITS.gapAnswer.max}
              onChange={(e) => ustaw(f.index, e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={`Luka ${f.index + 1} z ${luk}`}
            />
          ),
        )}
      </pre>
      <p className="mt-2 text-xs text-muted">
        Uzupełnij wszystkie luki — punkt jest za komplet. Wielkość liter i spacje na brzegach nie mają
        znaczenia.
      </p>
    </div>
  );
}
