-- =============================================================================
-- 028_praktyka_komentarze.sql — komentarz nauczyciela do każdego kryterium
--
-- Uruchom po 027_praktyka_zadania.sql.
--
-- Nauczyciel może przy kryterium oceniania ręcznego zapisać krótki komentarz
-- (manual_scores[].comment, maks. 300 znaków — pilnuje panel). Uczeń widzi go na
-- stronie wyniku, ale dopiero po publikacji pracy: ta funkcja odpowiada tak samo
-- jak dotąd (te same pola, ten sam wymóg tokenu wyniku), z jednym dodanym polem
-- `comment` w kryteriach.
--
-- Nic poza tą funkcją się nie zmienia: kolumna manual_scores jest swobodnym jsonb,
-- a punkty liczy practical_recalc, który komentarzy nie czyta.
-- =============================================================================

do $$
begin
  if to_regprocedure('public.practical_result(text)') is null then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 028.';
  end if;
end $$;

create or replace function public.practical_result(p_result_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt practical_attempts%rowtype;
  v_task practical_tasks%rowtype;
  v_session practical_sessions%rowtype;
begin
  select * into v_attempt from practical_attempts where result_token = p_result_token;
  if not found then
    raise exception 'result_not_found' using errcode = 'P0002';
  end if;

  select * into v_session from practical_sessions where id = v_attempt.session_id;
  select * into v_task from practical_tasks where id = v_session.task_id;

  if v_attempt.published_at is null then
    return jsonb_build_object(
      'published', false,
      'student_name', v_attempt.student_name,
      'task_title', v_task.title,
      'submitted_at', v_attempt.submitted_at
    );
  end if;

  return jsonb_build_object(
    'published', true,
    'student_name', v_attempt.student_name,
    'task_title', v_task.title,
    'submitted_at', v_attempt.submitted_at,
    'ended_reason', v_attempt.ended_reason,
    'final_percent', v_attempt.final_percent,
    'pass_threshold', v_session.pass_threshold,
    'passed', coalesce(v_attempt.final_percent, 0) >= v_session.pass_threshold,
    'teacher_comment', v_attempt.teacher_comment,
    'files', v_attempt.files,
    -- tylko nazwa, punkty i komunikat — bez parametrów testu
    'tests', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', r->>'id',
        'name', coalesce((select t->>'name' from jsonb_array_elements(v_task.auto_tests) t where t->>'id' = r->>'id'), r->>'id'),
        'passed', coalesce((select (o->>'passed')::boolean from jsonb_array_elements(v_attempt.overrides) o where o->>'id' = r->>'id'), (r->>'passed')::boolean),
        'points', coalesce((select (o->>'points')::numeric from jsonb_array_elements(v_attempt.overrides) o where o->>'id' = r->>'id'), (r->>'points')::numeric),
        'max_points', coalesce((select (t->>'points')::numeric from jsonb_array_elements(v_task.auto_tests) t where t->>'id' = r->>'id'), 0),
        'message', r->>'message'
      ) order by r->>'id'), '[]'::jsonb)
      from jsonb_array_elements(v_attempt.auto_results) r
    ),
    'criteria', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c->>'id',
        'name', c->>'name',
        'description', c->>'description',
        'max_points', (c->>'points')::numeric,
        'points', coalesce((select (m->>'points')::numeric from jsonb_array_elements(v_attempt.manual_scores) m where m->>'id' = c->>'id'), 0),
        'comment', coalesce((select left(m->>'comment', 300) from jsonb_array_elements(v_attempt.manual_scores) m where m->>'id' = c->>'id'), '')
      )), '[]'::jsonb)
      from jsonb_array_elements(v_task.manual_criteria) c
    )
  );
end;
$$;

revoke all on function public.practical_result(text) from public;
grant execute on function public.practical_result(text) to anon, authenticated;
