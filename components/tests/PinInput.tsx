"use client";

import { useRef } from "react";
import { LIMITS } from "@/lib/validation";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
};

const LEN = LIMITS.pinLength;

/** 6 pól na cyfry PIN-u: auto-przejście, Backspace, strzałki, wklejanie całego kodu. */
export function PinInput({ value, onChange, onComplete, disabled, invalid, autoFocus }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LEN }, (_, i) => value[i] ?? "");

  const focus = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(LEN - 1, i))];
    el?.focus();
    el?.select();
  };

  const setFrom = (start: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) return;
    const arr = [...digits];
    let i = start;
    for (const ch of incoming) {
      if (i >= LEN) break;
      arr[i] = ch;
      i++;
    }
    // bez "dziur": bierzemy ciągły prefiks cyfr
    let next = "";
    for (const d of arr) {
      if (!d) break;
      next += d;
    }
    onChange(next);
    focus(i);
    if (next.length === LEN) onComplete?.(next);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        onChange(value.slice(0, i));
        focus(i);
      } else if (i > 0) {
        onChange(value.slice(0, i - 1));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  return (
    <div className={`flex justify-center gap-2 sm:gap-3 ${invalid ? "animate-shake" : ""}`} role="group" aria-label="PIN testu">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={LEN}
          aria-label={`Cyfra ${i + 1} z ${LEN}`}
          aria-invalid={invalid}
          onFocus={(e) => {
            // nie pozwalamy wskoczyć za pierwsze puste pole
            if (i > value.length) focus(value.length);
            else e.target.select();
          }}
          onChange={(e) => {
            const v = e.target.value;
            // klawiatury mobilne czasem kasują bez zdarzenia Backspace
            if (v === "") onChange(value.slice(0, i));
            else setFrom(i, v.slice(d ? 1 : 0) || v);
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            setFrom(0, e.clipboardData.getData("text"));
          }}
          className={`h-14 w-11 rounded-xl border bg-bg/70 text-center font-mono text-2xl font-bold text-fg transition sm:h-16 sm:w-14 sm:text-3xl
            focus:outline-none focus:ring-4 disabled:opacity-60 ${
              invalid
                ? "border-danger/70 focus:ring-danger/20"
                : d
                  ? "border-accent/60 focus:border-accent focus:ring-accent/20"
                  : "border-line focus:border-accent/70 focus:ring-accent/15"
            }`}
        />
      ))}
    </div>
  );
}
