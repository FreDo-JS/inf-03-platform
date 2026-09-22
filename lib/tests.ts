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

export function pluralPytania(n: number): string {
  if (n === 1) return "pytanie";
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? "pytania" : "pytań";
}
