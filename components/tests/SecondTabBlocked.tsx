import Link from "next/link";

/** Ekran dla drugiej karty z tym samym egzaminem — pracuje tylko pierwsza. */
export function SecondTabBlocked({ title = "Egzamin jest już otwarty w innej karcie" }: { title?: string }) {
  return (
    <div className="card mx-auto max-w-md animate-fade-up p-8 text-center">
      <p className="text-5xl">🪟</p>
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Wróć do karty, w której pracujesz. Otwieranie egzaminu w dwóch kartach jest zablokowane — tamta karta
        działa dalej i nic w niej nie zginęło.
      </p>
      <Link href="/" className="btn-ghost mt-6">
        ← strona główna
      </Link>
    </div>
  );
}
