"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const CEL = "/admin/haslo";

/**
 * Przechwytuje link z mejla (zaproszenie, reset hasła) na dowolnej stronie.
 *
 * Supabase odsyła po weryfikacji pod adres ustawiony jako Site URL — zwykle
 * stronę główną — dołączając dane sesji po krzyżyku (#access_token=…) albo jako
 * ?code=… . Bez tego przekierowania użytkownik ląduje na mapie nauki, token
 * przepada i nie ma gdzie ustawić hasła. Przenosimy go razem z tokenem na
 * stronę ustawiania hasła.
 */
export function InviteCatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === CEL) return;

    const hash = window.location.hash;
    const query = new URLSearchParams(window.location.search);
    const typ = new URLSearchParams(hash.replace(/^#/, "")).get("type") ?? query.get("type");

    const maToken = hash.includes("access_token=") || query.has("code");
    const zLinkuMejlowego = typ === "invite" || typ === "recovery" || typ === "signup" || typ === null;

    if (maToken && zLinkuMejlowego) {
      router.replace(`${CEL}${window.location.search}${hash}`);
    }
  }, [pathname, router]);

  return null;
}
