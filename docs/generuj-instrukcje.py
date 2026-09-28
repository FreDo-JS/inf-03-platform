# -*- coding: utf-8 -*-
"""Generator instrukcji PDF dla nauczycieli.

Uruchomienie (Windows, czcionki brane z C:/Windows/Fonts):

    pip install reportlab
    python docs/generuj-instrukcje.py

Wynik: docs/Tebby-instrukcja-dla-nauczycieli.pdf

Po zmianach w aplikacji popraw treść tutaj i wygeneruj dokument na nowo —
plik PDF jest w repozytorium, żeby dało się go po prostu wysłać nauczycielom.
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

WY = "C:/Users/User/Desktop/inf03/docs/Tebby-instrukcja-dla-nauczycieli.pdf"

# --- czcionki z polskimi znakami --------------------------------------------
pdfmetrics.registerFont(TTFont("UI", "C:/Windows/Fonts/segoeui.ttf"))
pdfmetrics.registerFont(TTFont("UI-B", "C:/Windows/Fonts/segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("UI-I", "C:/Windows/Fonts/segoeuii.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "C:/Windows/Fonts/consola.ttf"))
pdfmetrics.registerFontFamily("UI", normal="UI", bold="UI-B", italic="UI-I")

AKCENT = colors.HexColor("#0f8a74")
AKCENT2 = colors.HexColor("#0369a1")
TEKST = colors.HexColor("#1b2530")
SZARY = colors.HexColor("#5b6b7a")
LINIA = colors.HexColor("#d8e0e6")
TLO = colors.HexColor("#f4f7f9")

ss = getSampleStyleSheet()


def st(nazwa, **kw):
    bazowe = dict(fontName="UI", fontSize=10.2, leading=15.2, textColor=TEKST, alignment=TA_LEFT)
    bazowe.update(kw)
    return ParagraphStyle(nazwa, parent=ss["Normal"], **bazowe)


S_TYT = st("tyt", fontName="UI-B", fontSize=30, leading=34, textColor=TEKST, spaceAfter=6)
S_PODTYT = st("podtyt", fontSize=13, leading=18, textColor=SZARY, spaceAfter=22)
S_H1 = st("h1", fontName="UI-B", fontSize=17, leading=21, textColor=TEKST, spaceBefore=20, spaceAfter=7)
S_H2 = st("h2", fontName="UI-B", fontSize=12, leading=16, textColor=AKCENT, spaceBefore=13, spaceAfter=4)
S_P = st("p", spaceAfter=7)
S_MALY = st("maly", fontSize=9, leading=13, textColor=SZARY)
S_LI = st("li", spaceAfter=3)
S_KOD = st("kod", fontName="Mono", fontSize=8.8, leading=12.6, textColor=colors.HexColor("#0b3b34"))
S_KOM = st("kom", fontSize=9.8, leading=14, textColor=TEKST)
S_TH = st("th", fontName="UI-B", fontSize=9.2, leading=12.5, textColor=colors.white)
S_TD = st("td", fontSize=9.2, leading=12.8)
S_TD_B = st("tdb", fontName="UI-B", fontSize=9.2, leading=12.8)


def P(t, s=S_P):
    return Paragraph(t, s)


def lista(elementy, styl=S_LI, punktor="•"):
    return ListFlowable(
        [ListItem(Paragraph(e, styl), leftIndent=12) for e in elementy],
        bulletType="bullet",
        start=punktor,
        bulletFontName="UI",
        bulletFontSize=9,
        leftIndent=13,
        bulletOffsetY=-0.5,
        spaceAfter=8,
    )


def kroki(elementy):
    return ListFlowable(
        [ListItem(Paragraph(e, S_LI), leftIndent=14) for e in elementy],
        bulletType="1",
        bulletFontName="UI-B",
        bulletFontSize=9.5,
        leftIndent=16,
        spaceAfter=8,
    )


def tabela(naglowki, wiersze, szerokosci):
    dane = [[Paragraph(h, S_TH) for h in naglowki]]
    for w in wiersze:
        dane.append([Paragraph(w[0], S_TD_B)] + [Paragraph(c, S_TD) for c in w[1:]])
    t = Table(dane, colWidths=szerokosci, repeatRows=1, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), AKCENT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TLO]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINIA),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def ramka(tytul, tresc, kolor=AKCENT2):
    wewn = [Paragraph(f"<b>{tytul}</b>", S_KOM), Spacer(1, 3), Paragraph(tresc, S_KOM)]
    t = Table([[wewn]], colWidths=[166 * mm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TLO),
                ("LINEBEFORE", (0, 0), (0, -1), 2.5, kolor),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def kod(tekst):
    t = Table([[Paragraph(tekst, S_KOD)]], colWidths=[166 * mm], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef5f3")),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#bcd6cf")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return t


def stopka(canvas, doc):
    canvas.saveState()
    canvas.setFont("UI", 8)
    canvas.setFillColor(SZARY)
    if doc.page > 1:
        canvas.drawString(22 * mm, 12 * mm, "Tebby — instrukcja dla nauczycieli")
        canvas.drawRightString(188 * mm, 12 * mm, f"str. {doc.page}")
        canvas.setStrokeColor(LINIA)
        canvas.setLineWidth(0.4)
        canvas.line(22 * mm, 16 * mm, 188 * mm, 16 * mm)
    canvas.restoreState()


doc = BaseDocTemplate(
    WY,
    pagesize=A4,
    leftMargin=22 * mm,
    rightMargin=22 * mm,
    topMargin=20 * mm,
    bottomMargin=20 * mm,
    title="Tebby — instrukcja dla nauczycieli",
    author="Zespol INF.03 / INF.04",
    subject="Mapa nauki, testy i egzamin praktyczny",
)
doc.addPageTemplates(
    PageTemplate(
        id="glowny",
        frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")],
        onPage=stopka,
    )
)

h = []

# ============================================================ STRONA TYTUŁOWA
h.append(Spacer(1, 30 * mm))
h.append(P("Tebby", S_TYT))
h.append(P("Mapa nauki, testy i egzamin praktyczny dla INF.03 i INF.04", S_PODTYT))
h.append(
    ramka(
        "Do czego to służy",
        "Jedno miejsce, w którym klasa widzi, co już przerobiliśmy i gdzie znaleźć materiały, "
        "a Ty prowadzisz kartkówki i egzaminy próbne bez zakładania uczniom kont. "
        "Uczeń podaje tylko imię i PIN, który podajesz na lekcji.",
    )
)
h.append(Spacer(1, 8))
h.append(
    tabela(
        ["Kwalifikacja", "Klasy", "Zakres"],
        [
            ["INF.03", "2a, 4e, 4d", "Strony i aplikacje internetowe oraz bazy danych"],
            ["INF.04", "4a, 4g", "Projektowanie, programowanie i testowanie aplikacji (C#, React)"],
        ],
        [30 * mm, 30 * mm, 106 * mm],
    )
)
h.append(Spacer(1, 10))
h.append(P("Co znajdziesz w tym dokumencie", S_H2))
h.append(
    lista(
        [
            "Jak się zalogować i co widać w panelu",
            "Mapa nauki: odhaczanie tematów i materiały dla klasy",
            "Testy: układanie, PIN, przebieg lekcji, wyniki",
            "Egzamin praktyczny: zadania, sesje, sprawdzanie prac",
            "Dziennik zmian, sprzątanie bazy i odpowiedzi na częste pytania",
        ]
    )
)
h.append(Spacer(1, 6))
h.append(
    ramka(
        "Czego aplikacja nie robi",
        "Nie ocenia przez sztuczną inteligencję. Punkty przyznają testy zapisane przez nauczyciela "
        "i Twoja ręczna korekta. Nie zastępuje też dziennika elektronicznego — nie ma ocen, "
        "frekwencji ani danych osobowych uczniów poza imieniem, które sami wpisują.",
        AKCENT,
    )
)

# ============================================================ 1. START
h.append(PageBreak())
h.append(P("1. Pierwsze logowanie", S_H1))
h.append(
    P(
        "Uczniowie nie mają kont — wchodzą na stronę i podają imię oraz PIN. Konta mają tylko nauczyciele. "
        "Zakłada je administrator aplikacji (osoba z dostępem do Supabase)."
    )
)
h.append(P("Jak zacząć", S_H2))
h.append(
    kroki(
        [
            "Dostajesz mejla z zaproszeniem albo adres i hasło tymczasowe od administratora.",
            "Klikasz link z mejla — otworzy się strona <b>Ustaw hasło</b>. Jeśli dostałeś hasło tymczasowe, "
            "zaloguj się nim i wejdź na tę samą stronę pod adresem <b>/admin/haslo</b>.",
            "Ustawiasz własne hasło (co najmniej 10 znaków) i wchodzisz do panelu.",
            "W panelu, u góry po prawej, wpisujesz <b>swój podpis przy tematach</b> — np. „p. Kowalska”. "
            "Pojawi się przy tematach, które odhaczysz.",
        ]
    )
)
h.append(
    ramka(
        "Podpis wpisz od razu",
        "Bez niego przy Twoich oznaczeniach widnieje samo „oznaczone”, bez nazwiska. "
        "Podpis widzą też uczniowie na mapie nauki, więc wpisz taką formę, jaka Ci odpowiada.",
    )
)
h.append(P("Układ aplikacji", S_H2))
h.append(
    P(
        "Po lewej jest stała kolumna z nawigacją, po prawej treść. Uczeń widzi trzy pozycje: "
        "<b>Mapa nauki</b>, <b>Testy</b> i <b>Praktyka</b>. Po zalogowaniu dochodzi <b>Panel</b> "
        "z sekcjami nauczyciela. Na telefonie kolumna chowa się pod przyciskiem w prawym górnym rogu."
    )
)
h.append(Spacer(1, 4))
h.append(
    tabela(
        ["Sekcja panelu", "Do czego służy"],
        [
            ["Postęp klas", "Odhaczanie przerobionych tematów dla wybranej klasy"],
            ["Materiały", "Linki do teorii i zadań przy każdym podtemacie"],
            ["Testy i PIN-y", "Lista testów, podgląd, PIN na rzutnik, zmiana PIN-u, usuwanie"],
            ["Nowy test", "Układanie testu: pytania, odpowiedzi, czas, kwalifikacja"],
            ["Wyniki", "Wyniki podejść uczniów, filtrowanie i kasowanie"],
            ["Zadania praktyczne", "Treść zadania, pliki startowe, testy automatyczne, kryteria"],
            ["Sesje", "Uruchamianie egzaminu dla klasy i podgląd pracy na żywo"],
            ["Prace", "Sprawdzanie oddanych prac, ocena, publikacja, eksport CSV"],
            ["Logi", "Kto, kiedy i w której klasie odhaczył lub cofnął temat"],
        ],
        [42 * mm, 124 * mm],
    )
)

# ============================================================ 2. MAPA NAUKI
h.append(PageBreak())
h.append(P("2. Mapa nauki", S_H1))
h.append(
    P(
        "Mapa to lista kategorii (np. „HTML i CSS”), a w każdej kategorii podtematy. "
        "Uczeń wybiera swoją klasę i widzi, co już przerobiliście, ile zostało oraz materiały do nauki. "
        "Pasek postępu liczy się osobno dla każdej klasy."
    )
)
h.append(P("Odhaczanie tematów", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Postęp klas</b>.",
            "Nad paskiem postępu wybierz klasę (2a, 4e, 4d dla INF.03; 4a, 4g dla INF.04).",
            "Zaznacz pole przy temacie. Zmiana zapisuje się od razu i uczniowie widzą ją bez odświeżania strony.",
        ]
    )
)
h.append(
    P(
        "Przy każdym odhaczonym temacie pojawia się podpis osoby, która to zrobiła. "
        "Jeśli ktoś nie ustawił podpisu, widnieje neutralne „oznaczone”. Odznaczenie też jest zapisywane — "
        "historię znajdziesz w sekcji <b>Logi</b>."
    )
)
h.append(P("Materiały przy podtematach", S_H2))
h.append(
    P(
        "Panel → <b>Materiały</b>. Wybierasz kwalifikację i podtemat, a potem dodajesz dowolną liczbę odnośników: "
        "teoria, ćwiczenia, film, arkusz. Każdy ma etykietę (to ją widzi uczeń), adres i kolejność. "
        "Dozwolone są tylko adresy http i https."
    )
)
h.append(
    ramka(
        "Po co etykiety",
        "Uczeń widzi wyłącznie etykietę, nie adres. Zamiast „freecodecamp.org/learn/…” napisz "
        "„Teoria — pętle” albo „Zadanie na ocenę”. Łatwiej wtedy trafić na to, co potrzebne.",
    )
)

# ============================================================ 3. TESTY
h.append(PageBreak())
h.append(P("3. Testy teoretyczne", S_H1))
h.append(
    P(
        "Test to zestaw pytań z limitem czasu, chroniony sześciocyfrowym PIN-em. "
        "Uczeń nie zakłada konta: podaje imię i PIN, rozwiązuje test na pełnym ekranie, a wynik trafia "
        "wyłącznie do Twojego panelu. Uczeń po zakończeniu widzi swój wynik, ale nie widzi cudzych."
    )
)
h.append(P("Układanie testu", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Nowy test</b>.",
            "Wybierz kwalifikację (INF.03 albo INF.04) — test pokaże się tylko klasom z tej kwalifikacji.",
            "Wpisz tytuł i limit czasu w minutach (od 1 do 120).",
            "Dodawaj pytania. Przy każdym zaznaczasz poprawną odpowiedź — bez niej testu nie zapiszesz.",
            "PIN zostaw pusty, a wylosuje go aplikacja. Możesz też wpisać własny, sześciocyfrowy.",
            "Zapisz. Test od razu widnieje na liście uczniów, ale bez PIN-u nikt go nie otworzy.",
        ]
    )
)
h.append(P("Typy pytań", S_H2))
h.append(
    tabela(
        ["Typ", "Jak wygląda u ucznia", "Kiedy się przydaje"],
        [
            ["Zamknięte", "Lista opcji do klikniecia, jedna poprawna", "Klasyczne pytanie testowe"],
            ["Rozwijane", "Lista rozwijana z opcjami", "Gdy opcji jest dużo i zajmują dużo miejsca"],
            ["Otwarte", "Pole tekstowe", "Pojęcie, nazwa znacznika, wynik działania"],
            ["Dopasowanie par", "Przeciąganie elementów (na telefonie dwa kliknięcia)", "Pojęcie do definicji, metoda do efektu"],
        ],
        [30 * mm, 68 * mm, 68 * mm],
    )
)
h.append(
    ramka(
        "Pytania otwarte — jak są sprawdzane",
        "Aplikacja porównuje odpowiedź z listą wariantów, które podasz. Nie rozróżnia wielkich i małych liter "
        "ani liczby spacji. Warto dopisać kilka form, np. „alt”, „atrybut alt”. Nie ocenia „mniej więcej dobrze” — "
        "albo trafia w wariant, albo nie.",
    )
)
h.append(P("Przebieg lekcji", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Testy i PIN-y</b> → przy wybranym teście kliknij <b>Pokaż PIN klasie</b>. "
            "Na rzutniku pojawi się adres strony i wielkie cyfry PIN-u.",
            "Uczniowie wchodzą na <b>Testy</b>, wybierają test, wpisują PIN i swoje imię.",
            "Test otwiera się na pełnym ekranie i rusza zegar.",
            "Wyniki spływają na bieżąco do sekcji <b>Wyniki</b>.",
        ]
    )
)
h.append(
    P(
        "Po lekcji możesz zmienić PIN przyciskiem <b>Nowy PIN</b> — stary przestaje działać. "
        "Przydaje się, gdy ten sam test piszą kolejne grupy.",
        S_P,
    )
)

# ============================================================ 4. NADZOR
h.append(PageBreak())
h.append(P("4. Uczciwość podczas testu", S_H1))
h.append(
    P(
        "Aplikacja utrudnia ściąganie i zapisuje sygnały, ale <b>nie jest blokadą nie do przejścia</b>. "
        "Traktuj ją jak pomoc, nie jak dowód. Uczeń z drugim urządzeniem zawsze będzie poza jej zasięgiem."
    )
)
h.append(
    tabela(
        ["Mechanizm", "Co robi"],
        [
            ["Pełny ekran", "Test i egzamin uruchamiają się na pełnym ekranie; wyjście jest rejestrowane"],
            ["Zmiana karty lub okna", "Pierwsze przewinienie to ostrzeżenie, drugie kończy podejście i zapisuje pracę"],
            ["Jedna karta", "Otwarcie testu w drugiej karcie tej samej przeglądarki zostaje zablokowane"],
            ["Zegar z serwera", "Czas liczy serwer — przestawienie zegara w komputerze nic nie daje"],
            ["PIN z limitem prób", "Po serii błędnych prób z tego samego adresu aplikacja chwilowo blokuje wpisywanie"],
            ["Losowa kolejność pytań", "Każdy uczeń dostaje pytania w innej kolejności; nie można wrócić do poprzedniego"],
        ],
        [44 * mm, 122 * mm],
    )
)
h.append(Spacer(1, 6))
h.append(
    P(
        "W sekcji <b>Wyniki</b> przy każdym podejściu widać, jak się zakończyło: „ukończony”, „koniec czasu” "
        "albo „zmiana karty”, oraz licznik przewinień. To sygnał do rozmowy, nie automatyczna kara — "
        "przypadkowe kliknięcie w powiadomienie też się liczy."
    )
)

# ============================================================ 5. PRAKTYKA
h.append(PageBreak())
h.append(P("5. Egzamin praktyczny", S_H1))
h.append(
    P(
        "Symulator części praktycznej: uczeń dostaje arkusz z zadaniem, edytor kodu i podgląd strony na żywo — "
        "wszystko w przeglądarce, bez instalowania czegokolwiek. Praca zapisuje się sama."
    )
)
h.append(
    ramka(
        "Zakres: HTML, CSS i JavaScript",
        "Moduł uruchamia stronę w przeglądarce, więc nadaje się do INF.03 i do webowej części INF.04. "
        "Nie uruchomi aplikacji konsolowej w C# ani projektu wymagającego kompilacji.",
        AKCENT,
    )
)
h.append(P("Przygotowanie zadania", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Zadania praktyczne</b> → nowe zadanie.",
            "Wpisz treść arkusza, dodaj pliki startowe (np. pusty index.html i styl.css) i czas (domyślnie 150 minut).",
            "Dodaj <b>testy automatyczne</b> — np. „strona ma nagłówek h1”, „tabela ma 4 wiersze”. "
            "Każdy test ma punkty i sprawdza się sam.",
            "Dodaj <b>kryteria ręczne</b> — to, co oceniasz wzrokiem, np. estetyka układu.",
            "Zaznacz zadanie jako gotowe. Dopóki nie jest gotowe, nie da się na nim uruchomić sesji.",
        ]
    )
)
h.append(P("Przeprowadzenie egzaminu", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Sesje</b> → wybierz zadanie, klasę, czas i próg zaliczenia (domyślnie 75%).",
            "Sesja dostaje PIN. Pokaż go klasie przyciskiem <b>Pokaż PIN klasie</b>.",
            "Uczniowie wchodzą na <b>Praktyka</b>, podają PIN i imię, i czekają w poczekalni.",
            "Kliknij <b>Rozpocznij</b> — zegar rusza jednocześnie dla całej klasy.",
            "W tabeli sesji widzisz na żywo: kto dołączył, kiedy ostatnio zapisał pracę, ile razy zmienił kartę i kto już oddał.",
        ]
    )
)
h.append(P("Sprawdzanie prac", S_H2))
h.append(
    kroki(
        [
            "Panel → <b>Prace</b> → wybierz sesję i otwórz pracę ucznia.",
            "Zobaczysz pliki i działającą stronę. Kliknij <b>Sprawdź</b> — testy automatyczne policzą punkty.",
            "Możesz skorygować wynik testu (wymagane uzasadnienie; oryginalny wynik zostaje zapisany) "
            "i przyznać punkty za kryteria ręczne.",
            "Dodaj komentarz i <b>opublikuj</b> wynik. Można też opublikować wszystkie ocenione naraz.",
            "Całość wyeksportujesz do pliku CSV — otworzysz go w Excelu.",
        ]
    )
)
h.append(
    ramka(
        "Uczeń nie dostaje linku do wyniku",
        "Po oddaniu pracy ekran wraca do wpisywania PIN-u, żeby przy tym komputerze mógł usiąść kolejny uczeń. "
        "Wynik ogłaszasz sam; w zakładce Prace jest przycisk kopiujący link do wyniku, gdybyś chciał komuś go przesłać.",
    )
)

# ============================================================ 6. WYNIKI I LOGI
h.append(PageBreak())
h.append(P("6. Wyniki, logi i porządki", S_H1))
h.append(P("Wyniki testów", S_H2))
h.append(
    P(
        "Sekcja <b>Wyniki</b> pokazuje wszystkie podejścia: imię, test, wynik, czas, sposób zakończenia i datę. "
        "Pole filtra zawęża listę po imieniu lub nazwie testu."
    )
)
h.append(
    P(
        "Każdy wpis możesz usunąć koszem. Przycisk <b>Usuń widoczne</b> kasuje dokładnie to, co zostało po filtrze — "
        "czyli najpierw zawęź listę (np. wpisz nazwę kartkówki), a potem usuń. W potwierdzeniu zobaczysz liczbę wpisów. "
        "Usunięcia nie da się cofnąć."
    )
)
h.append(P("Dziennik zmian", S_H2))
h.append(
    P(
        "Sekcja <b>Logi</b> odpowiada na pytanie „kto to odhaczył”. Dla każdego wpisu: data, klasa, temat, "
        "czy zaznaczono czy odznaczono i kto to zrobił. Historia zostaje nawet wtedy, gdy ktoś cofnie oznaczenie. "
        "Dziennik widzą wyłącznie nauczyciele. Starsze wpisy możesz wyczyścić jednym przyciskiem."
    )
)
h.append(P("Co warto robić regularnie", S_H2))
h.append(
    lista(
        [
            "Po serii kartkówek usuń stare wyniki — filtr plus „Usuń widoczne”.",
            "Po zakończonym egzaminie wyeksportuj prace do CSV, zanim posprzątasz sesję.",
            "Przed każdą lekcją zmień PIN testu, jeśli ten sam test pisze kolejna grupa.",
            "Raz na semestr przejrzyj materiały — linki lubią wygasać.",
        ]
    )
)

# ============================================================ 7. FAQ
h.append(PageBreak())
h.append(P("7. Częste pytania i kłopoty", S_H1))

faq = [
    (
        "Uczeń nie może wejść na test — ciągle prosi o PIN",
        "Sprawdź, czy podajesz PIN tego testu, który kliknął. Po kilku błędnych próbach aplikacja chwilowo blokuje "
        "wpisywanie z tego samego łącza — w szkole cała pracownia ma zwykle jeden adres, więc limit jest wysoki, "
        "ale przy masowych pomyłkach da się go dotknąć. Odczekajcie chwilę albo nadaj nowy PIN.",
    ),
    (
        "Test zakończył się sam po zmianie karty",
        "Tak działa nadzór: pierwsze wyjście to ostrzeżenie, drugie kończy podejście. Praca zostaje zapisana z adnotacją "
        "„zmiana karty”. Jeśli to była pomyłka, usuń wynik i pozwól napisać jeszcze raz.",
    ),
    (
        "Zegar pokazuje dziwną wartość albo stoi",
        "Czas liczy serwer, a aplikacja co jakiś czas go dopytuje. Jeśli zegar stoi, uczeń najpewniej stracił połączenie "
        "z internetem — po jego powrocie czas się wyrówna.",
    ),
    (
        "Nie widzę swojego nazwiska przy odhaczonych tematach",
        "Wpisz podpis w panelu, u góry po prawej („Twój podpis przy tematach”), i zapisz. "
        "Tematy odhaczone wcześniej pozostaną bez nazwiska.",
    ),
    (
        "Nowy nauczyciel nie widzi panelu",
        "Samo konto nie wystarcza — administrator musi dodać adres do listy uprawnionych. To jedna komenda w bazie; "
        "poproś osobę, która zakładała aplikację.",
    ),
    (
        "Uczeń zamknął przeglądarkę w trakcie egzaminu praktycznego",
        "Praca zapisuje się sama co kilkadziesiąt sekund. Po ponownym wejściu na Praktyka i podaniu PIN-u wraca do swojej "
        "pracy na tym samym komputerze i w tej samej przeglądarce.",
    ),
    (
        "Czy uczniowie widzą wyniki innych?",
        "Nie. Uczeń widzi wyłącznie swój wynik zaraz po teście. Pełna lista jest tylko w panelu nauczyciela.",
    ),
    (
        "Czy aplikacja działa na telefonie?",
        "Mapa nauki i testy — tak. Egzamin praktyczny wymaga klawiatury i większego ekranu, więc przewidziany jest "
        "na komputer w pracowni.",
    ),
]
for pytanie, odpowiedz in faq:
    h.append(KeepTogether([P(pytanie, S_H2), P(odpowiedz, S_P)]))

h.append(Spacer(1, 10))
h.append(
    ramka(
        "Masz pomysł albo coś nie działa?",
        "Zapisz, co dokładnie zrobiłeś i co się stało (najlepiej ze zrzutem ekranu), i przekaż osobie opiekującej się "
        "aplikacją. Większość usterek da się poprawić w kilkanaście minut, jeśli wiadomo, jak je powtórzyć.",
        AKCENT,
    )
)

# ============================================================ SCIAGA
h.append(PageBreak())
h.append(P("Ściąga — najczęstsze czynności", S_H1))
h.append(
    tabela(
        ["Chcę…", "Gdzie kliknąć"],
        [
            ["odhaczyć przerobiony temat", "Panel → Postęp klas → wybierz klasę → zaznacz pole"],
            ["dodać link do materiałów", "Panel → Materiały → wybierz podtemat → Dodaj"],
            ["ułożyć kartkówkę", "Panel → Nowy test → pytania → Zapisz"],
            ["pokazać PIN klasie", "Panel → Testy i PIN-y → Pokaż PIN klasie"],
            ["zmienić PIN przed kolejną grupą", "Panel → Testy i PIN-y → Nowy PIN"],
            ["zobaczyć wyniki kartkówki", "Panel → Wyniki → filtr z nazwą testu"],
            ["usunąć stare wyniki", "Panel → Wyniki → zawęź filtrem → Usuń widoczne"],
            ["przeprowadzić egzamin próbny", "Panel → Sesje → utwórz sesję → Pokaż PIN → Rozpocznij"],
            ["sprawdzić oddane prace", "Panel → Prace → wybierz sesję → Otwórz pracę → Sprawdź"],
            ["wyeksportować wyniki egzaminu", "Panel → Prace → Eksport CSV"],
            ["sprawdzić, kto odhaczył temat", "Panel → Logi"],
            ["zmienić swoje hasło", "adres /admin/haslo (działa też po zalogowaniu)"],
        ],
        [58 * mm, 108 * mm],
    )
)
h.append(Spacer(1, 12))
h.append(
    P(
        "Dokument opisuje stan aplikacji na dzień jej przekazania. Jeśli coś wygląda inaczej niż tutaj, "
        "aplikacja jest nowsza od instrukcji — pytaj opiekuna aplikacji.",
        S_MALY,
    )
)

doc.build(h)
print("zapisano:", WY)
