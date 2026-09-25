import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudentFilesViewer } from "@/components/practical/StudentFilesViewer";
import { parseResult } from "@/lib/practical/parse";
import { getServerSupabase } from "@/lib/supabase/server";
import { ArrowLeft, Check, Hourglass, X } from "lucide-react";

export const metadata: Metadata = { title: "Wynik pracy" };
export const dynamic = "force-dynamic";

const TOKEN_RE = /^[0-9a-f]{32,128}$/i;

export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("practical_result", { p_result_token: token });
  if (error) notFound();

  const result = parseResult(data);
  if (!result) notFound();

  if (!result.published) {
    return (
      <div className="card mx-auto max-w-lg animate-fade-up p-8 text-center">
        <Hourglass size={40} className="mx-auto text-muted" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Wynik jeszcze nie opublikowany</h1>
        <p className="mt-2 text-muted">
          {result.studentName} · {result.taskTitle}
        </p>
        <p className="mt-4 text-sm text-muted">
          Nauczyciel sprawdza pracę. Zajrzyj tu ponownie później — link pozostaje aktualny.
        </p>
      </div>
    );
  }

  const autoPoints = result.tests.reduce((s, t) => s + t.points, 0);
  const autoMax = result.tests.reduce((s, t) => s + t.maxPoints, 0);
  const manualPoints = result.criteria.reduce((s, c) => s + c.points, 0);
  const manualMax = result.criteria.reduce((s, c) => s + c.maxPoints, 0);

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-4">
      <div className={`card p-6 text-center sm:p-8 ${result.passed ? "border-accent/40" : "border-danger/40"}`}>
        <p className="eyebrow">{"// wynik pracy praktycznej"}</p>
        <h1 className="mt-2 text-xl font-bold">{result.taskTitle}</h1>
        <p className="mt-1 text-sm text-muted">{result.studentName}</p>
        <p className={`mt-5 font-mono text-6xl font-bold ${result.passed ? "text-accent" : "text-danger"}`}>
          {result.finalPercent}%
        </p>
        <p className="mt-2 text-lg font-semibold">
          {result.passed ? "Zaliczone" : "Niezaliczone"}{" "}
          <span className="text-sm font-normal text-muted">(próg {result.passThreshold}%)</span>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="chip">
            testy automatyczne: {autoPoints}/{autoMax} pkt
          </span>
          <span className="chip">
            ocena nauczyciela: {manualPoints}/{manualMax} pkt
          </span>
          {result.endedReason === "tab_switch" && <span className="chip border-danger/60 text-danger">zmiana karty</span>}
          {result.endedReason === "time_up" && <span className="chip border-warn/50 text-warn">koniec czasu</span>}
        </div>
      </div>

      {result.teacherComment && (
        <div className="card p-5">
          <h2 className="label">Komentarz nauczyciela</h2>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{result.teacherComment}</p>
        </div>
      )}

      {result.tests.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="border-b border-white/[0.06] px-5 py-3 font-semibold">Testy automatyczne</h2>
          <ul className="divide-y divide-white/[0.06]">
            {result.tests.map((t) => (
              <li key={t.id} className="flex items-start gap-3 p-4">
                <span
                  role="img"
                  aria-label={t.passed ? "zaliczony" : "niezaliczony"}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    t.passed ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                  }`}
                >
                  {t.passed ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
                </div>
                <span className="shrink-0 font-mono text-sm text-muted">
                  {t.points}/{t.maxPoints}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.criteria.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="border-b border-white/[0.06] px-5 py-3 font-semibold">Ocena nauczyciela</h2>
          <ul className="divide-y divide-white/[0.06]">
            {result.criteria.map((c) => (
              <li key={c.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="mt-0.5 text-sm text-muted">{c.description}</p>}
                </div>
                <span className="shrink-0 font-mono text-sm text-muted">
                  {c.points}/{c.maxPoints}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card overflow-hidden">
        <h2 className="border-b border-white/[0.06] px-5 py-3 font-semibold">Twoja oddana praca</h2>
        <StudentFilesViewer files={result.files} />
      </div>

      <div className="flex justify-center">
        <Link href="/" className="btn-ghost">
          <ArrowLeft size={14} aria-hidden /> strona główna
        </Link>
      </div>
    </div>
  );
}
