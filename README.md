# PixelCargo 0.1 — Faza I

Działająca polskojęzyczna powłoka gry transportowej: deterministyczny zegar, lokalny zapis i interfejs retro. Firma nie jest jeszcze zakładana. Mapa, zlecenia, pojazdy i transporty pozostają niezaimplementowane, zgodnie z zakresem Fazy I.

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
- `src/ui`: zakładki, statusy, ustawienia, placeholder mapy i oś harmonogramu.
- `e2e`: testy faktycznej aplikacji w Chromium, w tym dwóch kart i rozdzielczości desktopowych.

Czas jest liczbą całkowitą milisekund gry od poniedziałku 00:00. Kwoty są w całych groszach, ilości w całych jednostkach. Numer sekwencji komend zapobiega ponownemu naliczeniu, a identyfikatory zdarzeń i powiązanie LedgerEntry.eventId są kontraktem przyszłych jednorazowych rozliczeń. Nie implementujemy teraz ekonomii. RNG Mulberry32 ma jawny stan; zegar nie zużywa losowości. Zapis schematu 1 przyjmuje wyłącznie stan technicznej sesji Fazy I. Rejestr przyszłych migracji jest przygotowany, bez fikcyjnych konwersji.

Grafika i ikony to lokalny CSS/SVG, fonty systemowe obsługują polskie znaki. Brak zewnętrznych grafik, fontów i danych geograficznych. Nazwy etapów 04–18 w roadmapie są roboczym grupowaniem specyfikacji; dalsza implementacja wymaga nowego polecenia.

Dokumentacja: [roadmapa](docs/ROADMAP.md), [stan prac](docs/HANDOFF.md), [zakres Fazy I](docs/PixelCargo_Faza_I_Codex.md), [oryginalna specyfikacja bez zmian](docs/SPEC_0_1_ORIGINAL.txt).
