"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { KeyRound } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
      setError("Podaj poprawny adres e-mail.");
      return;
    }
    if (password.length === 0 || password.length > 128) {
      setError("Podaj hasło.");
      return;
    }

    setBusy(true);
    setError(null);
    const { error: authError } = await getBrowserSupabase().auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setPassword("");
    setBusy(false);

    if (authError) {
      // Jeden ogólny komunikat — nie zdradzamy, czy konto istnieje.
      setError(
        authError.status === 429
          ? "Zbyt wiele prób logowania. Odczekaj chwilę."
          : "Nieprawidłowy e-mail lub hasło.",
      );
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-sm pt-6 sm:pt-12">
      <form onSubmit={onSubmit} className="card animate-fade-up space-y-5 p-6 sm:p-8" noValidate>
        <div>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
            <KeyRound size={20} aria-hidden />
          </div>
          <p className="eyebrow">$ sudo login</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Panel nauczyciela</h1>
          <p className="mt-1 text-sm text-muted">Zaloguj się kontem administratora.</p>
        </div>
        <div>
          <label htmlFor="email" className="label">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            maxLength={254}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </div>
        {error && (
          <p className="alert-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? "logowanie…" : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}
