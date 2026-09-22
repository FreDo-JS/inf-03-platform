import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/tests/Quiz";
import { getServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Test" };
export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await getServerSupabase();
  // Tylko metadane — pytania uczeń dostaje dopiero po poprawnym PIN-ie (open_test),
  // a poprawne odpowiedzi nigdy nie opuszczają bazy.
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, time_limit, question_count")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("test_load_failed");
  if (!data || data.question_count < 1) notFound();

  return (
    <Quiz testId={data.id} title={data.title} timeLimitSec={data.time_limit} questionCount={data.question_count} />
  );
}
