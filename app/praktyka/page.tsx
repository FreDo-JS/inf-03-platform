import type { Metadata } from "next";
import { PracticalStudent } from "@/components/practical/PracticalStudent";

export const metadata: Metadata = { title: "Praktyka" };

export default function PracticalPage() {
  return <PracticalStudent />;
}
