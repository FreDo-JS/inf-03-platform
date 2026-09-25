"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IdeWorkspace, type SaveStatus } from "@/components/practical/IdeWorkspace";
import { PinInput } from "@/components/tests/PinInput";
import { ProctorWarning } from "@/components/tests/ProctorWarning";
import { SecondTabBlocked } from "@/components/tests/SecondTabBlocked";
import { friendlyError } from "@/lib/errors";
import { useProctorGuard, type ProctorKind } from "@/lib/hooks/useProctorGuard";
import { useSingleTabLock } from "@/lib/hooks/useSingleTabLock";
import { parseAttemptState, parseEvent, parseJoin, parseSave, parseSubmit } from "@/lib/practical/parse";
import { PRACTICAL_LIMITS, validateFiles, validatePracticalName } from "@/lib/practical/validation";
import { formatClock } from "@/lib/tests";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { LIMITS, parseServerTime, validatePin } from "@/lib/validation";
import type { AttemptState, PracticalEndedReason, ProjectFile } from "@/types/practical";
import { ArrowRight, CircleCheckBig, Lock, Timer, User } from "lucide-react";

const TOKEN_KEY = "inf03.practical.token";
const AUTOSAVE_DEBOUNCE_MS = 3000;
const AUTOSAVE_INTERVAL_MS = 30000;

type Phase = "join" | "lobby" | "working" | "submitted" | "finished";

const readToken = (): string | null => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const writeToken = (token: string | null) => {
  try {
    if (token === null) window.sessionStorage.removeItem(TOKEN_KEY);
    else window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* sessionStorage niedostępny — praca będzie działać do odświeżenia strony */
  }
};

export function PracticalStudent() {
  const [phase, setPhase] = useState<Phase>("join");
  const [state, setState] = useState<AttemptState | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);

  // ekran dołączania
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [pinShake, setPinShake] = useState(0);

  // praca
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetIn, setResetIn] = useState(20);

  const tokenRef = useRef<string | null>(null);
  const filesRef = useRef<ProjectFile[]>([]);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const submittedRef = useRef(false);
  const clockOffsetRef = useRef(0); // czas serwera minus czas przeglądarki
  const endsAtRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const applyState = useCallback((next: AttemptState) => {
    setState(next);
    setFiles(next.files);
    filesRef.current = next.files;
    setLastSavedAt(next.lastSavedAt);
    clockOffsetRef.current = Date.parse(next.session.serverNow) - Date.now();
    endsAtRef.current = next.session.endsAt ? Date.parse(next.session.endsAt) : null;

    if (next.status !== "in_progress") {
      submittedRef.current = true;
      setPhase("submitted");
    } else if (next.session.status === "active") {
      setPhase((p) => (p === "working" ? p : "lobby"));
    } else if (next.session.status === "finished") {
      setPhase("finished");
    } else {
      setPhase("lobby");
    }
  }, []);

  // wznowienie pracy po odświeżeniu strony
  useEffect(() => {
    const token = readToken();
    if (!token) return;
    tokenRef.current = token;
    void (async () => {
      const { data, error } = await getBrowserSupabase().rpc("practical_state", { p_token: token });
      if (error) {
        writeToken(null);
        tokenRef.current = null;
        return;
      }
      const parsed = parseAttemptState(data);
      if (parsed) applyState(parsed);
    })();
  }, [applyState]);

  // poczekalnia: pytamy serwer, czy nauczyciel wystartował
  useEffect(() => {
    if (phase !== "lobby" || !tokenRef.current) return;
    const id = window.setInterval(async () => {
      const token = tokenRef.current;
      if (!token) return;
      const { data, error } = await getBrowserSupabase().rpc("practical_state", { p_token: token });
      if (error) return;
      const parsed = parseAttemptState(data);
      if (parsed) {
        setState(parsed);
        clockOffsetRef.current = Date.parse(parsed.session.serverNow) - Date.now();
        endsAtRef.current = parsed.session.endsAt ? Date.parse(parsed.session.endsAt) : null;
        if (parsed.session.status === "finished") setPhase("finished");
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [phase]);

  /**
   * Powrót do ekranu wyboru egzaminu (wpisania PIN-u). Czyścimy token podejścia
   * i całą pracę z pamięci, żeby kolejny uczeń przy tym komputerze zaczynał
   * od zera i nie wszedł w cudze podejście.
   */
  const resetToJoin = useCallback(() => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    writeToken(null);
    tokenRef.current = null;
    filesRef.current = [];
    submittedRef.current = false;
    dirtyRef.current = false;
    savingRef.current = false;
    endsAtRef.current = null;
    clockOffsetRef.current = 0;

    setState(null);
    setFiles([]);
    setPin("");
    setName("");
    setJoinError(null);
    setNotice(null);
    setSaveStatus("idle");
    setLastSavedAt(null);
    setRemainingSec(0);
    setResetIn(20);
    setPhase("join");

    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  // odliczanie do automatycznego powrotu po oddaniu pracy
  useEffect(() => {
    if (phase !== "submitted") return;
    const id = window.setInterval(() => {
      setResetIn((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          resetToJoin();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, resetToJoin]);

  // ------------------------------------------------------------- dołączanie
  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joining) return;
    const pinCheck = validatePin(pin);
    if (!pinCheck.ok) {
      setJoinError(pinCheck.error);
      return;
    }
    const nameCheck = validatePracticalName(name);
    if (!nameCheck.ok) {
      setJoinError(nameCheck.error);
      return;
    }

    setJoining(true);
    setJoinError(null);
    const { data, error } = await getBrowserSupabase().rpc("practical_join", {
      p_pin: pinCheck.value,
      p_name: nameCheck.value,
    });
    setJoining(false);

    if (error) {
      setJoinError(
        error.message.includes("invalid_name")
          ? "Imię może zawierać tylko litery, spację, myślnik i apostrof."
          : friendlyError(error, "Nie udało się dołączyć. Spróbuj ponownie."),
      );
      return;
    }
    const parsed = parseJoin(data);
    if (!parsed) {
      setJoinError("Nie udało się dołączyć do sesji.");
      return;
    }
    if (!parsed.ok) {
      setPin("");
      setPinShake((n) => n + 1);
      setJoinError(
        parsed.reason === "bad_pin"
          ? "Nie ma sesji z takim PIN-em. Zapytaj nauczyciela."
          : parsed.reason === "name_taken"
            ? "Ktoś w tej sesji ma już takie imię — dopisz pierwszą literę nazwiska."
            : "Zbyt wiele prób. Odczekaj minutę.",
      );
      return;
    }

    tokenRef.current = parsed.attemptToken;
    writeToken(parsed.attemptToken);
    applyState(parsed.state);
  };

  // ------------------------------------------------------------- zapis pracy
  const save = useCallback(async (): Promise<boolean> => {
    const token = tokenRef.current;
    if (!token || savingRef.current || submittedRef.current) return false;
    const check = validateFiles(filesRef.current);
    if (!check.ok) {
      setSaveStatus("error");
      setNotice(check.error);
      return false;
    }

    savingRef.current = true;
    setSaveStatus("saving");
    const { data, error } = await getBrowserSupabase().rpc("practical_save", {
      p_token: token,
      p_files: filesRef.current,
    });
    savingRef.current = false;

    if (error) {
      setSaveStatus("error");
      if (error.message.includes("time_up")) setNotice("Czas minął — praca zostanie oddana automatycznie.");
      return false;
    }
    const parsed = parseSave(data);
    if (parsed) {
      setLastSavedAt(parsed.savedAt);
      clockOffsetRef.current = Date.parse(parsed.serverNow) - Date.now();
      if (parsed.endsAt) endsAtRef.current = Date.parse(parsed.endsAt);
    }
    dirtyRef.current = false;
    setSaveStatus("saved");
    return true;
  }, []);

  const onFilesChange = useCallback(
    (next: ProjectFile[]) => {
      setFiles(next);
      filesRef.current = next;
      dirtyRef.current = true;
      setSaveStatus("saving");
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS);
    },
    [save],
  );

  // zapis cykliczny co 30 s (na wypadek długiego pisania bez przerw)
  useEffect(() => {
    if (phase !== "working") return;
    const id = window.setInterval(() => {
      if (dirtyRef.current) void save();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [phase, save]);

  // ------------------------------------------------------------- oddanie
  const submit = useCallback(
    async (reason: PracticalEndedReason) => {
      const token = tokenRef.current;
      if (!token || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);

      const { data, error } = await getBrowserSupabase().rpc("practical_submit", {
        p_token: token,
        p_files: filesRef.current,
        p_reason: reason,
      });
      setSubmitting(false);

      if (error) {
        submittedRef.current = false;
        setNotice(friendlyError(error, "Nie udało się oddać pracy. Spróbuj jeszcze raz."));
        return;
      }
      // Tokenu wyniku uczniowi nie pokazujemy — ocenę ogłasza nauczyciel.
      // Sprawdzamy tylko, czy serwer potwierdził przyjęcie pracy.
      if (parseSubmit(data) === null) {
        setNotice("Praca została wysłana, ale serwer odpowiedział nietypowo. Zgłoś to nauczycielowi.");
      }
      setResetIn(20);
      setPhase("submitted");
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    },
    [],
  );

  // ------------------------------------------------- nadzór: karta i pełny ekran
  const reportSwitch = useCallback(async (kind: ProctorKind) => {
    const token = tokenRef.current;
    if (!token || submittedRef.current) return;
    const { data, error } = await getBrowserSupabase().rpc("practical_event", {
      p_token: token,
      p_type: kind === "tab" ? "tab_hidden" : kind === "focus" ? "focus_lost" : "fullscreen_exit",
      p_details: {},
    });
    if (error) return;
    // o zakończeniu decyduje serwer, który prowadzi licznik
    const parsed = parseEvent(data);
    if (parsed?.shouldEnd) void submit("tab_switch");
  }, [submit]);

  const { showWarning, dismissWarning, lastKind } = useProctorGuard({
    active: phase === "working",
    watchFullscreen: true,
    onViolation: (kind) => void reportSwitch(kind),
    onLimitExceeded: () => void submit("tab_switch"),
  });

  // Praca tylko w jednej karcie — druga dostaje ekran z informacją.
  const secondTab = useSingleTabLock("praktyka", phase === "working" || phase === "lobby");

  const onLargePaste = useCallback((length: number, file: string) => {
    const token = tokenRef.current;
    if (!token) return;
    // logujemy sam fakt i długość — bez treści
    void getBrowserSupabase().rpc("practical_event", {
      p_token: token,
      p_type: "large_paste",
      p_details: { length, file },
    });
  }, []);

  // Co 20 s pytamy serwer o czas: przestawienie zegara w komputerze zostaje
  // wyprostowane, a wcześniejsze zakończenie sesji przez nauczyciela — zauważone.
  useEffect(() => {
    if (phase !== "working") return;
    const id = window.setInterval(async () => {
      const token = tokenRef.current;
      if (!token || submittedRef.current) return;
      const { data, error } = await getBrowserSupabase().rpc("practical_time", { p_token: token });
      if (error) return;
      const parsed = parseServerTime(data);
      if (!parsed) return;
      clockOffsetRef.current = parsed.serverNow - Date.now();
      if (parsed.endsAt !== null) endsAtRef.current = parsed.endsAt;
    }, 20000);
    return () => window.clearInterval(id);
  }, [phase]);

  // ------------------------------------------------------------- zegar
  useEffect(() => {
    if (phase !== "working") return;
    const tick = () => {
      const endsAt = endsAtRef.current;
      if (endsAt === null) return;
      const serverNow = Date.now() + clockOffsetRef.current;
      const left = Math.max(0, Math.round((endsAt - serverNow) / 1000));
      setRemainingSec(left);
      if (left <= 0 && !submittedRef.current) void submit("time_up");
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [phase, submit]);

  // ostrzeżenie przed zamknięciem karty w trakcie pracy
  useEffect(() => {
    if (phase !== "working") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const startWork = async () => {
    const token = tokenRef.current;
    if (!token || !state) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setNotice("Bez trybu pełnoekranowego nie można rozpocząć. Zezwól przeglądarce na pełny ekran i spróbuj ponownie.");
      return;
    }
    // Gdyby serwer nie podał terminu (sesja bez ends_at albo błąd RPC), odliczamy
    // lokalnie od limitu sesji — lepiej to niż zamrożone 0:00. Najbliższa
    // synchronizacja z serwerem i tak nadpisze ten termin.
    if (endsAtRef.current === null) {
      endsAtRef.current = Date.now() + clockOffsetRef.current + state.session.minutes * 60000;
    }
    await getBrowserSupabase().rpc("practical_event", { p_token: token, p_type: "start", p_details: {} });
    setNotice(null);
    setPhase("working");
  };

  const confirmSubmit = () => {
    const left = remainingSec > 0 ? `Do końca zostało jeszcze ${formatClock(remainingSec)}. ` : "";
    if (window.confirm(`${left}Zakończyć podejście i oddać pracę? Po oddaniu nie można już nic zmienić.`))
      void submit("completed");
  };

  // =============================================================== ekrany
  if (secondTab) return <SecondTabBlocked title="Praca praktyczna jest już otwarta w innej karcie" />;

  if (phase === "working" && state) {
    return (
      <>
        {showWarning && (
          <ProctorWarning
            kind={lastKind}
            onConfirm={dismissWarning}
            onReturnFullscreen={() => void document.documentElement.requestFullscreen().catch(() => undefined)}
          />
        )}
        <IdeWorkspace
          state={state}
          files={files}
          onFilesChange={onFilesChange}
          remainingSec={remainingSec}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onSubmit={confirmSubmit}
          submitting={submitting}
          onLargePaste={onLargePaste}
        />
        {notice && (
          <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
            <p className="alert-error shadow-card">{notice}</p>
          </div>
        )}
      </>
    );
  }

  if (phase === "submitted") {
    // Bez linku do wyniku: praca siedzi w bazie, ocenę pokazuje nauczyciel.
    // Po chwili ekran sam wraca do wyboru egzaminu, żeby przy tym komputerze
    // mógł usiąść kolejny uczeń.
    return (
      <div className="mx-auto max-w-lg animate-fade-up">
        <div className="card p-6 text-center sm:p-8">
          <CircleCheckBig size={40} className="mx-auto text-accent" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Praca oddana</h1>
          <p className="mt-2 text-muted">
            {state?.studentName}, Twoja praca została zapisana. Wynik ogłosi nauczyciel po sprawdzeniu.
          </p>
          <p className="mt-6 text-sm text-muted">
            Ekran wróci do wyboru egzaminu za <span className="font-mono text-accent">{resetIn}</span> s.
          </p>
          <button type="button" className="btn-primary mt-4 w-full py-3" onClick={resetToJoin}>
            Gotowe — zwolnij komputer
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finished" && state) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Lock size={32} className="mx-auto text-muted" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Sesja została zakończona</p>
        <p className="mt-1 text-muted">Nauczyciel zamknął tę sesję. Twoja praca (jeśli została oddana) czeka na ocenę.</p>
      </div>
    );
  }

  if (phase === "lobby" && state) {
    const active = state.session.status === "active";
    return (
      <div className="mx-auto max-w-lg animate-fade-up">
        <div className="card p-6 text-center sm:p-8">
          <p className="eyebrow">{"// poczekalnia"}</p>
          <h1 className="mt-2 text-2xl font-bold">{state.task.title}</h1>
          <p className="mt-1 text-sm text-muted">{state.task.summary}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="chip">
              <User size={12} aria-hidden /> {state.studentName}
            </span>
            <span className="chip">
              <Timer size={12} aria-hidden /> {state.session.minutes} min
            </span>
            <span className="chip">{state.task.files.length} plików</span>
          </div>

          {active ? (
            <>
              <div className="alert-ok mt-6 text-left">
                Nauczyciel rozpoczął egzamin. Po kliknięciu poniżej strona przejdzie w tryb pełnoekranowy.
              </div>
              <ul className="mt-4 space-y-1 text-left text-sm text-muted">
                <li>• Wyjście z pełnego ekranu, zmiana karty i przejście do innego okna są rejestrowane.</li>
                <li>• Za drugim razem praca zostanie oddana automatycznie.</li>
                <li>• Czas liczy serwer — zmiana zegara w komputerze nic nie daje.</li>
                <li>• Kod zapisuje się sam — po odświeżeniu strony wracasz do swojej pracy.</li>
              </ul>
              <button type="button" className="btn-primary mt-6 w-full py-3" onClick={() => void startWork()}>
                Rozpocznij pracę ▶
              </button>
            </>
          ) : (
            <p className="mt-6 animate-pulse text-muted">Czekaj na rozpoczęcie przez nauczyciela…</p>
          )}
          {notice && <p className="alert-error mt-4 text-left">{notice}</p>}
        </div>
      </div>
    );
  }

  // ekran dołączania
  return (
    <div className="mx-auto max-w-md animate-fade-up">
      <div className="card p-6 sm:p-8">
        <div className="text-center">
          <p className="eyebrow">{"// część praktyczna"}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Egzamin praktyczny</h1>
          <p className="mt-2 text-sm text-muted">Wpisz PIN sesji od nauczyciela i swoje imię.</p>
        </div>

        <form onSubmit={join} className="mt-7 space-y-5" noValidate>
          <div>
            <p className="label text-center">PIN sesji</p>
            <PinInput
              key={pinShake}
              value={pin}
              onChange={(v) => {
                setPin(v);
                if (joinError) setJoinError(null);
              }}
              disabled={joining}
              invalid={joinError !== null && pinShake > 0}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="practical-name" className="label">
              Imię
            </label>
            <input
              id="practical-name"
              className="input py-3 text-base"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (joinError) setJoinError(null);
              }}
              maxLength={PRACTICAL_LIMITS.studentName.max}
              placeholder="np. Ania K."
              autoComplete="given-name"
            />
          </div>
          {joinError && (
            <p className="alert-error" role="alert">
              {joinError}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full py-3"
            disabled={joining || pin.length !== LIMITS.pinLength || name.trim().length < 2}
          >
            {joining ? (
              "Dołączanie…"
            ) : (
              <>
                Dołącz do sesji <ArrowRight size={16} aria-hidden />
              </>
            )}
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          Pracujesz w przeglądarce: arkusz, edytor kodu i podgląd strony. Wszystko zapisuje się automatycznie.
        </p>
      </div>
    </div>
  );
}
