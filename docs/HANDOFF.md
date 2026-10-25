# Stan przekazania PixelCargo

Ostatni w pełni ukończony punkt: **Faza II, etap 04A — podstawowa mapa Polski**.
Faza I (01 → 02A → 02B → 03) pozostaje ukończona. Nie rozpoczęto 04B, 04C ani wyznaczania tras. Następny krok: otrzymać osobny zakres 04B od użytkownika i kontynuować istniejące moduły, bez tworzenia aplikacji od nowa.

## Etap 04A — wynik

- Placeholder zastąpiono rzeczywistą wektorową mapą Polski i wszystkich 16 województw. Źródło granic: PRG/GUGiK według opracowania ppatrzyk/polska-geojson na licencji MIT. Granica państwa to geometryczna suma województw z tego samego źródła.
- Warstwa demonstracyjna: **19 rzeczywistych miast Małopolski** z GeoNames/cities500, dystrybucja geonamescache 3.0.2. Dane GeoNames: CC BY 4.0; pakiet: MIT. Nazwy, współrzędne i geonameid pochodzą ze źródła, nie z ręcznego rozmieszczenia.
- Źródła, przypięte wersje, sumy SHA-256, daty pobrania i instrukcja regeneracji: **docs/MAP_DATA.md**. Kopie licencji w public/licenses. W aplikacji działający link „Źródła i licencje” prowadzi do public/map-sources.html. Źródła nie podają daty stanu administracyjnego / pojedynczych rekordów; nie deklarujemy aktualnego urzędowego PRG ani ludności spisowej.
- Dane są lokalne i commitowane. Przeglądarka pobiera JSON z własnego originu, bez kafelków zewnętrznych, API i kluczy. Główny bundle JS ok. 251 kB (ok. 80 kB gzip); dane granic to oddzielne zasoby, nie gigantyczny moduł JS. Wspólna obietnica loadera zapobiega ponownemu pobieraniu przy renderach. Błąd danych daje polski komunikat i przycisk ponowienia, bez zatrzymywania zegara.
- Stałe kadry: Polska i obszar demonstracyjny. To podstawowy przegląd danych 04A; brak swobodnego pan/zoom, wyszukiwania, dróg i routingu. Kliknięcie lub wybór miasta z listy pokazuje tylko nazwę, województwo i rzeczywiste współrzędne. Znaczniki obsługują klawiaturę. Nie otwierają fikcyjnych ofert.
- Grafitowy styl, pikselowe kwadratowe znaczniki, wyróżnienie Małopolski, oddzielne obrysy państwa i województw. W krajowym kadrze etykiety miast są ukryte; w demo są rozmieszczane bez kolizji. Pełna lista 19 miast jest zawsze dostępna. UI wyraźnie mówi, że to demo, a nie komplet miast Polski.
- AGENTS.md zaktualizowany do autoryzowanego zakresu 04A. ROADMAP ma ukończone 04A, a cały etap 04 oraz 04B/04C pozostają nieukończone. Specyfikacja źródłowa bez zmian.

## Architektura / ważne API

- `src/world/geography.ts`: WGS84 w kolejności [długość, szerokość], typy BoundaryGeometry, BoundaryFeature, MapCity, GeographyDataset. Województwa: PL- + dwucyfrowy kod TERYT. Miasta: geonames: + identyfikator źródła.
- `src/world/data/*.json`: geometrie i 19 miast. `data.ts` udostępnia katalog synchroniczny do testów; `loader.ts` ładuje te same dane jako statyczne zasoby aplikacji.
- `src/world/projection.ts`: projekcja Web Mercator EPSG:3857 z osią Y SVG skierowaną w dół, obwiednie, proporcjonalne dopasowanie do kontenera, `screenPoint` / `geometryPath`. Wspólne współrzędne dla przyszłych warstw dróg, pojazdów i tras.
- `src/world/labels.ts`: deterministyczne etykiety w pikselach CSS, bez nakładania tekstów i znaczników.
- `src/ui/PolandMap.tsx`: osobny memoizowany komponent, ResizeObserver, oddzielne grupy SVG: voivodeships, country, cities, city-labels. Stan prezentacji mapy nie jest stanem symulacji ani częścią zapisu gry. Rozszerzać grupy i dane, nie tworzyć osobnego zegara lub drugiej mapy.
- `scripts/prepare-map.py`: opcjonalny generator danych z kontrolą SHA-256, naprawą topologii przez Shapely.make_valid, sumą województw i kontrolą położenia miast. Nie jest wymagany do zwykłego uruchomienia. Przypięte narzędzia w scripts/requirements-map.txt. Źródłowy uproszczony GeoJSON zawierał 10 niepoprawnych geometrii; naprawa i zmiany są jawnie opisane w docs/MAP_DATA.md.

## Zachowana Faza I

`src/core` i `src/persistence` pozostają niezmienione w 04A, potwierdzone przez Git diff i testy regresji. Nadal działa centralny GameSession i czysty updateWorld, start poniedziałek 06:00, 1 sekunda realna = minuta gry, nadrabianie tła otwartej sesji, RNG Mulberry32 z jawnym stanem oraz numerowane komendy. Brak firmy i kredytu.

IndexedDB pixelcargo-v1 / saves / current, SaveEnvelope schemat 1, zapis/import serializowane, ręczny zapis, autosave co 10 s, eksport/import do 2 MB, brak postępu offline i wyłączna własność Web Locks. Druga karta czeka bez ticków i zapisów, potem przejmuje zapis. Nie zmieniono schematu, więc zapisy Fazy I pozostają zgodne. Grosze to liczby całkowite, czas to całkowite milisekundy gry, ilości to całe jednostki.

## Weryfikacja 04A

- `npm test`: **37/37**. W tym 27 istniejących testów oraz 10 testów geograficznych: 16 identyfikatorów, rzeczywisty zasięg Polski, zamknięte i skończone pierścienie WGS84, 19 unikalnych miast wewnątrz Małopolski i znane współrzędne Krakowa/Tarnowa, kierunki i punkt zerowy projekcji, dopasowanie do 3 rozmiarów, stabilne etykiety bez kolizji.
- `npm run typecheck`: **OK**, także dla E2E i konfiguracji narzędzi.
- `npm run build`: **OK**, bez ostrzeżenia o dużym module JS po wydzieleniu JSON jako zasobów.
- `npm run test:e2e`: końcowo **17/17 w Chromium**. Wszystkie regresje Fazy I plus faktyczne warstwy 16/19, dwa kadry, wybór miasta myszą/listą/klawiaturą, brak żądań do serwisów map zewnętrznych, licencje oraz błąd danych mapy i ponowienie bez zatrzymania zegara.
- Układ 1366×768 i 1920×1080 sprawdzony testami i wizualnie na zrzutach; test małego ekranu 390×844 także przeszedł. Brak krytycznych błędów konsoli w kontrolowanych scenariuszach. Zrzuty robocze: /tmp/pixelcargo-04A-country-1366.png, /tmp/pixelcargo-04A-demo-1366.png i odpowiedniki 1920, poza wymaganymi plikami aplikacji.
- Build produkcyjny sprawdzony oddzielnie w Chromium przez Vite preview: 16 granic województw, 19 miast, kadr demo i wybór Krakowa działają bez runtime errors.
- Generator uruchomiono ponownie na przypiętym źródle; SHA-256 wszystkich trzech wygenerowanych JSON pozostały identyczne.

Diagnozy z przebiegów roboczych: pierwszy E2E trafił na stary proces Vite z błędem 504 Outdated Optimize Dep po wcześniejszym npm ci; rozwiązanie: restart `npm run dev -- --force`. W następnym przebiegu równoległa regeneracja JSON wywołała HMR, resetując sesję podczas testu autosave. Końcowy pełny zestaw uruchomiono dopiero po zakończeniu regeneracji i zmian plików — 17/17, bez zmiany asercji autosave lub silnika. Nie regenerować danych podczas testów żywej aplikacji.

## Uruchomienie i Git

W istniejącym /workspace/piexelCARGO: `npm ci`, `npm run dev`. W tym środowisku cache npm: `--cache /tmp/pixelcargo-npm-cache`. Systemowy Chromium: /usr/bin/chromium; poza maszyną `npx playwright install chromium` albo CHROMIUM_PATH. Aplikacja nie wymaga Pythona/Shapely — są potrzebne tylko przy regeneracji danych. Szczegóły w README.md i docs/MAP_DATA.md.

Faza I jest na GitHubie: 430aeab (01), 93b2e1f (02A), 9020a19 (02B), 31f83ac (03). Dla 04A przygotowany osobny commit na main i push bez force-push zgodnie z poleceniem użytkownika; ostateczny hash i potwierdzenie zdalnego stanu podaje raport końcowy. Przed commitem 04A wykonano fetch: main i origin/main były zgodne, bez nowych zmian zdalnych. Nie publikowano aplikacji jako witryny; push kodu nie oznacza wdrożenia.

## Ograniczenia i dokładny następny krok

Brak znanych nierozwiązanych błędów wymaganych funkcji 04A. Warstwa miast to jawne demo Małopolski; brak kompletnego krajowego katalogu miast, zweryfikowanej ludności, dróg, tras, pojazdów, firmy i ekonomii. Etap 04 jako całość nie jest ukończony.

Web Locks i IndexedDB nadal wymagają nowoczesnej przeglądarki oraz HTTPS/localhost. Nagłe zamknięcie może utracić niezapisany odcinek między autosave; powrót odtwarza ostatni trwały zapis. Tych zasad nie zmieniono w 04A.

Następny krok po nowym poleceniu: przeczytać aktualny HANDOFF, ROADMAP i MAP_DATA, ustalić dokładny zakres 04B i rozszerzać istniejące kontrakty/warstwy. Nie dodawać samodzielnie 04B/04C, swobodnej nawigacji ani wyznaczania tras.
