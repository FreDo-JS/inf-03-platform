-- =============================================================================
-- 024_inf04_ai.sql — dział „Sztuczna inteligencja” w mapie INF.04
--
-- Uruchom po 023_inf04_braki.sql.
--
-- Przedmiot 5.9 z programu nauczania (wariant ze sztuczną inteligencją,
-- program powstał z konsultacjami Intela — stąd OpenVINO i NCS2 w treściach).
-- W mapie nie było o nim ani słowa, a prowadzą go **klasy 3a i 4a**.
--
-- Uwaga na zakres: mapa trzyma działy per KWALIFIKACJA, nie per klasa, więc
-- ten dział zobaczy też 4g — klasa, która realizuje drugi wariant (gry).
-- Dla 4g po prostu zostanie nieodhaczony; gdyby miał znikać z jej widoku,
-- trzeba by dołożyć przypisanie działów do klas, a tego dziś w modelu nie ma.
-- Informacja o klasach siedzi w opisie działu, żeby nauczyciel wiedział,
-- kogo dotyczy.
--
-- To wyłącznie dane: kategoria, podtematy i odnośniki.
-- =============================================================================

do $$
begin
  if not exists (select 1 from categories where id = 'inf04-testowanie') then
    raise exception 'Brakuje migracji 011_inf04_seed.sql — uruchom migracje po kolei przed 024.';
  end if;
end $$;

insert into categories (id, position, title, description, qualification) values
  ('inf04-ai', 15, 'Sztuczna inteligencja',
   'Przedmiot specjalizacyjny (klasy 3a i 4a): Python i biblioteki danych, uczenie maszynowe, rozpoznawanie obrazów, NLP i cykl projektowy AI.',
   'inf04')
on conflict (id) do nothing;

insert into subtopics (id, category_id, position, title)
select v.id, 'inf04-ai',
       (select coalesce(max(s.position), 0) from subtopics s where s.category_id = 'inf04-ai') + v.ord,
       v.title
from (values
  ('ai-czym-jest',    1,  'Czym jest sztuczna inteligencja — zastosowania w życiu i w branżach'),
  ('ai-reguly-ml',    2,  'Podejście oparte na regułach a uczenie maszynowe'),
  ('ai-perceptron',   3,  'Perceptron i sieci neuronowe — jak model podejmuje decyzję'),
  ('ai-teachable',    4,  'Teachable Machine — model bez pisania kodu'),
  ('ai-cykl',         5,  'Cykl projektowy AI: problem, dane, model, wdrożenie'),
  ('ai-python',       6,  'Python dla AI: składnia, moduły i pakiety'),
  ('ai-numpy',        7,  'NumPy — tablice i operacje na danych'),
  ('ai-pandas',       8,  'Pandas — ramki danych i wczytywanie plików CSV'),
  ('ai-matplotlib',   9,  'matplotlib — wykresy i wizualizacja danych'),
  ('ai-sklearn',      10, 'scikit-learn — trenowanie modelu klasyfikacji'),
  ('ai-ocena',        11, 'Selekcja cech oraz ocena modelu: precyzja i czułość'),
  ('ai-obrazy',       12, 'Jak komputer widzi obraz — podstawy przetwarzania w OpenCV'),
  ('ai-wizja',        13, 'Klasyfikacja obrazów, wykrywanie obiektów i segmentacja'),
  ('ai-openvino',     14, 'Wnioskowanie na OpenVINO i Intel NCS2'),
  ('ai-nlp',          15, 'Przetwarzanie języka naturalnego (NLP)'),
  ('ai-pulpit',       16, 'Wizualizacja danych i pulpit (Tableau Public)'),
  ('ai-zastosowania', 17, 'Komercyjne zastosowania: rekomendacje, konserwacja predykcyjna, wykrywanie oszustw')
) as v(id, ord, title)
where not exists (select 1 from subtopics s2 where s2.id = v.id);

insert into subtopic_links (subtopic_id, label, url, sort_order)
select v.subtopic_id, v.label, v.url, v.sort_order
from (values
  ('ai-teachable',  'Teachable Machine — Google',                 'https://teachablemachine.withgoogle.com/', 0),
  ('ai-python',     'Python — oficjalny samouczek',               'https://docs.python.org/pl/3/tutorial/', 0),
  ('ai-numpy',      'NumPy — podstawy dla początkujących',        'https://numpy.org/doc/stable/user/absolute_beginners.html', 0),
  ('ai-pandas',     'Pandas — 10 minut wprowadzenia',             'https://pandas.pydata.org/docs/user_guide/10min.html', 0),
  ('ai-matplotlib', 'matplotlib — szybki start',                  'https://matplotlib.org/stable/users/explain/quick_start.html', 0),
  ('ai-sklearn',    'scikit-learn — pierwsze kroki',              'https://scikit-learn.org/stable/getting_started.html', 0),
  ('ai-ocena',      'scikit-learn — precyzja i czułość',          'https://scikit-learn.org/stable/modules/model_evaluation.html', 0),
  ('ai-obrazy',     'OpenCV — samouczki dla Pythona',             'https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html', 0),
  ('ai-openvino',   'OpenVINO — dokumentacja',                    'https://docs.openvino.ai/', 0),
  ('ai-nlp',        'scikit-learn — praca z tekstem',             'https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html', 0),
  ('ai-pulpit',     'Tableau Public — jak zacząć',                'https://www.tableau.com/community/public/how-to', 0)
) as v(subtopic_id, label, url, sort_order)
where exists (select 1 from subtopics s where s.id = v.subtopic_id)
  and not exists (
    select 1 from subtopic_links l where l.subtopic_id = v.subtopic_id and l.url = v.url
  );
