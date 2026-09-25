import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { LINK_COLUMNS } from "@/lib/links";
import { loadCategories, loadProgress, loadTeachers } from "@/lib/supabase/compat";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mapa nauki" };
export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const supabase = await getServerSupabase();
  const [cats, subs, prog, links, teachers] = await Promise.all([
    loadCategories(supabase),
    supabase.from("subtopics").select("id, category_id, position, title, theory_url, tasks_url").order("position"),
    loadProgress(supabase),
    supabase.from("subtopic_links").select(LINK_COLUMNS),
    loadTeachers(supabase),
  ]);

  // Brakująca migracja nie jest awarią — loadCategories i loadProgress same
  // wracają do starszego zestawu kolumn. null oznacza prawdziwy błąd bazy.
  if (cats === null || prog === null || subs.error || links.error) {
    // error.tsx pokaże ogólny komunikat bez szczegółów
    throw new Error("roadmap_load_failed");
  }

  return (
    <RoadmapView
      categories={cats}
      subtopics={subs.data}
      initialProgress={prog}
      initialLinks={links.data}
      teachers={teachers}
    />
  );
}
