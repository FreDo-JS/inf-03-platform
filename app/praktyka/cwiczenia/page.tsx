import type { Metadata } from "next";
import Link from "next/link";
import { parsePracticeList } from "@/lib/practical/parse";
import { getServerSupabase } from "@/lib/supabase/server";
import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";

export const metadata: Metadata = { title: "Ćwiczenia — praktyka" };
export const dynamic = "force-dynamic";

export default async function PracticeListPage() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("practical_practice_list");
  // brak migracji (funkcja nie istnieje) traktujemy jak „nic do ćwiczeń", bez błędu na stronie
  const items = error ? [] : parsePracticeList(data);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/praktyka" className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
          <ArrowLeft size={14} aria-hidden /> egzamin z PIN-em
        </Link>
        <h1 className="page-title mt-3">Ćwiczenia</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Zadania do samodzielnej nauki: bez PIN-u, bez limitu czasu i bez oceny. Piszesz kod, sam uruchamiasz testy i
          poprawiasz, aż wszystko się zgodzi. Twoja praca zostaje w tej przeglądarce — nikt jej nie widzi.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <FlaskConical size={32} className="mx-auto text-muted" aria-hidden />
          <p className="mt-3 text-muted">Nauczyciel nie udostępnił jeszcze zadań do ćwiczeń.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id}>
              <Link href={`/praktyka/cwiczenia/${t.id}`} className="card-interactive group flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold transition-colors group-hover:text-accent">{t.title}</p>
                  {t.summary && <p className="mt-0.5 text-sm text-muted">{t.summary}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">{t.tests} testów</span>
                    <span className="chip">{t.points} pkt</span>
                    <span className="chip">ok. {t.minutes} min</span>
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
