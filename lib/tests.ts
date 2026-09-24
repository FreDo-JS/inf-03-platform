export type TestSummary = {
  id: string;
  title: string;
  timeLimitSec: number;
  questionCount: number;
  createdAt: string;
};

// Bez kolumny questions — anon ma do niej dostęp dopiero po podaniu PIN-u (open_test).
export const TEST_SUMMARY_COLUMNS = "id, title, time_limit, question_count, created_at" as const;

type SummarySource = { id: string; title: string; time_limit: number; question_count: number; created_at: string };

export function toSummaries(rows: readonly SummarySource[]): TestSummary[] {
  return rows
    .filter((r) => r.question_count > 0)
    .map((r) => ({
      id: r.id,
      title: r.title,
      timeLimitSec: r.time_limit,
      questionCount: r.question_count,
      createdAt: r.created_at,
    }));
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, "0")}`;
}

/**
 * Zegar odliczający dla dłuższych podejść: h:mm:ss powyżej godziny, m:ss poniżej.
 * (formatDuration pokazałby 150-minutowy egzamin jako „150:00”.)
 */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(rest).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function pluralPytania(n: number): string {
  if (n === 1) return "pytanie";
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? "pytania" : "pytań";
}
