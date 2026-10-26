# Jedna gra — mapa, czas i harmonogram

Baza: 0222e511156683bb0819b85bb9ba7a8a42cfbfb1. Gałąź docelowa: feat/preview-gameplay-core.

## Czas i zapis

Jedynym zegarem jest GameRuntime.session.time. Istniejący ticker przelicza sekundę rzeczywistą na minutę gry. PreviewSession działa poza widokami React i dokładnie raz przekazuje czas do advancePreview. Nawigacja nie tworzy symulacji. Interwał zapisu nie przesuwa zegara.

Po uzyskaniu blokady aktywnej karty i odczycie IndexedDB serwis jednorazowo ustawia wspólny zegar na czas istniejącego zapisu firmy. Pozostaje klucz localStorage pixelcargo-0.1-preview-v1 i dotychczasowy format; opcjonalne lastTransport przechowuje ostatni zakończony kurs do harmonogramu i pozycji postoju. Starsze zapisy bez niego pozostają obsługiwane. Brak naliczania offline. Akcje zapisują od razu, dodatkowo co sekundę i przy pagehide. RESTART FIRMY czyści firmę i ustawia wspólny czas początkowy. IndexedDB i jego schemat pozostają bez zmian; techniczny import nie cofa czasu firmy.

## Widoki

/ i /?preview=1 otwierają tę samą aplikację. Nawigacja: mapa, baza, flota/parking, rynek, harmonogram. Parametr view zachowuje widok po odświeżeniu. Mapa pozostaje zamontowana przy zmianach widoków, utrzymując kamerę. /?dev=1 jest wyraźnie oznaczoną historyczną diagnostyką.

PolandMap zachowuje granice, krajobraz, wyszukiwarkę i zoom. Gotowa geometria OSM jest rysowana we wspólnej projekcji i kamerze. Pozycja pojazdu wynika z fazy, jej czasu i interpolacji po długości rzeczywistej polilinii; nie powstają zastępcze połączenia miast. Kliknięcie auta pokazuje nazwę, fazę, cel i postęp. Po dostawie pozostaje na końcu geometrii w mieście docelowym.

Harmonogram odczytuje istniejące czasy dojazdu, załadunku, jazdy i rozładunku oraz oczekiwanie po dostawie. Pokazuje początki, końce, długości, postęp i wskaźnik wspólnego czasu. Zerowy dojazd jest uczciwie oznaczony jako zerowy. Brak edycji/przeciągania. Starszy zapis bez historii nie otrzymuje zmyślonych poprzednich czynności.

Ekonomia, ceny, rynek, zużycie paliwa, stawki i naliczanie pensji nie zostały zmienione. Dane i grafy OSM pozostają nietknięte. Historia harmonogramu obejmuje bieżący/ostatni kurs, nie pełny archiwalny planer.

## Weryfikacja

npm run typecheck; npm test; npm run build; npm run build:pages.
Celowane testy: npx playwright test --config playwright.unified.config.ts oraz npx playwright test --config playwright.pages.config.ts.

Scenariusze 1366×768 i 1920×1080 obejmują utworzenie firmy, zakup używanego furgonu, kierowcę, Kraków–Tarnów, pozycję auta podczas jazdy/zoomu/przesuwania, harmonogram, pięć widoków, reload w trasie, dostawę/wypłatę raz, pensję po godzinach i restart. Testy produkcyjne sprawdzają /piexelCARGO/, zasoby, zapis i przejścia. Testy jednostkowe kontrolują również zgodność starego zapisu i jeden zegar.

Publikację nadal obsługuje istniejący workflow Pages. Zielony lokalny build nie jest potwierdzeniem zakończenia zdalnego wdrożenia. Po tym zadaniu nie rozpoczynać dalszych etapów.

Końcowa weryfikacja: TypeScript OK; npm test 86/86 (11 plików); standardowy build i build:pages OK; Playwright unified 33/33 (w tym scenariusze gry w obu rozdzielczościach); produkcyjny Pages 1/1. Brak zmian w danych OSM, trasach, silniku i schemacie IndexedDB.
