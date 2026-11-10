-- =============================================================================
-- 032_question_images.sql — obrazek jako ilustracja pytania
--
-- Uruchom po 031_multi_questions.sql.
--
-- Pytanie jednokrotnego wyboru (`closed`, przyciski radio) i pytanie z polem
-- tekstowym (`input`) mogą mieć obrazek — schemat, zrzut ekranu, wynik działania
-- kodu — i krótki opis alternatywny:
--
--   {"type":"input","text":"Jaki kolor tła ma element?","image":"data:image/webp;base64,...","alt":"..."}
--
-- Obrazek jest OSADZONY w treści pytania (data URI), a nie linkiem:
--   * w pracowni bywa słaby internet, a test nie może czekać na cudzy serwer,
--   * nie trzeba zakładać koszyka w Supabase Storage ani polityk do niego,
--   * uczeń dostaje obrazek razem z pytaniami po wpisaniu PIN-u — przed PIN-em
--     nie widzi go tak samo jak treści.
-- Dozwolone są tylko obrazy rastrowe (png, jpeg, webp, gif). SVG odpada, bo to
-- dokument, który może zawierać skrypty i odwołania. Panel zmniejsza i kompresuje
-- obrazek przed zapisem, a baza pilnuje limitów: 600 tys. znaków na obrazek
-- (ok. 450 KB) i ok. 4 MB na cały test.
--
-- Zmienia się tylko questions_valid (tekst funkcji z 031 + sprawdzanie obrazka).
-- create_test i submit_attempt zostają bez zmian: obrazek nie wpływa na ocenę.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'questions_valid'
                   and pg_get_functiondef(p.oid) like '%multi%') then
    raise exception 'Brakuje migracji 031_multi_questions.sql — uruchom ją przed 032.';
  end if;
end $$;

create or replace function public.questions_valid(q jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  opt jsonb;
  n_opts int;
  n_distinct int;
  n_left int;
begin
  if q is null or jsonb_typeof(q) <> 'array' then return false; end if;
  if jsonb_array_length(q) not between 1 and 100 then return false; end if;
  -- obrazki są w treści testu, więc pilnujemy całości: maks. ok. 4 MB
  if octet_length(q::text) > 4000000 then return false; end if;

  for item in select * from jsonb_array_elements(q) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if coalesce(item->>'type', '') not in ('closed','select','input','matching','gaps','multi') then return false; end if;
    if jsonb_typeof(item->'text') is distinct from 'string' then return false; end if;
    if char_length(btrim(item->>'text')) not between 1 and 500 then return false; end if;

    -- obrazek do pytania (032): tylko osadzony obraz rastrowy, bez SVG i bez
    -- adresów zewnętrznych — nic nie pobiera się z cudzych serwerów w trakcie testu
    if item ? 'image' and jsonb_typeof(item->'image') <> 'null' then
      if item->>'type' not in ('closed','input') then return false; end if;
      if jsonb_typeof(item->'image') <> 'string' then return false; end if;
      if char_length(item->>'image') > 600000 then return false; end if;
      if (item->>'image') !~ '^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$' then return false; end if;
    end if;
    if item ? 'alt' and jsonb_typeof(item->'alt') <> 'null' then
      if jsonb_typeof(item->'alt') <> 'string' then return false; end if;
      if char_length(item->>'alt') > 200 then return false; end if;
    end if;

    if item->>'type' in ('closed','select','multi') then
      if jsonb_typeof(item->'options') is distinct from 'array' then return false; end if;
      n_opts := jsonb_array_length(item->'options');
      if n_opts not between 2 and 10 then return false; end if;
      for opt in select * from jsonb_array_elements(item->'options') loop
        if jsonb_typeof(opt) <> 'string' then return false; end if;
        if char_length(btrim(opt #>> '{}')) not between 1 and 200 then return false; end if;
      end loop;
      select count(distinct btrim(v)) into n_distinct
        from jsonb_array_elements_text(item->'options') as v;
      if n_distinct <> n_opts then return false; end if;

    elsif item->>'type' = 'matching' then
      if jsonb_typeof(item->'left') is distinct from 'array'
         or jsonb_typeof(item->'right') is distinct from 'array' then return false; end if;
      n_left := jsonb_array_length(item->'left');
      if n_left not between 2 and 10 then return false; end if;
      if jsonb_array_length(item->'right') <> n_left then return false; end if;
      for opt in select * from jsonb_array_elements(item->'left')
                  union all select * from jsonb_array_elements(item->'right') loop
        if jsonb_typeof(opt) <> 'string' then return false; end if;
        if char_length(btrim(opt #>> '{}')) not between 1 and 150 then return false; end if;
      end loop;
      select count(distinct btrim(v)) into n_distinct from jsonb_array_elements_text(item->'left') as v;
      if n_distinct <> n_left then return false; end if;
      select count(distinct btrim(v)) into n_distinct from jsonb_array_elements_text(item->'right') as v;
      if n_distinct <> n_left then return false; end if;
      if item ? 'options' and jsonb_typeof(item->'options') <> 'null' then return false; end if;

    elsif item->>'type' = 'gaps' then
      if jsonb_typeof(item->'code') is distinct from 'string' then return false; end if;
      if char_length(item->>'code') not between 1 and 2000 then return false; end if;
      if public.gaps_count(item->>'code') = 0 then return false; end if;
      if item ? 'options' and jsonb_typeof(item->'options') <> 'null' then return false; end if;

    else -- input
      if item ? 'options' and jsonb_typeof(item->'options') <> 'null' then return false; end if;
    end if;
  end loop;

  return true;
end;
$$;
