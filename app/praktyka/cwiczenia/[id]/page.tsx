import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeWorkspace } from "@/components/practical/PracticeWorkspace";
import { parsePracticeTask } from "@/lib/practical/parse";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ćwiczenie — praktyka" };
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PracticeTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.rpc("practical_practice_task", { p_task_id: id });
  if (error) notFound();

  const task = parsePracticeTask(data);
  if (!task) notFound();

  return <PracticeWorkspace task={task} />;
}
