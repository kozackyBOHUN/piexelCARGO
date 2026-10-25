# PixelCargo 0.1 — Faza II, etap 04B

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

## Mapa 04B

- Przeciągaj mapę lewym przyciskiem myszy. Kursor zmienia się na chwytanie. Przesunięcie większe niż 4 piksele rozpoczyna gest; nie wybiera wtedy miasta. Ograniczenie środka kamery do rzeczywistego obrysu Polski zapobiega zgubieniu kraju.
- Kółko przybliża/oddala pod kursorem; **+** i **−** zmieniają powiększenie względem centrum. Zmiany przyciskami są krótko animowane, a kolejne szybkie kliknięcia sumują się. Preferencja ograniczenia ruchu jest respektowana. Przeciąganie, kółko i reset przerywają animację.
- **Cała Polska** przywraca widok całego kraju i minimalny zoom. **Obszar demo** dopasowuje kadr Małopolski. Maksymalne przybliżenie to około **200 metrów rzeczywistych na piksel CSS w centrum widoku**, z korektą szerokości geograficznej Web Mercator. Gęstość pikseli monitora nie zmienia limitu.
- Wyszukiwarka nad mapą obejmuje **tylko 19 miast demonstracyjnych**. Obsługuje fragmenty nazw, różną wielkość liter i zapis bez polskich znaków (np. `Krakow`, `sacz`, `oswiecim`). Strzałki zmieniają wynik, Enter wybiera, Escape zamyka podpowiedzi. Można też kliknąć wynik.
- Wybór wyniku lub miasta z listy centruje widok, przybliża i podświetla znacznik. Znaczniki obsługują Tab i Enter/Spację. Nakładające się znaczniki otwierają rzeczywistą listę miast do wyboru. Nazwa, województwo i współrzędne pozostają pod mapą; gdy wybrane miasto wypada poza kadr, przycisk **Pokaż miasto** przywraca jego widok.
- Etykiety pojawiają się zależnie od skali i dostępnego miejsca, bez kolizji. Wybrane miasto ma priorytet. Skala odległości w dolnym rogu zmienia się z kamerą i uwzględnia szerokość geograficzną w miejscu belki.
- Po zmianie rozmiaru okna widok ogólny ponownie dopasowuje Polskę, a przybliżony zachowuje środek i powiększenie w granicach dozwolonej skali.

Mapa nadal nie ma dróg, tras, rynku ani danych wszystkich miast Polski. Nie realizowano 04C. Kamera i wybór miasta są stanem interfejsu; format zapisów oraz zegar Fazy I pozostają bez zmian. Błąd wczytania mapy można ponowić bez zatrzymywania symulacji.

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

Grafika i ikony to lokalny CSS/SVG, fonty systemowe obsługują polskie znaki. Geometrie i miasta są commitowanymi plikami lokalnymi, bez zewnętrznych kafelków podczas gry. Granice: PRG/GUGiK według opracowania ppatrzyk/polska-geojson (MIT); miasta: © GeoNames (CC BY 4.0), dystrybucja geonamescache. [Źródła, daty, licencje i odtwarzanie danych](docs/MAP_DATA.md). Kolejny punkt 04C i dalsze wymagają osobnego polecenia.

Dokumentacja: [roadmapa](docs/ROADMAP.md), [stan prac](docs/HANDOFF.md), [zakres Fazy I](docs/PixelCargo_Faza_I_Codex.md), [oryginalna specyfikacja bez zmian](docs/SPEC_0_1_ORIGINAL.txt).
