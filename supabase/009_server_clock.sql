-- =============================================================================
-- INF.03 — migracja 009: zegar po stronie serwera
-- Uruchom po 008_security_hardening.sql. Można uruchomić ponownie.
--
-- Do tej pory przeglądarka odliczała czas sama, na podstawie znacznika startu
-- pobranego raz. Uczeń mógł przestawić zegar systemowy i widzieć więcej czasu
-- (zapis i tak był odrzucany po terminie, ale odliczanie kłamało).
-- Te dwie funkcje są lekkie — klient pyta o czas co kilkanaście sekund
-- i synchronizuje odliczanie z serwerem.
-- =============================================================================

-- --- część teoretyczna (moduł Testy) -----------------------------------------
-- Sesja quizu jest identyfikowana losowym UUID wydanym po podaniu PIN-u.
create or replace function public.quiz_time(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s test_sessions%rowtype;
  v_limit int;
begin
  select * into v_s from test_sessions where id = p_session_id;
  if not found then
    raise exception 'session_invalid' using errcode = '22023';
  end if;

  select time_limit into v_limit from tests where id = v_s.test_id;

  return jsonb_build_object(
    'server_now', now(),
    'started_at', v_s.started_at,
    -- koniec liczony przez serwer; null, dopóki uczeń nie wystartował
    'ends_at', case when v_s.started_at is null or v_limit is null
                    then null
                    else v_s.started_at + make_interval(secs => v_limit) end,
    'submitted', v_s.submitted_at is not null
  );
end;
$$;

revoke all on function public.quiz_time(uuid) from public;
grant execute on function public.quiz_time(uuid) to anon, authenticated;

-- --- część praktyczna ---------------------------------------------------------
-- Lekka wersja practical_state: sam czas i stan, bez przesyłania plików pracy.
create or replace function public.practical_time(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_session practical_sessions%rowtype;
begin
  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token);
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;

  return jsonb_build_object(
    'server_now', now(),
    'ends_at', v_session.ends_at,
    'session_status', v_session.status,
    'attempt_status', v_attempt.status,
    'tab_switch_count', v_attempt.tab_switch_count
  );
end;
$$;

revoke all on function public.practical_time(text) from public;
grant execute on function public.practical_time(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Nowy typ zdarzenia nadzoru: utrata fokusa okna
-- -----------------------------------------------------------------------------
-- Przełączenie się do innego okna (np. drugi monitor, okno obok) nie zawsze
-- ukrywa kartę, więc samo visibilitychange tego nie łapie. Rejestrujemy je
-- osobno, żeby nauczyciel widział, co dokładnie się stało.

alter table practical_events drop constraint if exists practical_events_type_check;
alter table practical_events
  add constraint practical_events_type_check
  check (type in ('join','start','tab_hidden','focus_lost','fullscreen_exit','large_paste','submit','autosave_error'));

create or replace function public.practical_event(p_token text, p_type text, p_details jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_events int;
  v_details jsonb;
begin
  if p_type not in ('start','tab_hidden','focus_lost','fullscreen_exit','large_paste','autosave_error') then
    raise exception 'invalid_event' using errcode = '22023';
  end if;

  -- do dziennika trafiają tylko znane, krótkie pola (bez treści wklejenia)
  v_details := coalesce(p_details, '{}'::jsonb);
  v_details := jsonb_strip_nulls(jsonb_build_object(
    'length', case when jsonb_typeof(v_details->'length') = 'number'
                   then least((v_details->>'length')::numeric, 1000000) else null end,
    'file',   left(nullif(v_details->>'file', ''), 40)
  ));

  select * into v_attempt from practical_attempts
  where attempt_token_hash = public.practical_token_hash(p_token) for update;
  if not found then
    raise exception 'attempt_invalid' using errcode = '22023';
  end if;

  select count(*) into v_events from practical_events where attempt_id = v_attempt.id;
  if v_events >= 500 then
    return jsonb_build_object('ok', true, 'capped', true,
      'tab_switch_count', v_attempt.tab_switch_count, 'large_paste_count', v_attempt.large_paste_count);
  end if;

  insert into practical_events (attempt_id, type, details) values (v_attempt.id, p_type, v_details);

  -- każde opuszczenie pracy liczy się tak samo
  if p_type in ('tab_hidden', 'focus_lost', 'fullscreen_exit') then
    update practical_attempts set tab_switch_count = tab_switch_count + 1
    where id = v_attempt.id returning * into v_attempt;
  elsif p_type = 'large_paste' then
    update practical_attempts set large_paste_count = large_paste_count + 1
    where id = v_attempt.id returning * into v_attempt;
  end if;

  return jsonb_build_object('ok', true,
    'tab_switch_count', v_attempt.tab_switch_count,
    'large_paste_count', v_attempt.large_paste_count,
    'should_end', v_attempt.tab_switch_count >= 2);
end;
$$;
revoke all on function public.practical_event(text, text, jsonb) from public;
grant execute on function public.practical_event(text, text, jsonb) to anon, authenticated;
