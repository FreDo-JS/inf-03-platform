-- =============================================================================
-- 029_praktyka_cwiczenia.sql — tryb ćwiczeniowy modułu Praktyka
--
-- Uruchom po 028_praktyka_komentarze.sql.
--
-- Uczeń może przerabiać zadania bez PIN-u, bez limitu czasu i bez oceny: pracuje
-- w edytorze, a testy uruchamia sam, we własnej przeglądarce. Nic z tego nie trafia
-- do bazy (wyniki i pliki zostają w przeglądarce ucznia) — to ćwiczenie, nie egzamin.
--
-- Dostęp opiera się na jednej fladze przy zadaniu: practical_tasks.practice.
-- Domyślnie wyłączona, więc po migracji nic nie staje się publiczne. Nauczyciel
-- zaznacza ją świadomie przy zadaniach, które mają służyć do nauki.
--
-- Co zobaczy uczeń: tytuł, arkusz, pliki startowe, KOMPLET definicji testów
-- (żeby przeglądarka mogła je uruchomić — a przy okazji uczeń widzi, czego się
-- od niego wymaga) oraz nazwy i punkty kryteriów ręcznych. NIGDY rozwiązanie
-- wzorcowe (reference_files). Dlatego nie zaznaczaj ćwiczeń przy zadaniu, które
-- ma być jeszcze egzaminem: testy ujawniałyby, co dokładnie sprawdza ocena.
--
-- Tabela practical_tasks pozostaje niedostępna dla ucznia — działa wyłącznie
-- przez dwie funkcje poniżej.
-- =============================================================================

do $$
begin
  if to_regclass('public.practical_tasks') is null then
    raise exception 'Brakuje migracji 006_practical.sql — uruchom migracje po kolei przed 029.';
  end if;
end $$;

alter table practical_tasks add column if not exists practice boolean not null default false;

-- Lista zadań dostępnych do ćwiczeń.
create or replace function public.practical_practice_list()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'summary', t.summary,
    'minutes', t.default_minutes,
    'tests', jsonb_array_length(t.auto_tests),
    'points', coalesce((select sum((x->>'points')::numeric) from jsonb_array_elements(t.auto_tests) x), 0)
  ) order by t.title), '[]'::jsonb)
  from practical_tasks t
  where t.practice and t.is_ready;
$$;

-- Jedno zadanie do ćwiczeń: wszystko, czego potrzebuje przeglądarka ucznia.
create or replace function public.practical_practice_task(p_task_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v practical_tasks%rowtype;
begin
  select * into v from practical_tasks where id = p_task_id and practice and is_ready;
  if not found then
    raise exception 'task_not_found' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'id', v.id,
    'title', v.title,
    'summary', v.summary,
    'content_md', v.content_md,
    'files', v.files,
    'allow_new_files', v.allow_new_files,
    'auto_tests', v.auto_tests,
    'criteria', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', c->>'name',
        'description', c->>'description',
        'points', (c->>'points')::numeric
      )), '[]'::jsonb)
      from jsonb_array_elements(v.manual_criteria) c
    )
  );
end;
$$;

revoke all on function public.practical_practice_list() from public;
revoke all on function public.practical_practice_task(uuid) from public;
grant execute on function public.practical_practice_list() to anon, authenticated;
grant execute on function public.practical_practice_task(uuid) to anon, authenticated;
