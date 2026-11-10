-- =============================================================================
-- 033_subtopic_notes.sql — teoria przy podtemacie mapy nauki
--
-- Uruchom po 032_question_images.sql.
--
-- Część podtematów nie ma żadnego materiału (linku). Zamiast szukać linku na
-- siłę, podtemat może mieć własne opracowanie: krótką teorię w Markdownie,
-- którą uczeń otwiera w oknie „Teoria" na mapie nauki. Jeden podtemat = jedna
-- notatka.
--
-- Odczyt jest publiczny (tak jak sama mapa i linki), zapis tylko dla
-- nauczyciela. Treść renderujemy w przeglądarce przez react-markdown bez
-- surowego HTML-a, więc notatka nie może wstrzyknąć skryptu.
--
-- Same treści dochodzą osobnymi plikami (034 i kolejne), generowanymi
-- z scripts/teoria/<dział>/*.md.
-- =============================================================================

do $$
begin
  if to_regproc('public.is_admin') is null then
    raise exception 'Brakuje migracji 008_security_hardening.sql — uruchom migracje po kolei przed 033.';
  end if;
end $$;

create table if not exists subtopic_notes (
  subtopic_id text primary key references subtopics(id) on delete cascade,
  content_md text not null check (char_length(btrim(content_md)) between 1 and 20000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table subtopic_notes enable row level security;

do $$
begin
  create policy "public read subtopic_notes" on subtopic_notes for select using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin write subtopic_notes" on subtopic_notes for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

grant select on subtopic_notes to anon, authenticated;
