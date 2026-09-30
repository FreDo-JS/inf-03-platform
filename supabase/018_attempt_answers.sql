-- =============================================================================
-- 018_attempt_answers.sql — odpowiedzi ucznia zapisane przy wyniku
--
-- Uruchom po 017_praktyka_todo_kalkulator.sql.
--
-- Do tej pory `attempts` trzymało wyłącznie score/total. Nauczyciel widział
-- WIELE uczeń zrobił, ale nie widział CZEGO klasa nie umie: czy 58% średniej
-- bierze się z jednego pytania, które wywaliło wszystkich, czy z równomiernie
-- rozłożonych pomyłek. Dwie nowe kolumny zamykają tę lukę:
--
--   answers  — co uczeń odpowiedział (indeks = indeks pytania)
--   results  — czy dane pytanie zaliczył (to samo, co wraca do przeglądarki)
--
-- Zapisuje je wyłącznie submit_attempt (SECURITY DEFINER). Przez API nikt tu
-- nic nie wstawi: `attempts` nie ma polityki INSERT dla anon, a ocena i tak
-- liczy się po stronie serwera — kolumny są zapisem tego, co policzył serwer,
-- nie danymi przyjętymi na wiarę od przeglądarki.
--
-- Poprawne odpowiedzi NIE trafiają do `attempts` — zostają w `test_keys`,
-- czytelnym tylko dla nauczyciela. Panel zestawia jedno z drugim u siebie.
--
-- Stare podejścia mają w tych kolumnach NULL i taka zostaje ich wartość:
-- danych, których nigdy nie było, nie da się dorobić. Panel mówi wprost,
-- ile podejść nie ma zapisanych odpowiedzi.
-- =============================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'attempts' and column_name = 'tab_switch_count') then
    raise exception 'Brakuje migracji 005_tab_switch.sql — uruchom migracje po kolei przed 018.';
  end if;
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'normalize_answer') then
    raise exception 'Brakuje funkcji normalize_answer z schema.sql — uruchom migracje po kolei przed 018.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Kolumny
-- -----------------------------------------------------------------------------

alter table attempts add column if not exists answers jsonb;
alter table attempts add column if not exists results jsonb;

comment on column attempts.answers is
  'Odpowiedzi ucznia, indeks = indeks pytania. Tekst dla closed/select/input, '
  'tablica dla matching, null dla pytania bez odpowiedzi. NULL w całej kolumnie '
  '= podejście sprzed migracji 018.';
comment on column attempts.results is
  'Wynik per pytanie policzony przez serwer (true/false), indeks = indeks pytania.';

-- Kształt pilnowany CHECK-iem: tyle wpisów, ile pytań. Gdyby kiedyś ktoś
-- zmienił submit_attempt i rozjechał indeksy, analiza pokazywałaby cudze
-- odpowiedzi pod cudzymi pytaniami — lepiej, żeby zapis padł od razu.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attempts_answers_shape') then
    alter table attempts add constraint attempts_answers_shape check (
      answers is null
      or (jsonb_typeof(answers) = 'array'
          and jsonb_array_length(answers) = total
          and length(answers::text) <= 60000)
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'attempts_results_shape') then
    alter table attempts add constraint attempts_results_shape check (
      results is null
      or (jsonb_typeof(results) = 'array' and jsonb_array_length(results) = total)
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. submit_attempt — ta sama ocena, dodatkowo zapis odpowiedzi
-- -----------------------------------------------------------------------------
-- Sygnatura i sposób liczenia punktów bez zmian (wersja z 005). Dochodzi
-- budowanie v_answers w tej samej pętli, w której liczy się wynik.
--
-- Odpowiedzi przycinamy przed zapisem: 500 znaków na pytanie otwarte, 200 na
-- element dopasowania, najwyżej 40 elementów. Gdyby całość i tak przekroczyła
-- limit kolumny, zapisujemy NULL zamiast wywracać oddanie testu — analiza jest
-- dodatkiem, wynik ucznia nie może przez nią przepaść.

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

    if (v_test.questions -> i) ->> 'type' = 'matching' then
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

      if v_given is null or jsonb_typeof(v_given) <> 'array' or jsonb_array_length(v_given) > 40 then
        v_norm := 'null'::jsonb;
      else
        select coalesce(jsonb_agg(left(e, 200) order by ord), '[]'::jsonb)
        into v_norm
        from jsonb_array_elements_text(v_given) with ordinality as t(e, ord);
      end if;
    else
      v_answer := case when jsonb_typeof(v_given) = 'string' then left(p_answers ->> i, 500) else null end;
      v_ok := v_answer is not null
        and public.normalize_answer(v_answer) <> ''
        and exists (
          select 1 from jsonb_array_elements_text(v_key) as k
          where public.normalize_answer(k) = public.normalize_answer(v_answer)
        );
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
