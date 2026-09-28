"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renderuje warstwę nakładaną na stronę bezpośrednio w <body>.
 *
 * Bez tego okno modalne siedzi w drzewie treści i łapie style kontenera —
 * np. `space-y-8` dokłada `margin-top` KAŻDEMU dziecku, także elementowi
 * `position: fixed`. Tło modala zaczynało się wtedy 32 px poniżej krawędzi
 * okna i nie przykrywało góry strony.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [gotowe, setGotowe] = useState(false);

  useEffect(() => {
    setGotowe(true);
  }, []);

  if (!gotowe) return null;
  return createPortal(children, document.body);
}
