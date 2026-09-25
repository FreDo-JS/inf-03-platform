import Image from "next/image";

/**
 * Znak marki: logo (public/tebby.png, PNG z przezroczystym tłem) i nazwa.
 * Favicon to ten sam obrazek — app/icon.png, które Next podpina automatycznie.
 */
export function Brand({ size = 28 }: { size?: number }) {
  return (
    <>
      <Image src="/tebby.png" alt="" width={size} height={size} priority className="shrink-0" />
      <span className="text-[15px] font-semibold tracking-tight">Tebby</span>
    </>
  );
}
