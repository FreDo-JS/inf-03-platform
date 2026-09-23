/**
 * Tasowanie Fisher–Yates. Zwraca nową tablicę, nie rusza wejściowej —
 * kolejność pytań i kolumny „prawej” w pytaniach matching jest efemeryczna
 * (tylko na czas jednego podejścia), dane w bazie zostają bez zmian.
 */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    const a = arr[i];
    const b = arr[j];
    if (a !== undefined && b !== undefined) {
      arr[i] = b;
      arr[j] = a;
    }
  }
  return arr;
}

function randomIndex(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) % max;
  }
  return Math.floor(Math.random() * max);
}
