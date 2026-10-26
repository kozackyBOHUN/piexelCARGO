# Etap 07 — nawigacja i harmonogram

Baza: 07ca6179a286ddd65ffa290b26d2bfd606781de6. Gałąź docelowa: feat/preview-gameplay-core. Osobny worktree, bez dotykania starych szkiców. Niezatwierdzona integracja PNG nie została zacommitowana ani przeniesiona; pozostaje oddzielnie w pixelcargo-art-integration.

## Układy

MAPA i BAZA są pierwszymi dużymi przyciskami po lewej górnego paska. Otwierają wybrany świat, zwijają zarządzanie i pozostawiają pięć pionowych ikon. Ikona otwiera odpowiednią sekcję i szeroki panel: około 2/3 szerokości obok mapy/bazy 1/3. Aktywna ikona może go zwinąć. Podzakładki są nad panelem, bez powtarzania sekcji w bocznym pasku. Tryb MAPA/BAZA nie zależy od wyboru funkcji. Kliknięcie budynku używa tego samego choose() i otwiera odpowiedni panel. W pełnym harmonogramie kliknięcie ikony lub MAPA/BAZA przywraca niski harmonogram i pokazuje żądany widok zamiast pozostawić zasłonięty panel.

Prawy świat pozostaje zamontowany, nie tworzy nowej symulacji. Jedna firma, jeden GameRuntime/PreviewSession, zachowane czasy, paliwo, pensje, rynek i OSM. Nie zmieniono ani danych drogowych, ani ekonomii i schematu zapisu. Mapa w małym widoku ma nagłówek o automatycznej wysokości: zawinięte przyciski nie nakładają się na pole wyszukiwania.

## Tabela zleceń

Siedem kolumn: skąd, dokąd, towar/ładunek, ilość/masa/m³, wygaśnięcie, cena i PRZYJMIJ. Stały układ szerokości z zawijaniem, bez rozszerzania panelu. Dotychczasowe filtry, geograficzny promień, podświetlanie zatwierdzonej geometrii OSM, rezerwacja i ręczny przydział/rozpoczęcie zachowane. Brak danych o liczbie paczek pozostaje jawnie opisany; nie wymyślono jednostek. Tabele zleceń przy 1366×768 i 1920×1080 nie wymagają przesuwania w poziomie, co sprawdza scrollWidth/clientWidth zarówno tabeli, jak i jej kontenera.

## Harmonogram

Zajmuje całą szerokość roboczą poza paskiem ikon, pod mapą i zarządzaniem. 1 AUTO: 180 px i selektor rzeczywiście posiadanego auta. 5 AUT: do 360 px, z przewijanym kontenerem gotowym na przyszłe wiersze. PEŁNY EKRAN: prawie cały obszar pod paskiem, z rzeczywistą skalą i blokami pustej jazdy, obsługi, jazdy z ładunkiem oraz oczekiwania po dostawie. Nie tworzy fikcyjnych pojazdów — w 0.1 jest tylko jeden.

Uchwyt górnej krawędzi działa myszą i dotykiem przez Pointer Events, a klawisze strzałek góra/dół zmieniają wysokość o 20 px. Wysokość jest ograniczona do dostępnego okna. Ustawienie własne nie jest sztucznie oznaczane jako któryś z presetów. Alerty braku kierowcy, niskiego paliwa i opóźnionych zleceń są osobnym, nieprzewijanym paskiem — pozostają widoczne w najmniejszym trybie i przy filtrowaniu listy. Są informacją UI, nie nową mechaniką.

Preferencje management/schedule/height/observedVehicle są walidowane i zapisywane pod osobnym kluczem localStorage pixelcargo-display-v1; nie dotykają pixelcargo-0.1-preview-v1. Zablokowany/uszkodzony magazyn preferencji ma bezpieczne domyślne wartości. Zmiana rozmiaru okna ogranicza wyświetlaną wysokość bez utraty zapamiętanej preferencji. Tryb świata i podpanel nadal są w URL. Restart firmy zachowuje preferencje interfejsu, czyści dotychczasową firmę zgodnie z istniejącą mechaniką.

Szczegółowy plan jest tylko do odczytu. Zerowy dojazd ma zerowy czas; nie dostaje wymyślonego pomarańczowego odcinka. Oczekiwanie pojawia się z rzeczywistego stanu po dostawie lub znanego postoju. Brak przeciągania czynności, tankowania i odpoczynku na oś. Nie dodano zmęczenia, wielu aut ani żadnego następnego etapu.

## Testy i kontynuacja

Dotychczasowe testy zachowane; zmieniono tylko selektor napisu PRZYJMIJ, zgodnie z nowym wymaganiem. Dodano jednostkowe sprawdzenie izolacji i walidacji preferencji oraz dwa scenariusze przeglądarkowe: wszystkie ikony/duże widoki, szerokość tabel, presety, pełną oś, drag, reload i obserwowany pojazd, powrót z pełnego harmonogramu przez ikonę, kliknięcie budynku, jazdę i dostawę raz oraz widoczność niskiego paliwa w 1 AUTO.

Polecenia: npm run typecheck; npm test; npm run build; npm run build:pages; npx playwright test --config playwright.layout07.config.ts; npx playwright test --config playwright.pages.config.ts. Zrzuty rzeczywistego Chromium: docs/screenshots/07/.

Po commit/push wyłącznie na feat/preview-gameplay-core potwierdzić workflow Pages dla konkretnego SHA, następnie czekać na polecenie. Nie wracać samodzielnie do wstrzymanej integracji PNG i nie rozpoczynać kolejnych etapów.

Końcowa weryfikacja: npm run typecheck OK; npm test 97/97 (14 plików); npm run build i build:pages OK; Playwright layout07 38/38; produkcyjny Pages 1/1 (łącznie 39 scenariuszy). Obie rozdzielczości, powrót z pełnego harmonogramu, drag i klawiatura uchwytu, alert w 1 AUTO oraz pełna dostawa i zapis potwierdzone. Poprawiono wykryte testem nakładanie nagłówka małej mapy na wyszukiwanie. Brak zmian w mechanice i danych, brak integracji PNG.
