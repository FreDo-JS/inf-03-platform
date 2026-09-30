// Wspólny generator plików testów.
//
// Pytania piszemy jako obiekty z jawnie zaznaczoną poprawną odpowiedzią, a ten
// moduł losuje kolejność opcji tak, żeby poprawne odpowiedzi rozłożyły się
// równo między pozycje. Wcześniej wszystkie stały na pierwszym miejscu.
import { writeFileSync } from "node:fs";

const KATALOG = "C:/Users/User/Desktop/inf03/supabase/testy/";

/** Deterministyczny generator pseudolosowy (mulberry32) — ten sam plik za każdym razem. */
function los(ziarno) {
  let a = ziarno;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function przetasuj(tab, rnd) {
  const a = [...tab];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const esc = (s) => JSON.stringify(s).slice(1, -1);

export function zbuduj({ plik, naglowek, tytul, czas, kwalifikacja, pytania, ziarno }) {
  const rnd = los(ziarno);

  // Pozycje docelowe dla poprawnych odpowiedzi: pula wyrównana i przetasowana,
  // żeby ani nie leciały po kolei, ani nie skupiały się w jednym miejscu.
  const zamkniete = pytania.filter((q) => q.typ === "zamkniete" || q.typ === "lista");
  const pula = przetasuj(
    zamkniete.map((q, i) => i % q.opcje.length),
    rnd,
  );
  let nr = 0;

  const wyjQ = [];
  const wyjK = [];

  for (const q of pytania) {
    if (q.typ === "zamkniete" || q.typ === "lista") {
      if (!q.opcje.includes(q.poprawna)) throw new Error(`Poprawna spoza opcji: ${q.text}`);
      const zle = przetasuj(q.opcje.filter((o) => o !== q.poprawna), rnd);
      const cel = Math.min(pula[nr++], q.opcje.length - 1);
      const opcje = [...zle];
      opcje.splice(cel, 0, q.poprawna);
      const typ = q.typ === "lista" ? "select" : "closed";
      wyjQ.push(`{"type":"${typ}","text":"${esc(q.text)}","options":[${opcje.map((o) => `"${esc(o)}"`).join(",")}]}`);
      wyjK.push(`["${esc(q.poprawna)}"]`);
    } else if (q.typ === "otwarte") {
      wyjQ.push(`{"type":"input","text":"${esc(q.text)}"}`);
      wyjK.push(`[${q.akceptowane.map((a) => `"${esc(a)}"`).join(", ")}]`);
    } else if (q.typ === "pary") {
      const lewa = q.pary.map(([l]) => l);
      const klucz = q.pary.map(([, p]) => p);
      const prawa = przetasuj(klucz, rnd);
      if (prawa.join("|") === klucz.join("|")) prawa.push(prawa.shift()); // nie zdradzaj kolejności
      wyjQ.push(
        `{"type":"matching","text":"${esc(q.text)}","left":[${lewa.map((l) => `"${esc(l)}"`).join(",")}],"right":[${prawa
          .map((p) => `"${esc(p)}"`)
          .join(",")}]}`,
      );
      wyjK.push(`[${klucz.map((k) => `"${esc(k)}"`).join(", ")}]`);
    } else {
      throw new Error("nieznany typ: " + q.typ);
    }
  }

  const sql = `${naglowek}

with nowy as (
  insert into tests (title, time_limit, questions, qualification)
  values (
    '${tytul.replace(/'/g, "''")}',
    ${czas},
    $json$[
${wyjQ.map((q) => "      " + q).join(",\n")}
    ]$json$::jsonb,
    '${kwalifikacja}'
  )
  returning id
)
insert into test_keys (test_id, answers)
select id, $json$[
${wyjK.map((k) => "  " + k).join(",\n")}
]$json$::jsonb
from nowy;
`;

  writeFileSync(KATALOG + plik, sql);

  // raport rozkładu
  const rozklad = {};
  const litery = "ABCDEFGH";
  wyjQ.forEach((q, i) => {
    const o = JSON.parse(q);
    if (o.type !== "closed" && o.type !== "select") return;
    const k = JSON.parse(wyjK[i])[0];
    const l = litery[o.options.indexOf(k)];
    rozklad[l] = (rozklad[l] ?? 0) + 1;
  });
  const typy = wyjQ.reduce((m, q) => {
    const t = JSON.parse(q).type;
    return { ...m, [t]: (m[t] ?? 0) + 1 };
  }, {});
  console.log(
    `${plik}: ${pytania.length} pyt. | typy ${JSON.stringify(typy)} | poprawne na pozycjach ${JSON.stringify(rozklad)}`,
  );
}
