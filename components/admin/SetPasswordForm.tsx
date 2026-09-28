"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Stan = "sprawdzanie" | "formularz" | "brak-linku" | "gotowe";

const MIN_DL = 10;
const MAX_DL = 128;

/**
 * Ustawienie hasła z linku otrzymanego mejlem (zaproszenie albo reset hasła).
 *
 * Supabase odsyła po weryfikacji na adres aplikacji z danymi sesji: albo
 * w części po krzyżyku (#access_token=…), albo jako ?code=… . Obie drogi
 * obsługujemy tutaj, a token zaraz po użyciu znika z paska adresu, żeby nie
 * został w historii przeglądarki ani w logach.
 */
export function SetPasswordForm() {
  const router = useRouter();
  const [stan, setStan] = useState<Stan>("sprawdzanie");
  const [email, setEmail] = useState<string | null>(null);
  const [haslo, setHaslo] = useState("");
  const [powtorz, setPowtorz] = useState("");
  const [blad, setBlad] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const zrobione = useRef(false);

  useEffect(() => {
    if (zrobione.current) return;
    zrobione.current = true;

    void (async () => {
      const supabase = getBrowserSupabase();
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const query = new URLSearchParams(window.location.search);

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");

      if (accessToken !== null && refreshToken !== null) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else if (code !== null) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // token zostawiony w adresie trafiłby do historii przeglądarki
      if (accessToken !== null || code !== null) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStan("formularz");
      } else {
        setStan("brak-linku");
      }
    })();
  }, []);

  const zapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (haslo.length < MIN_DL) {
      setBlad(`Hasło musi mieć co najmniej ${MIN_DL} znaków.`);
      return;
    }
    if (haslo.length > MAX_DL) {
      setBlad(`Hasło może mieć najwyżej ${MAX_DL} znaków.`);
      return;
    }
    if (haslo !== powtorz) {
      setBlad("Hasła nie są takie same.");
      return;
    }

    setBusy(true);
    setBlad(null);
    const { error } = await getBrowserSupabase().auth.updateUser({ password: haslo });
    setHaslo("");
    setPowtorz("");
    setBusy(false);

    if (error) {
      setBlad(
        error.status === 422
          ? "To hasło jest zbyt proste albo takie samo jak poprzednie. Wybierz inne."
          : "Nie udało się ustawić hasła. Otwórz link z mejla jeszcze raz.",
      );
      return;
    }

    setStan("gotowe");
    router.refresh();
  };

  if (stan === "sprawdzanie") {
    return <p className="card p-6 text-center text-muted">Sprawdzanie linku…</p>;
  }

  if (stan === "brak-linku") {
    return (
      <div className="card p-6 sm:p-8">
        <h1 className="page-title">Link wygasł lub został już użyty</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Otwórz najnowszy mejl z zaproszeniem i kliknij link jeszcze raz. Jeśli to nie pomoże, poproś o nowe
          zaproszenie — administrator wysyła je z panelu Supabase.
        </p>
        <Link href="/admin/login" className="btn-ghost mt-6">
          Przejdź do logowania
        </Link>
      </div>
    );
  }

  if (stan === "gotowe") {
    return (
      <div className="card p-6 text-center sm:p-8">
        <h1 className="page-title">Hasło ustawione</h1>
        <p className="mt-3 text-sm text-muted">Od teraz logujesz się nim razem z adresem {email}.</p>
        <Link href="/admin" className="btn-primary mt-6">
          Wejdź do panelu
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={zapisz} className="card space-y-5 p-6 sm:p-8" noValidate>
      <div>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
          <KeyRound size={20} aria-hidden />
        </div>
        <h1 className="page-title">Ustaw hasło</h1>
        <p className="mt-2 text-sm text-muted">
          {email === null ? "Dokończ zakładanie konta." : <>Konto: {email}</>}
        </p>
      </div>

      <div>
        <label htmlFor="haslo" className="label">
          Nowe hasło (min. {MIN_DL} znaków)
        </label>
        <input
          id="haslo"
          type="password"
          className="input"
          value={haslo}
          maxLength={MAX_DL}
          autoComplete="new-password"
          autoFocus
          onChange={(e) => {
            setHaslo(e.target.value);
            if (blad) setBlad(null);
          }}
        />
      </div>

      <div>
        <label htmlFor="powtorz" className="label">
          Powtórz hasło
        </label>
        <input
          id="powtorz"
          type="password"
          className="input"
          value={powtorz}
          maxLength={MAX_DL}
          autoComplete="new-password"
          onChange={(e) => {
            setPowtorz(e.target.value);
            if (blad) setBlad(null);
          }}
        />
      </div>

      {blad && (
        <p className="alert-error" role="alert">
          {blad}
        </p>
      )}

      <button type="submit" className="btn-primary w-full py-2.5" disabled={busy}>
        {busy ? "Zapisywanie…" : "Zapisz hasło"}
      </button>
    </form>
  );
}
