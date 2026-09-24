import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
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

  const [cats, subs, prog] = await Promise.all([
    supabase.from("categories").select("id, position, title, description, qualification").order("position"),
    supabase.from("subtopics").select("id, category_id, position, title, theory_url, tasks_url").order("position"),
    supabase.from("progress").select("class_name, subtopic_id"),
  ]);
  if (cats.error || subs.error || prog.error) throw new Error("admin_load_failed");

  return (
    <AdminPanel
      email={user.email ?? ""}
      categories={cats.data}
      subtopics={subs.data}
      initialProgress={prog.data}
    />
  );
}
