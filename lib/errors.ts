// Przyjazne komunikaty błędów — bez ujawniania szczegółów technicznych w UI.

type MaybeError = { code?: unknown; message?: unknown } | null | undefined;

const BY_MESSAGE: Record<string, string> = {
  invalid_name: "Imię jest nieprawidłowe.",
  test_not_found: "Ten test już nie istnieje.",
  invalid_answers: "Nie udało się przesłać odpowiedzi.",
  duplicate_attempt: "Wynik został już zapisany.",
  not_authorized: "Brak uprawnień — zaloguj się ponownie.",
  invalid_title: "Nieprawidłowy tytuł testu.",
  invalid_time_limit: "Nieprawidłowy limit czasu.",
  invalid_questions: "Pytania nie przeszły walidacji.",
  invalid_keys: "Poprawne odpowiedzi nie przeszły walidacji.",
  invalid_pin: "PIN musi mieć 6 cyfr.",
  session_invalid: "Sesja testu wygasła. Wpisz PIN ponownie.",
  session_used: "Ta sesja została już rozpoczęta. Wpisz PIN ponownie.",
  session_expired: "Czas na przesłanie odpowiedzi minął.",
};

export function friendlyError(err: MaybeError, fallback = "Coś poszło nie tak. Spróbuj ponownie."): string {
  const msg = typeof err?.message === "string" ? err.message : "";
  for (const [key, text] of Object.entries(BY_MESSAGE)) {
    if (msg.includes(key)) return text;
  }
  const code = typeof err?.code === "string" ? err.code : "";
  if (code === "42501" || code === "PGRST301") return "Brak uprawnień — zaloguj się ponownie.";
  if (msg.toLowerCase().includes("failed to fetch")) return "Brak połączenia z serwerem. Sprawdź internet.";
  return fallback;
}

export function isDuplicateAttempt(err: MaybeError): boolean {
  return typeof err?.message === "string" && err.message.includes("duplicate_attempt");
}
