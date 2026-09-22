"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  // Celowo nie wyświetlamy error.message — bez szczegółów technicznych w UI.
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="font-mono text-accent">$ error</p>
      <p className="mt-2 text-muted">Nie udało się załadować danych. Spróbuj ponownie za chwilę.</p>
      <button type="button" onClick={reset} className="btn-ghost mt-6">
        spróbuj ponownie
      </button>
    </div>
  );
}
