import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap/RoadmapView";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mapa nauki" };
export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const supabase = await getServerSupabase();
  const [cats, subs, prog] = await Promise.all([
    supabase.from("categories").select("id, position, title, description").order("position"),
    supabase.from("subtopics").select("id, category_id, position, title, theory_url, tasks_url").order("position"),
    supabase.from("progress").select("class_name, subtopic_id"),
  ]);

  if (cats.error || subs.error || prog.error) {
    // error.tsx pokaże ogólny komunikat bez szczegółów
    throw new Error("roadmap_load_failed");
  }

  return <RoadmapView categories={cats.data} subtopics={subs.data} initialProgress={prog.data} />;
}
