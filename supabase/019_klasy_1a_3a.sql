-- =============================================================================
-- 019_klasy_1a_3a.sql — dwie nowe klasy
--
-- Uruchom po 018_attempt_answers.sql (wymaga tabeli `classes` z migracji 010).
--
--   1a → INF.03
--   3a → INF.04
--
-- Od migracji 010 klasy nie siedzą już w CHECK-ach, tylko w tabeli `classes`,
-- a `progress.class_name` i `practical_sessions.class_name` wskazują na nią
-- kluczem obcym. Dopisanie klasy to więc jeden insert — plus lustrzany wpis
-- w `CLASS_QUALIFICATION` w `types/db.ts`, żeby interfejs nie musiał czekać
-- na zapytanie. Pilnuje tego `tests/sql/klasy.mjs`: porównuje tabelę z mapą
-- w TypeScripcie i krzyczy, gdy się rozjadą.
-- =============================================================================

do $$
begin
  if to_regclass('public.classes') is null then
    raise exception 'Brakuje migracji 010_inf04.sql (tabela classes) — uruchom migracje po kolei przed 019.';
  end if;
end $$;

insert into classes (name, qualification, position) values
  ('1a', 'inf03', 10),
  ('3a', 'inf04', 50)
on conflict (name) do nothing;

-- Kolejność na listach wyboru: najpierw INF.03 od najmłodszego rocznika,
-- potem INF.04. Numery z przeskokiem, żeby dało się kiedyś wcisnąć klasę
-- w środek bez przenumerowywania wszystkiego.
update classes set position = v.position
from (values
  ('1a', 10), ('2a', 20), ('4e', 30), ('4d', 40),
  ('3a', 50), ('4a', 60), ('4g', 70)
) as v(name, position)
where classes.name = v.name and classes.position is distinct from v.position;

-- Kontrola: obie klasy są i mają właściwą kwalifikację.
do $$
declare v_brak text;
begin
  select string_agg(w.name, ', ') into v_brak
  from (values ('1a', 'inf03'), ('3a', 'inf04')) as w(name, qualification)
  where not exists (
    select 1 from classes c where c.name = w.name and c.qualification = w.qualification
  );
  if v_brak is not null then
    raise exception 'Migracja 019: nie udalo sie dodac klas: %. Sprawdz, czy nie istnieja juz z inna kwalifikacja.', v_brak;
  end if;
end $$;
