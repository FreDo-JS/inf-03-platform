import type { Metadata } from "next";
import { SetPasswordForm } from "@/components/admin/SetPasswordForm";

export const metadata: Metadata = { title: "Ustaw hasło" };
export const dynamic = "force-dynamic";

export default function SetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <SetPasswordForm />
    </div>
  );
}
