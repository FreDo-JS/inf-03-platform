-- =============================================================================
-- INF.03 — migracja 005: wykrywanie zmiany karty w trakcie testu
-- Kolejność: schema.sql → 002 → seed.sql → 003 → 004 → 005_tab_switch.sql
--
-- UCZCIWE ZASTRZEŻENIE: Page Visibility API w przeglądarce wykrywa tylko
-- przełączenie karty/okna albo zminimalizowanie TEJ przeglądarki. Nie wykrywa
-- drugiego urządzenia (telefon obok), drugiego monitora ani okna ustawionego
-- w trybie podzielonego ekranu. To sygnał dla nauczyciela, nie ochrona przed
-- ściąganiem — nazwy kolumn i komunikaty mają to odzwierciedlać.
-- =============================================================================

alter table attempts
  add column if not exists tab_switch_count int not null default 0
    check (tab_switch_count >= 0),
  add column if not exists ended_reason text not null default 'completed'
    check (ended_reason in ('completed', 'time_up', 'tab_switch'));

-- -----------------------------------------------------------------------------
-- submit_attempt: dochodzą powód zakończenia i licznik zmian karty.
-- Stara wersja (2 argumenty) jest usuwana, żeby nie powstała nadmiarowa
-- przeciążona funkcja — nowe argumenty mają wartości domyślne, więc wywołanie
-- z dwoma argumentami dalej działa.
-- -----------------------------------------------------------------------------

drop function if exists public.submit_attempt(uuid, jsonb);

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
  v_given jsonb;
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

  insert into attempts (test_id, test_title, student_name, score, total, duration_sec, ended_reason, tab_switch_count)
  values (v_test.id, v_test.title, v_s.student_name, v_score, v_total, v_duration, v_reason, v_switches);

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
