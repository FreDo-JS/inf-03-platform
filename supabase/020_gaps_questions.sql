-- =============================================================================
-- 020_gaps_questions.sql — piąty typ pytania: uzupełnianie luk w kodzie
--
-- Uruchom po 019_klasy_1a_3a.sql.
--
-- Pytanie pokazuje fragment kodu z lukami, a uczeń wpisuje brakujące fragmenty.
-- Odpowiednik „Fill in the blanks" z Moodle/CodeRunnera, tyle że bez
-- uruchamiania kodu — sprawdzamy tekst, nie wynik działania programu.
--
-- Format pytania (publiczny, w tests.questions):
--   {"type":"gaps","text":"Uzupełnij regułę…","code":"div {\n  display: [[1]];\n}"}
--
--   * markery [[1]], [[2]], … numerowane od 1 bez przerw, każdy dokładnie raz,
--     od 1 do 10 luk na pytanie,
--   * `code` to zwykły tekst — nigdy nie jest wykonywany, ani u ucznia,
--     ani w panelu; renderujemy go jako tekst w <pre>.
--
-- Format klucza (tajny, w test_keys.answers) — tablica tablic, po jednej
-- na lukę, w każdej akceptowane warianty:
--   [["flex"], ["column","kolumna"]]
--
-- Odpowiedź ucznia: tablica napisów w kolejności luk (["flex","column"]).
--
-- Ocena: **zero-jedynkowa, jak przy dopasowywaniu par** — punkt jest za komplet
-- poprawnych luk. Model punktacji w tej aplikacji to jeden punkt za pytanie
-- (`attempts.score` to liczba całkowita), więc punkty cząstkowe wymagałyby
-- przebudowy całej oceny. Analiza pytań pokazuje za to skuteczność każdej luki
-- z osobna, więc widać, która konkretnie sprawia kłopot.
--
-- Porównanie przez normalize_answer() — tak samo jak przy pytaniach otwartych:
-- bez wielkości liter i bez nadmiaru spacji. Dla kodu to kompromis (JavaScript
-- rozróżnia wielkość liter), ale uczeń nie traci punktu za „Flex" zamiast
-- „flex", a przy pytaniach o nazwy własne nauczyciel i tak wpisuje warianty.
-- =============================================================================

do $$
begin
  if to_regclass('public.test_keys') is null then
    raise exception 'Brakuje schema.sql — uruchom migracje po kolei przed 020.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'attempts' and column_name = 'answers') then
    raise exception 'Brakuje migracji 018_attempt_answers.sql — uruchom ja przed 020.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Liczba luk w kodzie
-- -----------------------------------------------------------------------------
-- Zwraca liczbę luk albo 0, gdy numeracja jest niepoprawna (dziura, duplikat,
-- numer spoza zakresu). Jedno miejsce prawdy dla walidacji pytania, walidacji
-- klucza i oceniania — lustrzana funkcja `gapsInCode` siedzi w lib/validation.ts.

create or replace function public.gaps_count(p_code text)
returns int
language plpgsql
immutable
set search_path = public
as $$
declare
  n int;
  i int;
begin
  if p_code is null then return 0; end if;

  select count(*) into n from regexp_matches(p_code, '\[\[([0-9]+)\]\]', 'g');
  if n is null or n < 1 or n > 10 then return 0; end if;

  -- każdy numer od 1 do n dokładnie raz; to wyklucza dziury i duplikaty,
  -- a przy okazji numery spoza zakresu (bo wtedy któregoś z 1..n zabraknie)
  for i in 1 .. n loop
    if (select count(*) from regexp_matches(p_code, '\[\[' || i || '\]\]', 'g')) <> 1 then
      return 0;
    end if;
  end loop;

  return n;
end;
$$;

revoke all on function public.gaps_count(text) from public, anon;
grant execute on function public.gaps_count(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. questions_valid — struktura pytania z lukami
-- -----------------------------------------------------------------------------

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

  for item in select * from jsonb_array_elements(q) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if coalesce(item->>'type', '') not in ('closed','select','input','matching','gaps') then return false; end if;
    if jsonb_typeof(item->'text') is distinct from 'string' then return false; end if;
    if char_length(btrim(item->>'text')) not between 1 and 500 then return false; end if;

    if item->>'type' in ('closed','select') then
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

-- -----------------------------------------------------------------------------
-- 3. create_test — walidacja klucza dla pytań z lukami
-- -----------------------------------------------------------------------------
-- Sygnatura i reszta zachowania bez zmian (wersja z 010). Dochodzi gałąź `gaps`:
-- klucz to tablica tablic — jedna na lukę, w środku warianty odpowiedzi.

create or replace function public.create_test(
  p_title text,
  p_time_limit int,
  p_questions jsonb,
  p_keys jsonb,
  p_pin text default null,
  p_qualification text default 'inf03'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid; v_pin text; i int; j int; q jsonb; k jsonb; kg jsonb; v text; n_same int;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_qualification is null or p_qualification not in ('inf03', 'inf04') then
    raise exception 'invalid_qualification' using errcode = '22023';
  end if;

  v_pin := coalesce(nullif(btrim(p_pin), ''), public.random_pin());
  if v_pin !~ '^[0-9]{6}$' then raise exception 'invalid_pin' using errcode = '22023'; end if;

  p_title := btrim(coalesce(p_title, ''));
  if char_length(p_title) not between 1 and 120 then raise exception 'invalid_title' using errcode = '22023'; end if;
  if p_time_limit is null or p_time_limit not between 60 and 7200 then raise exception 'invalid_time_limit' using errcode = '22023'; end if;
  if not public.questions_valid(p_questions) then raise exception 'invalid_questions' using errcode = '22023'; end if;
  if p_keys is null or jsonb_typeof(p_keys) <> 'array'
     or jsonb_array_length(p_keys) <> jsonb_array_length(p_questions) then
    raise exception 'invalid_keys' using errcode = '22023';
  end if;

  for i in 0 .. jsonb_array_length(p_questions) - 1 loop
    q := p_questions -> i;
    k := p_keys -> i;
    if jsonb_typeof(k) <> 'array' then raise exception 'invalid_keys' using errcode = '22023'; end if;

    if q->>'type' = 'matching' then
      if jsonb_array_length(k) <> jsonb_array_length(q->'left') then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      select count(*) into n_same
      from (select btrim(kv.value) from jsonb_array_elements_text(k) as kv(value)
            except all
            select btrim(rv.value) from jsonb_array_elements_text(q->'right') as rv(value)) d;
      if n_same <> 0 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 150 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      end loop;

    elsif q->>'type' = 'gaps' then
      -- jedna pozycja klucza na lukę, w każdej 1–5 wariantów odpowiedzi
      if jsonb_array_length(k) <> public.gaps_count(q->>'code') then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      for j in 0 .. jsonb_array_length(k) - 1 loop
        kg := k -> j;
        if jsonb_typeof(kg) <> 'array' then raise exception 'invalid_keys' using errcode = '22023'; end if;
        if jsonb_array_length(kg) not between 1 and 5 then raise exception 'invalid_keys' using errcode = '22023'; end if;
        for v in select * from jsonb_array_elements_text(kg) loop
          if v is null or char_length(btrim(v)) not between 1 and 100 then
            raise exception 'invalid_keys' using errcode = '22023';
          end if;
        end loop;
      end loop;

    else
      if jsonb_array_length(k) not between 1 and 10 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 200 then raise exception 'invalid_keys' using errcode = '22023'; end if;
      end loop;
      if q->>'type' in ('closed','select') then
        if jsonb_array_length(k) <> 1 or not ((q->'options') @> jsonb_build_array(k->>0)) then
          raise exception 'invalid_keys' using errcode = '22023';
        end if;
      end if;
    end if;
  end loop;

  insert into tests (title, time_limit, questions, qualification, created_by)
  values (p_title, p_time_limit, p_questions, p_qualification, auth.uid())
  returning id into v_id;

  insert into test_keys (test_id, answers, pin) values (v_id, p_keys, v_pin);
  return jsonb_build_object('id', v_id, 'pin', v_pin);
end;
$$;

revoke all on function public.create_test(text, int, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.create_test(text, int, jsonb, jsonb, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. submit_attempt — ocena pytań z lukami
-- -----------------------------------------------------------------------------
-- Wersja z 018 (zapis odpowiedzi i wyników) plus gałąź `gaps`. Reszta bez zmian.

create or replace function public.submit_attempt(
  p_session_id uuid,
  p_answers jsonb,
  p_ended_reason text default 'completed',
  p_tab_switches int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s test_sessions%rowtype;
  v_test tests%rowtype;
  v_keys jsonb;
  v_total int;
  v_score int := 0;
  v_results jsonb := '[]'::jsonb;
  v_answers jsonb := '[]'::jsonb;
  v_given jsonb;
  v_norm jsonb;
  v_key jsonb;
  v_answer text;
  v_type text;
  v_ok boolean;
  v_duration int;
  v_reason text;
  v_switches int;
  v_bad int;
  i int;
begin
  select * into v_s from test_sessions where id = p_session_id for update;
  if not found or v_s.started_at is null then
    raise exception 'session_invalid' using errcode = '22023';
  end if;
  if v_s.submitted_at is not null then
    raise exception 'duplicate_attempt' using errcode = '23505';
  end if;

  select * into v_test from tests where id = v_s.test_id;
  select answers into v_keys from test_keys where test_id = v_s.test_id;
  if v_test.id is null or v_keys is null then
    raise exception 'test_not_found' using errcode = 'P0002';
  end if;

  if now() > v_s.started_at + make_interval(secs => v_test.time_limit + 300) then
    raise exception 'session_expired' using errcode = '22023';
  end if;

  -- powód i licznik przychodzą z przeglądarki, więc traktujemy je ostrożnie:
  -- nieznany powód → 'completed', licznik przycięty do rozsądnego zakresu
  v_reason := case when p_ended_reason in ('completed', 'time_up', 'tab_switch') then p_ended_reason else 'completed' end;
  v_switches := least(greatest(coalesce(p_tab_switches, 0), 0), 1000);
  if v_reason = 'tab_switch' and v_switches < 1 then
    v_switches := 1;
  end if;

  v_total := jsonb_array_length(v_test.questions);
  if p_answers is null or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) > v_total then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  -- pytania bez odpowiedzi liczą się jako błędne (tak samo jak po upływie czasu)
  for i in 0 .. v_total - 1 loop
    v_given := p_answers -> i;
    v_key := v_keys -> i;
    v_type := (v_test.questions -> i) ->> 'type';

    if v_type = 'matching' then
      if v_given is null or jsonb_typeof(v_given) <> 'array'
         or jsonb_array_length(v_given) <> jsonb_array_length(v_key) then
        v_ok := false;
      else
        select count(*) into v_bad
        from generate_series(0, jsonb_array_length(v_key) - 1) as g(j)
        where jsonb_typeof(v_given -> g.j) is distinct from 'string'
           or public.normalize_answer(v_given ->> g.j) is distinct from public.normalize_answer(v_key ->> g.j)
           or public.normalize_answer(v_key ->> g.j) = '';
        v_ok := v_bad = 0;
      end if;

    elsif v_type = 'gaps' then
      -- odpowiedź = napisy w kolejności luk; zalicza się komplet trafionych luk,
      -- a każda luka ma własną listę akceptowanych wariantów
      if v_given is null or jsonb_typeof(v_given) <> 'array'
         or jsonb_array_length(v_given) <> jsonb_array_length(v_key) then
        v_ok := false;
      else
        select count(*) into v_bad
        from generate_series(0, jsonb_array_length(v_key) - 1) as g(j)
        where jsonb_typeof(v_given -> g.j) is distinct from 'string'
           or public.normalize_answer(left(v_given ->> g.j, 200)) = ''
           or not exists (
                select 1 from jsonb_array_elements_text(v_key -> g.j) as kv
                where public.normalize_answer(kv) = public.normalize_answer(left(v_given ->> g.j, 200))
              );
        v_ok := v_bad = 0;
      end if;

    else
      v_answer := case when jsonb_typeof(v_given) = 'string' then left(p_answers ->> i, 500) else null end;
      v_ok := v_answer is not null
        and public.normalize_answer(v_answer) <> ''
        and exists (
          select 1 from jsonb_array_elements_text(v_key) as k
          where public.normalize_answer(k) = public.normalize_answer(v_answer)
        );
    end if;

    -- zapis odpowiedzi do analizy pytań (migracja 018): napis albo tablica,
    -- przycięte; nadmiarowo długie tablice pomijamy
    if v_type in ('matching', 'gaps') then
      if v_given is null or jsonb_typeof(v_given) <> 'array' or jsonb_array_length(v_given) > 40 then
        v_norm := 'null'::jsonb;
      else
        select coalesce(jsonb_agg(left(e, 200) order by ord), '[]'::jsonb)
        into v_norm
        from jsonb_array_elements_text(v_given) with ordinality as t(e, ord);
      end if;
    else
      v_answer := case when jsonb_typeof(v_given) = 'string' then left(p_answers ->> i, 500) else null end;
      v_norm := case when v_answer is null then 'null'::jsonb else to_jsonb(v_answer) end;
    end if;

    if v_ok then v_score := v_score + 1; end if;
    v_results := v_results || to_jsonb(v_ok);
    v_answers := v_answers || jsonb_build_array(v_norm);
  end loop;

  if length(v_answers::text) > 60000 then
    v_answers := null;
  end if;

  v_duration := least(greatest(extract(epoch from now() - v_s.started_at)::int, 0), v_test.time_limit);

  insert into attempts (test_id, test_title, student_name, score, total, duration_sec,
                        ended_reason, tab_switch_count, answers, results)
  values (v_test.id, v_test.title, v_s.student_name, v_score, v_total, v_duration,
          v_reason, v_switches, v_answers, v_results);

  update test_sessions set submitted_at = now() where id = p_session_id;

  return jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'results', v_results,
    'duration_sec', v_duration,
    'ended_reason', v_reason,
    'tab_switch_count', v_switches
  );
end;
$$;

revoke all on function public.submit_attempt(uuid, jsonb, text, int) from public;
grant execute on function public.submit_attempt(uuid, jsonb, text, int) to anon, authenticated;
