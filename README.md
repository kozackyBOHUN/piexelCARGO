# PixelCargo 0.1 — Faza II, etap 04A

Działająca polskojęzyczna powłoka gry transportowej: deterministyczny zegar, lokalny zapis, interfejs retro i rzeczywista mapa Polski z granicami 16 województw. Warstwa miast obejmuje wyłącznie 19 miast demonstracyjnych Małopolski. Firma, zlecenia, pojazdy, drogi i transporty pozostają niezaimplementowane.

## Uruchomienie

Wymagany Node.js 22.12+ (lub 20.19+) i npm. W katalogu istniejącego repozytorium:

```sh
npm ci
npm run dev
```

W środowisku z niezapisywalnym domyślnym cache: `npm ci --cache /tmp/pixelcargo-npm-cache`.

Aplikacja działa bez backendu, kluczy API i dodatkowych usług. IndexedDB i Web Locks wymagają nowoczesnego Chrome/Edge/Firefox oraz HTTPS lub localhost. Zapisy są przypisane do originu przeglądarki (protokół, host, port).

## Obsługa i zapis

- Zakładki przełączaj myszą lub klawiaturą: Tab, strzałki, Home, End. Menu nie zatrzymuje czasu.
- Zegar startuje w poniedziałek o 06:00. Jedna sekunda rzeczywista to jedna minuta gry. Otwarta karta w tle nadrabia czas po wznowieniu.
- Ustawienia: **Zapisz**, **Eksportuj**, **Importuj**. Wynik lub błąd wyświetla się pod przyciskami. Import zastępuje sesję; wcześniej wyeksportuj kopię. Limit pliku: 2 MB.
- Autosave działa co 10 sekund oraz przy ukryciu strony. Powrót wczytuje ostatni trwały zapis, bez naliczania offline. Zamknięcie/awaria może utracić niezapisany odcinek; zapis przy zamknięciu jest best effort.
- Tylko jedna karta może prowadzić sesję. Kolejna czeka bez symulowania i zapisywania. Po zamknięciu właściciela automatycznie przejmuje blokadę i wczytuje zapis. Brak Web Locks lub błąd odczytu blokuje start zamiast ryzykować nadpisanie danych.
- Wyczyszczenie danych witryny usuwa lokalny zapis. Przechowuj eksport poza przeglądarką.

## Mapa 04A

Przyciski **Cała Polska** i **Obszar demo** wybierają dwa stałe kadry. Województwa mają prawdziwe granice, a Małopolskie jest wyróżnione jako obszar demonstracyjny. Kliknij znacznik miasta albo wybierz je z listy, aby zobaczyć nazwę i współrzędne. Znaczniki obsługują Tab i Enter/Spację. Przy małej skali etykiety są ukrywane; pełna lista 19 miast pozostaje dostępna.

Mapa nie ma jeszcze swobodnego przesuwania, zoomu, wyszukiwania, dróg ani tras. Wybór miasta nie uruchamia zleceń. Dane są niezależne od zapisów gry, dlatego format zapisów Fazy I pozostaje zgodny. Błąd wczytania mapy można ponowić bez zatrzymywania zegara.

## Weryfikacja

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Testy E2E używają systemowego `/usr/bin/chromium`, jeśli istnieje. W innym środowisku wykonaj `npx playwright install chromium` lub ustaw `CHROMIUM_PATH` na ścieżkę zainstalowanej przeglądarki. Playwright sam uruchamia Vite, jeżeli serwer nie działa. `npm test` uruchamia wyłącznie Vitest, bez testów Playwright.

## Architektura i założenia

- `src/domain/models.ts`: minimalne kontrakty obecnych i przyszłych modułów.
- `src/core`: konfiguracja, stan, czysta aktualizacja świata i RNG, zegar monotoniczny, centralna sesja oraz koordynator usług.
- `src/persistence`: wersjonowany SaveEnvelope, walidacja importu, IndexedDB i wyłączna blokada przeglądarki.
- `src/world`: rzeczywiste dane geograficzne, loader, projekcja i rozmieszczanie etykiet.
- `src/ui`: zakładki, statusy, ustawienia, wektorowa mapa Polski i oś harmonogramu.
- `e2e`: testy faktycznej aplikacji w Chromium, w tym dwóch kart i rozdzielczości desktopowych.

Czas jest liczbą całkowitą milisekund gry od poniedziałku 00:00. Kwoty są w całych groszach, ilości w całych jednostkach. Numer sekwencji komend zapobiega ponownemu naliczeniu, a identyfikatory zdarzeń i powiązanie LedgerEntry.eventId są kontraktem przyszłych jednorazowych rozliczeń. Nie implementujemy teraz ekonomii. RNG Mulberry32 ma jawny stan; zegar nie zużywa losowości. Zapis schematu 1 przyjmuje wyłącznie stan technicznej sesji Fazy I. Rejestr przyszłych migracji jest przygotowany, bez fikcyjnych konwersji.

Grafika i ikony to lokalny CSS/SVG, fonty systemowe obsługują polskie znaki. Geometrie i miasta są commitowanymi plikami lokalnymi, bez zewnętrznych kafelków podczas gry. Granice: PRG/GUGiK według opracowania ppatrzyk/polska-geojson (MIT); miasta: © GeoNames (CC BY 4.0), dystrybucja geonamescache. [Źródła, daty, licencje i odtwarzanie danych](docs/MAP_DATA.md). Kolejne punkty 04B/04C i dalsze wymagają osobnego polecenia.

Dokumentacja: [roadmapa](docs/ROADMAP.md), [stan prac](docs/HANDOFF.md), [zakres Fazy I](docs/PixelCargo_Faza_I_Codex.md), [oryginalna specyfikacja bez zmian](docs/SPEC_0_1_ORIGINAL.txt).
