import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="font-mono text-4xl text-accent">404</p>
      <p className="mt-2 text-muted">Nie znaleziono strony.</p>
      <Link href="/roadmap" className="btn-ghost mt-6">
        <ArrowLeft size={14} aria-hidden /> wróć do mapy
      </Link>
    </div>
  );
}
