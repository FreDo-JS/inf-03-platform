// Obrazek do pytania testu: zmniejszenie i kompresja w przeglądarce nauczyciela,
// zanim trafi do treści testu jako data URI. Baza przyjmuje tylko obrazy rastrowe
// (bez SVG) do 600 tys. znaków — tu dbamy, żeby zwykłe zdjęcie czy zrzut ekranu
// zmieściło się z zapasem.

import { LIMITS } from "@/lib/validation";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIDE = 1200;
/** Większego pliku nawet nie próbujemy dekodować — to raczej nie jest ilustracja do pytania. */
const MAX_SOURCE_BYTES = 15_000_000;

export const IMAGE_ACCEPT = ACCEPTED.join(",");

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

/** Zmniejsza obrazek do maks. 1200 px i zapisuje jako WebP (albo JPEG), aż zmieści się w limicie. */
export async function compressImage(file: File): Promise<ImageResult> {
  if (!ACCEPTED.includes(file.type)) {
    return { ok: false, error: "Obsługiwane formaty: PNG, JPEG, WebP, GIF (bez SVG)." };
  }
  if (file.size > MAX_SOURCE_BYTES) return { ok: false, error: "Plik jest za duży (maks. 15 MB)." };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: "Nie udało się odczytać obrazka." };
  }

  // kolejne próby: coraz mniejszy rozmiar i jakość, dopóki nie zmieścimy się w limicie bazy
  const steps: [number, number][] = [
    [MAX_SIDE, 0.85],
    [MAX_SIDE, 0.7],
    [900, 0.7],
    [700, 0.6],
    [500, 0.55],
  ];
  for (const [side, quality] of steps) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, error: "Przeglądarka nie obsługuje przetwarzania obrazków." };
    // białe tło: przezroczystość w JPEG zrobiłaby się czarna
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL("image/webp", quality);
    if (!dataUrl.startsWith("data:image/webp")) dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (dataUrl.length <= LIMITS.image.max) {
      bitmap.close();
      return { ok: true, dataUrl };
    }
  }
  bitmap.close();
  return { ok: false, error: "Obrazek jest zbyt szczegółowy — nie da się go zmniejszyć do limitu. Przytnij go." };
}
