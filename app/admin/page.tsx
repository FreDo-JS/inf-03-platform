import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { loadCategories, loadProgress, loadTeachers } from "@/lib/supabase/compat";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await getServerSupabase();

  // Druga kontrola po middleware (defense in depth). Dane i tak chroni RLS.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [cats, subs, prog, teachers] = await Promise.all([
    loadCategories(supabase),
    supabase.from("subtopics").select("id, category_id, position, title, theory_url, tasks_url").order("position"),
    loadProgress(supabase),
    loadTeachers(supabase),
  ]);
  if (cats === null || prog === null || subs.error) throw new Error("admin_load_failed");

  return (
    <AdminPanel
      email={user.email ?? ""}
      categories={cats}
      subtopics={subs.data}
      initialProgress={prog.rows}
      authorColumn={prog.authorColumn}
      teachers={teachers}
      myId={user.id}
    />
  );
}
