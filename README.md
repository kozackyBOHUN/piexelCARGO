# PixelCargo 0.1 — mapa 04C i graf drogowy 05A

Działająca polskojęzyczna powłoka gry transportowej: deterministyczny zegar, lokalny zapis, interfejs retro i rzeczywista mapa Polski z granicami 16 województw. Warstwa miast obejmuje wyłącznie 19 miast demonstracyjnych Małopolski. Mapa zawiera rzeczywiste rzeki i jeziora Natural Earth, pokrycie drzewiaste ESA WorldCover oraz rzeźbę terenu z danych wysokościowych SRTM/GMTED2010/ETOPO1. Etapy 04A–04C są ukończone. Firma, zlecenia, pojazdy, drogi i transporty pozostają niezaimplementowane.

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

Mapa nadal nie ma dróg, tras, rynku ani danych wszystkich miast Polski. 04C dodaje krajobraz z prawdziwych danych, pasma wysokości i lokalne, stopniowo ujawniane warstwy lasów/wód. Kamera i wybór miasta są stanem interfejsu; format zapisów oraz zegar Fazy I pozostają bez zmian. Błąd wczytania mapy można ponowić bez zatrzymywania symulacji.

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

Grafika i ikony to lokalny CSS/SVG, fonty systemowe obsługują polskie znaki. Geometrie i miasta są commitowanymi plikami lokalnymi, bez zewnętrznych kafelków podczas gry. Granice: PRG/GUGiK według opracowania ppatrzyk/polska-geojson (MIT); miasta: © GeoNames (CC BY 4.0), dystrybucja geonamescache. [Źródła, daty, licencje i odtwarzanie danych](docs/MAP_DATA.md). Etap 04C ukończony. Etap 05A–05D został zlecony; 06 i dalsze wymagają osobnego polecenia.

Dokumentacja: [roadmapa](docs/ROADMAP.md), [stan prac](docs/HANDOFF.md), [zakres Fazy I](docs/PixelCargo_Faza_I_Codex.md), [oryginalna specyfikacja bez zmian](docs/SPEC_0_1_ORIGINAL.txt).


## Krajobraz — ukończone 04C

- **04C-1:** kontrola faktycznej aplikacji i zrzuty przed zmianami.
- **04C-2:** Natural Earth 5.1.2 (domena publiczna), 33 obiekty rzeczne i 21 poligonów wód, m.in. Wisła, Odra, Warta, Bug, Narew, San, Dunajec, Pilica.
- **04C-3:** ESA WorldCover 2021 v200 (CC BY 4.0, 13 kafli klasy tree cover) oraz 56 publicznych kafli Terrarium z SRTM/GMTED2010/ETOPO1 (USGS/NOAA). Dane rzeczywiste, bez losowych lasów i gór.
- **04C-4:** spokojniejsza grafitowo-zielona paleta, stonowane granice, hierarchia szczegółów, eliminacja małych plamek lasów przy oddaleniu, końcowe testy, zrzuty produkcyjne i pomiary.

[Galeria ośmiu finalnych zrzutów i porównanie z początkiem](docs/screenshots/04C/README.md) obejmuje Polskę, Małopolskę, Kraków i południowe zbliżenie Tatr/Podhala w 1366×768 i 1920×1080. Każdy finalny obraz faktycznie obejrzano.

Warstwy są lokalne: jeden Canvas pod SVG granic/miast/etykiet, wspólna projekcja i kamera, trzy LOD, cache Path2D/obrazów i culling danych/pikseli. Lasów i wysokości nie zamieniamy na tysiące elementów SVG. Przy przeciąganiu nie wykonujemy reprojekcji źródłowych rastrów. Normalna gra nie wymaga internetu, API, Pythona ani kluczy; tylko npm ci i npm run dev. Python jest opcjonalny do odtwarzania danych, opisany w MAP_DATA.

**Zakres i dokładność:** hydrografia to generalizowany zestaw 1:10m, nie rejestr wszystkich cieków i jezior. Pokrycie drzewiaste nie jest prawnym inwentarzem lasów. Bazowy raster 800 metrów projekcji odpowiada około 460–525 m w Polsce, a dalekie LOD są bardziej uproszczone; nie zachowujemy źródłowej dokładności WorldCover 10 m ani geodezyjnej precyzji wysokości. Małe lasy, doliny i szczyty są uogólnione. Przeglądowe kolory i cieniowanie mają służyć czytelnej mapie gry.

Weryfikacja końcowa: **64/64 Vitest, 27/27 Playwright**, typecheck i build poprawne; wszystkie pierwotne 52/23 testy pozostają i przechodzą. Produkcyjna aplikacja sprawdzona w Chromium. Pomiar bieżącego headless Chromium: Canvas P95 0,5–0,9 ms, jedna warstwa Canvas, 124–133 elementy SVG. To czas funkcji rysującej, nie gwarancja FPS na każdym urządzeniu; pełne pomiary (w tym odosobniona klatka 100 ms w powtórce) zapisano w galerii.

**05A: rzeczywisty regionalny graf OSM.** 537460 węzłów, 565817 odcinków i 1102271 krawędzi skierowanych, 19 miast przypiętych do wzajemnie osiągalnej sieci, sześć wymaganych par sprawdzonych. Baza regionalna ma 40,1 MB gzip; jest udostępniona na ODbL razem z geometrią i źródłowymi tagami. [Dane, polityka dostępu, ograniczenia i regeneracja](docs/ROAD_DATA.md), [pełny zakres 05](docs/PixelCargo_Etap_05.md). 05B–05D nie są ukończone. W interfejsie nadal nie ma warstwy dróg ani planera; przygotowany graf nie jest transportem i nie zmienia zapisu gry.

## Publikacja grywalnego preview

GitHub Pages z feat/preview-gameplay-core, bez merge do main.
Adres po wdrożeniu: https://kozackybohun.github.io/piexelCARGO/?preview=1.
[Instrukcja włączenia Pages i publikacji](docs/GITHUB_PAGES.md).
Build: `npm run build:pages`; produkcyjny test ścieżki repozytorium:
`npx playwright test --config playwright.pages.config.ts`.
Gracz otwiera stronę w przeglądarce Windows; Node.js jest potrzebny tylko do budowania.
