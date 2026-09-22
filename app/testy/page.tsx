import type { Metadata } from "next";
import { TestsList } from "@/components/tests/TestsList";
import { getServerSupabase } from "@/lib/supabase/server";
import { TEST_SUMMARY_COLUMNS, toSummaries } from "@/lib/tests";

export const metadata: Metadata = { title: "Testy" };
export const dynamic = "force-dynamic";

export default async function TestsPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tests")
    .select(TEST_SUMMARY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error("tests_load_failed");

  return (
    <div className="space-y-8">
      <div className="max-w-2xl animate-fade-up">
        <p className="eyebrow">{"// sprawdź się"}</p>
        <h1 className="page-title mt-2">
          Testy <span className="text-gradient">INF.03</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Wybierz test, wpisz PIN podany przez nauczyciela i swoje imię — i odpowiadaj na czas.
        </p>
      </div>
      <TestsList initial={toSummaries(data)} />
    </div>
  );
}
