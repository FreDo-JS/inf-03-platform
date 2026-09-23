-- =============================================================================
-- INF.03 — migracja 004: czwarty typ pytania „matching” (dopasowywanie par)
-- Kolejność: schema.sql → 002 → seed.sql → 003 → 004_matching_questions.sql
--
-- Format pytania w tests.questions (publiczny, BEZ poprawnych par):
--   {"type":"matching","text":"...","left":["SELECT","INSERT"],
--                                    "right":["dodawanie wierszy","pobieranie danych"]}
--   Kolumna `right` jest zapisana w losowej kolejności — samo pytanie nie
--   zdradza dopasowania.
-- Klucz w test_keys.answers (tajny) dla pytania matching:
--   ["pobieranie danych","dodawanie wierszy"]  ← wartości `right` w kolejności `left`
-- Odpowiedź ucznia w submit_attempt: tablica wartości `right` w kolejności `left`.
-- Punktacja zero-jedynkowa: pytanie zalicza się tylko przy wszystkich parach.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Walidacja struktury pytań — dochodzi gałąź „matching”
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
    if coalesce(item->>'type', '') not in ('closed','select','input','matching') then return false; end if;
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
      -- obie strony: same napisy 1–150 znaków, bez duplikatów w obrębie kolumny
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

    else -- input
      if item ? 'options' and jsonb_typeof(item->'options') <> 'null' then return false; end if;
    end if;
  end loop;

  return true;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. create_test — walidacja klucza dla pytań matching
-- -----------------------------------------------------------------------------

create or replace function public.create_test(
  p_title text,
  p_time_limit int,
  p_questions jsonb,
  p_keys jsonb,
  p_pin text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_pin text;
  i int;
  q jsonb;
  k jsonb;
  v text;
  n_same int;
begin
  if auth.role() is distinct from 'authenticated' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_pin := coalesce(nullif(btrim(p_pin), ''), public.random_pin());
  if v_pin !~ '^[0-9]{6}$' then
    raise exception 'invalid_pin' using errcode = '22023';
  end if;

  p_title := btrim(coalesce(p_title, ''));
  if char_length(p_title) not between 1 and 120 then
    raise exception 'invalid_title' using errcode = '22023';
  end if;
  if p_time_limit is null or p_time_limit not between 60 and 7200 then
    raise exception 'invalid_time_limit' using errcode = '22023';
  end if;
  if not public.questions_valid(p_questions) then
    raise exception 'invalid_questions' using errcode = '22023';
  end if;
  if p_keys is null or jsonb_typeof(p_keys) <> 'array'
     or jsonb_array_length(p_keys) <> jsonb_array_length(p_questions) then
    raise exception 'invalid_keys' using errcode = '22023';
  end if;

  for i in 0 .. jsonb_array_length(p_questions) - 1 loop
    q := p_questions -> i;
    k := p_keys -> i;
    if jsonb_typeof(k) <> 'array' then
      raise exception 'invalid_keys' using errcode = '22023';
    end if;

    if q->>'type' = 'matching' then
      -- klucz = wartości `right` w kolejności `left`, czyli permutacja kolumny `right`
      if jsonb_array_length(k) <> jsonb_array_length(q->'left') then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      select count(*) into n_same
      from (select btrim(kv.value) from jsonb_array_elements_text(k) as kv(value)
            except all
            select btrim(rv.value) from jsonb_array_elements_text(q->'right') as rv(value)) d;
      if n_same <> 0 then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 150 then
          raise exception 'invalid_keys' using errcode = '22023';
        end if;
      end loop;
    else
      if jsonb_array_length(k) not between 1 and 10 then
        raise exception 'invalid_keys' using errcode = '22023';
      end if;
      for v in select * from jsonb_array_elements_text(k) loop
        if char_length(btrim(v)) not between 1 and 200 then
          raise exception 'invalid_keys' using errcode = '22023';
        end if;
      end loop;
      if q->>'type' in ('closed','select') then
        if jsonb_array_length(k) <> 1 or not ((q->'options') @> jsonb_build_array(k->>0)) then
          raise exception 'invalid_keys' using errcode = '22023';
        end if;
      end if;
    end if;
  end loop;

  insert into tests (title, time_limit, questions, created_by)
  values (p_title, p_time_limit, p_questions, auth.uid())
  returning id into v_id;

  insert into test_keys (test_id, answers, pin) values (v_id, p_keys, v_pin);

  return jsonb_build_object('id', v_id, 'pin', v_pin);
end;
$$;

revoke all on function public.create_test(text, int, jsonb, jsonb, text) from public, anon;
grant execute on function public.create_test(text, int, jsonb, jsonb, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. submit_attempt — ocena pytań matching (wszystko albo nic)
-- -----------------------------------------------------------------------------

create or replace function public.submit_attempt(p_session_id uuid, p_answers jsonb)
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
  v_given jsonb;
  v_key jsonb;
  v_answer text;
  v_ok boolean;
  v_duration int;
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

  v_total := jsonb_array_length(v_test.questions);
  if p_answers is null or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) > v_total then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;

  for i in 0 .. v_total - 1 loop
    v_given := p_answers -> i;
    v_key := v_keys -> i;

    if (v_test.questions -> i) ->> 'type' = 'matching' then
      -- odpowiedź = tablica wartości `right` w kolejności `left`;
      -- zalicza się tylko komplet poprawnych par
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
    else
      v_answer := case when jsonb_typeof(v_given) = 'string' then left(p_answers ->> i, 500) else null end;
      v_ok := v_answer is not null
        and public.normalize_answer(v_answer) <> ''
        and exists (
          select 1 from jsonb_array_elements_text(v_key) as k
          where public.normalize_answer(k) = public.normalize_answer(v_answer)
        );
    end if;

    if v_ok then v_score := v_score + 1; end if;
    v_results := v_results || to_jsonb(v_ok);
  end loop;

  v_duration := least(greatest(extract(epoch from now() - v_s.started_at)::int, 0), v_test.time_limit);

  insert into attempts (test_id, test_title, student_name, score, total, duration_sec)
  values (v_test.id, v_test.title, v_s.student_name, v_score, v_total, v_duration);

  update test_sessions set submitted_at = now() where id = p_session_id;

  return jsonb_build_object('score', v_score, 'total', v_total, 'results', v_results, 'duration_sec', v_duration);
end;
$$;

revoke all on function public.submit_attempt(uuid, jsonb) from public;
grant execute on function public.submit_attempt(uuid, jsonb) to anon, authenticated;
