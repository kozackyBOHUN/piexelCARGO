# PIXELCARGO 0.1 — FAZA I: FUNDAMENT GRY (ETAPY 01–03)

Jesteś programistą rozwijającym istniejące repozytorium gry przeglądarkowej PixelCargo. Zrealizuj WYŁĄCZNIE Fazę I: fundament techniczny, silnik czasu/zapisu oraz funkcjonalną powłokę interfejsu. To ma być uruchamialny kod, a nie makieta w Figmie, opis projektu ani nowe repozytorium obok starego.

## Zasady nadrzędne — koniecznie przestrzegaj

1. Najpierw sprawdź strukturę repozytorium i aktualny kod. Przeczytaj `AGENTS.md`, `docs/ROADMAP.md`, `docs/HANDOFF.md`, jeżeli istnieją. W `docs/SPEC_0_1_ORIGINAL.txt` wystarczą na tym etapie sekcje 3, 4, 7 i 19. Nie czytaj całej specyfikacji w każdej sesji. Jeżeli plików dokumentacji nie ma, utwórz odpowiedniki.
2. NIGDY nie usuwaj istniejącej gry, nie zastępuj działających części pustym szablonem, nie resetuj Gita i nie buduj drugiej aplikacji. Jeśli repozytorium jest puste, utwórz projekt w nim.
3. Jeśli masz istniejący stos technologiczny, zachowaj go, o ile nie uniemożliwia wykonania zadania. Dla pustego repo wybierz TypeScript + React + Vite, Vitest i czytelny CSS. Unikaj niepotrzebnych bibliotek i backendu.
4. Zrealizuj pracę kolejno w małych punktach kontrolnych: **01 → 02A → 02B → 03**. Po każdym sprawdź testy i build, zapisz postęp w `docs/HANDOFF.md` i wykonaj commit, jeśli repo korzysta z Gita. NIE wykonuj następnego punktu, dopóki poprzedni nie działa.
5. **Jeżeli zbliżasz się do limitu kontekstu, czasu lub narzędzi, zakończ na ostatnim poprawnym punkcie kontrolnym.** Zapisz w `docs/HANDOFF.md`, co konkretnie pozostało. Nie zaczynaj modułu od zera po wznowieniu; następna sesja ma kontynuować ten sam punkt.
6. Nie implementuj mapy Polski, danych miast, sieci drogowej, transportów, rynku ofert, zakupów, kierowców, prawdziwej ekonomii, paliwa ani awarii. To fazy II–V. Możesz przygotować ich modele i jasno podpisane, nieaktywne miejsca w interfejsie.
7. Wszystkie teksty interfejsu mają być po polsku, z prawidłowymi polskimi znakami. Wszystko musi działać na komputerze z myszą i klawiaturą.
8. Nie deklaruj ukończenia etapu bez testów. Nie symuluj działania brakujących funkcji; widoczne puste stany muszą być uczciwie opisane.

## ETAP 01 — Architektura i uruchamialny projekt

- Przygotuj jeden uruchamialny projekt z poleceniami `dev`, `test`, `typecheck`, `build` (dopasuj do istniejącego projektu).
- Rozdziel moduły w logiczny sposób, np. `src/core` (stan, czas, zdarzenia, konfiguracja, RNG), `src/domain` (kontrakty danych), `src/world` (późniejsza geografia), `src/features`, `src/ui`, `src/persistence`. Nie twórz pustych katalogów wyłącznie dla wyglądu; przygotuj punkty rozszerzeń, których realnie potrzebujesz.
- Zdefiniuj bazowe typy/interfejsy: `GameState`, `GameCommand`, `DomainEvent`, `Company`, `Vehicle`, `Driver`, `Job`, `CargoUnit`, `Route`, `TimelineAction`, `LedgerEntry`, `SaveEnvelope`. Brakujących przyszłych szczegółów nie programuj na zapas.
- Przygotuj centralną konfigurację mechanik; kwoty pieniędzy jako liczby całkowite groszy, czas symulacji w jednej konsekwentnej jednostce, ilość towaru jako całe jednostki.
- Utwórz lub uzupełnij: `AGENTS.md` (zasady nieprzepisywania repo), `docs/ROADMAP.md` (etapy 01–18), `docs/HANDOFF.md` (status) i `README.md` (uruchomienie). Zgodność z istniejącą dokumentacją ma pierwszeństwo przed duplikowaniem plików.
- Uruchom pustą jeszcze aplikację i podstawowe testy czystych modeli; nie prezentuj fałszywie kompletnej gry.

**Koniec 01:** działające polecenia dev/test/typecheck/build, jeden projekt, spójne kontrakty, aktualny HANDOFF i commit.

## ETAP 02A — Silnik symulacji

- Zaimplementuj jedno źródło prawdy o stanie gry. Komponenty UI wyświetlają stan i wysyłają komendy, a nie samodzielnie wyliczają czas, pieniądze czy zdarzenia.
- Zegar startuje od **poniedziałku, 06:00**. Przelicznik: **1 sekunda rzeczywista = 1 minuta w grze**; doba gry trwa 24 minuty rzeczywiste. Dzień tygodnia i godzina pochodzą z tego samego licznika.
- Czas ma być niezależny od FPS i liczby renderów. Gdy otwarta karta jest w tle lub zminimalizowana i timery są ograniczane, po wznowieniu nadrobiony zostaje upływ czasu tej samej otwartej sesji. Zapobiegaj podwójnym tickom i ujemnym przeskokom czasu.
- W normalnym UI nie ma pauzy, przyspieszania ani przeskakiwania czasu. Narzędzia kontroli czasu mogą istnieć wyłącznie w testach lub wyraźnie odizolowanym środowisku deweloperskim.
- Dodaj deterministyczny mechanizm komend/zdarzeń i generator losowy z kontrolowanym ziarnem; zaprojektuj go tak, by przyszłe koszty i wypłaty mogły być idempotentne.
- Oddziel funkcję aktualizowania świata od pętli renderowania. Symulacja nie może zależeć od animacji CSS, Reacta ani `requestAnimationFrame`.
- Użyj stanu testowego bez zakładania firmy i bez przyznawania kredytu; uruchomienie firmy nastąpi w etapie 06. Widoczny zegar tej wersji może działać w jawnie opisanej sesji technicznej.

**Testy 02A:** poprawna data startowa, 60 sekund realnych → 60 minut gry, zmiana doby, ograniczenie wywołań timera w tle, brak dublowania naliczania, deterministyczne RNG.

## ETAP 02B — Trwały zapis i bezpieczny powrót

- Dodaj zapisy w IndexedDB, `SaveEnvelope` z numerem wersji schematu, identyfikatorem zapisu, stanem symulacji oraz stanem generatora losowości. Zadbaj o walidację importowanego pliku i jasny błąd dla nieobsługiwanej wersji. Przygotuj mechanizm migracji dla przyszłych formatów bez wymyślania zbędnych migracji.
- Zaimplementuj automatyczny zapis podczas gry, ręczny zapis, eksport zapisu do pliku i import zapisu z pliku. Po etapie 03 użytkownik znajdzie te akcje w Ustawieniach.
- **Brak postępu offline:** po zamknięciu karty lub przeglądarki i ponownym uruchomieniu odtwarzaj dokładnie zapisany czas gry. Daty rzeczywistego zapisu NIE służą do naliczania upływu czasu od ostatniej sesji. Odliczanie wznów dopiero w nowej aktywnej sesji.
- Zaimplementuj ochronę przed jednoczesną symulacją i zapisywaniem tej samej rozgrywki w kilku kartach (np. blokada właściciela zapisu + tryb tylko do odczytu/blokada drugiej karty). Rozwiąż utratę blokady po zamknięciu pierwszej karty. Nie opieraj bezpieczeństwa na samym komunikacie ostrzegawczym.
- Nie zapisuj bez końca przy każdym renderze. Nie dubluj komend ani zdarzeń po odczycie i kolejnych zapisach. Nie używaj lokalnego serwera jako wymaganego backendu.

**Testy 02B:** zapis→odczyt bez różnic, zapis w trakcie działania zegara, ponowne uruchomienie bez offline-progress, odtworzenie RNG, niepoprawny import, dwie równoległe karty/sesje, stabilność autosave.

## ETAP 03 — Główny interfejs PixelCargo

Zbuduj faktycznie działającą, responsywną powłokę desktopową gry, połączoną z silnikiem 02A i zapisem 02B:

- Pasek górny: logo/tytuł **PixelCargo 0.1**, status firmy („nieutworzona”, dopóki nie powstanie etap 06), saldo i dług jako brak danych zamiast zmyślonych kwot, dzień tygodnia, godzina gry, miejsce na alerty oraz czytelny status zapisu.
- Lewa część ok. **1/3** szerokości: zakładki **Zlecenia, Pojazd, Kierowca, Baza, Finanse, Historia zdarzeń, Ustawienia**. Zakładki mają się rzeczywiście przełączać. Przyszłe mechaniki oznacz „Dostępne w kolejnej fazie”.
- Prawa część ok. **2/3** szerokości: stabilny kontener przyszłej interaktywnej mapy. Na tym etapie pokaż uczciwy placeholder „Mapa Polski — etap 04”; nie rysuj udawanych dróg i miast ani nie przedstawiaj grafiki jako funkcjonalnej mapy.
- Pod mapą: miejsce na poziomy harmonogram, z prawidłowym układem osi czasu, ale bez fikcyjnych zadań i kursów: „Harmonogram — etap 09”. Zaprojektuj komponent tak, by w przyszłości mógł prezentować do 3 widocznych wierszy i przewijanie.
- Ustawienia: działające akcje Zapisz, Eksportuj, Importuj i wskazanie wyniku/błędu; zmiana zakładek nie zatrzymuje zegara.
- Konsekwentny styl **pixel art / retro**: grafitowe panele, czytelne obramowania, pikselowe detale przycisków i ikon, spójne odstępy, sensowny kontrast. Żadnych zdjęć, emoji jako docelowych ikon ani przypadkowo wymieszanych stylów. Czcionka ma prawidłowo wyświetlać ą, ć, ę, ł, ń, ó, ś, ź, ż; nie poświęcaj czytelności tabel na rzecz retro.
- Zadbaj o komfort pracy na laptopie 1366×768 oraz monitorze 1920×1080: brak przypadkowego nachodzenia paneli, sensowny scroll i czytelne stany pustych widoków.
- Nie twórz osobnego licznika czasu w UI. Zegar wyświetlany w pasku wynika wyłącznie z centralnego `GameState`.

**Testy 03:** wszystkie zakładki działają, po przełączeniu zegar idzie dalej, zapis i import/eksport mają informację zwrotną, layout jest używalny w dwóch rozdzielczościach, brak błędów krytycznych konsoli.

## Obowiązkowe zakończenie każdego punktu

1. Uruchom testy, typecheck i build; jeżeli dostępny jest test w przeglądarce, uruchom aplikację i sprawdź jej faktyczne zachowanie. Zapisz wykonane komendy i wyniki, a jeśli czegoś nie możesz uruchomić, wyjaśnij dlaczego.
2. Uzupełnij `docs/HANDOFF.md`: ostatni w pełni ukończony punkt (01/02A/02B/03), co działa, co jest rozpoczęte lub zablokowane, ważne pliki i API, wyniki testów, znane błędy oraz dokładny następny krok.
3. Odznacz ukończone punkty w roadmapie. Zrób nieinwazyjny commit, jeśli Git jest dostępny; bez force push, kasowania historii i ignorowania zmian użytkownika.
4. W odpowiedzi końcowej podaj: ukończony punkt, wykonane funkcje, wyniki testów, sposób uruchomienia, blokady i następny punkt. Jeżeli skończyłeś tylko 02A, NIE pisz, że cała Faza I została ukończona.

## Definicja ukończenia całej FAZY I

Faza I jest ukończona wyłącznie wtedy, gdy w jednym istniejącym repozytorium jest uruchamialna aplikacja z prawdziwym silnikiem czasu, deterministycznym stanem, zapisem/odczytem bez naliczania offline, ochroną przed równoległymi kartami i funkcjonalnym polskojęzycznym interfejsem. Zlecenia, mapa i transport są na tym etapie wyraźnie oznaczone jako NIEZAIMPLEMENTOWANE.

**Nie przechodź do Fazy II bez mojego kolejnego polecenia.**
