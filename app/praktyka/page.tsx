import type { Metadata } from "next";
import Link from "next/link";
import { PracticalStudent } from "@/components/practical/PracticalStudent";
import { FlaskConical } from "lucide-react";

export const metadata: Metadata = { title: "Praktyka" };

export default function PracticalPage() {
  return (
    <>
      <PracticalStudent />
      {/* Pod ekranem wpisywania PIN-u. Podczas pracy edytor przykrywa całą stronę, więc link nie przeszkadza. */}
      <p className="mt-6 text-center text-sm text-muted">
        Nie masz PIN-u?{" "}
        <Link href="/praktyka/cwiczenia" className="inline-flex items-center gap-1.5 text-accent hover:underline">
          <FlaskConical size={14} aria-hidden /> Ćwicz samodzielnie bez oceny
        </Link>
      </p>
    </>
  );
}
