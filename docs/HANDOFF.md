# Stan przekazania PixelCargo — 04C w toku

Ostatni ukończony punkt: **04C-3 — rzeczywiste pokrycie drzewiaste i rzeźba terenu**. Baza 217be676ca434fd2a0d730db01f75a0930294f7a, main. 04C-1 w ed2884a, 04C-2 w 8305417.

Działają wszystkie wcześniejsze funkcje oraz hydrografia Natural Earth, lasy z ESA WorldCover 2021 v200 (klasa 10, uogólnione pokrycie drzewiaste) i wysokości z 56 publicznych kafli Terrarium (zweryfikowane SRTM/GMTED2010/ETOPO1). Wcześniejszy HTTP 403 rozwiązany: oba źródła odpowiadają HTTP 200, dane pobrane. Nie ma obecnie blokady zewnętrznej.

Lokalny produkt: public/landscape/manifest.json i sześć PNG o łącznym rozmiarze około 0,6 MB, trzy LOD, 800 metrów projekcji w bazowej siatce, jedna kamera EPSG:3857. Krajowa siatka 1395×1319, bez deklaracji dokładności 10 m czy kompletnego inwentarza lasów. Źródła, licencje i zakres w docs/MAP_DATA.md oraz public/map-sources.html. Wszystkie 69 kafli zablokowane wersją/ETag/sumami w scripts/landscape-sources.json; generator scripts/prepare-landscape.py uruchomiony inicjalnie i ponownie z lockiem, oba poprawnie. Narzędzia opcjonalne w scripts/requirements-landscape.txt, nie dodano zależności npm.

Renderer został rozszerzony/zmieniony nazwą z HydrographyCanvas na **src/ui/LandscapeCanvas.tsx**. Zachowuje wodę i cache Path2D; rysuje pasma wysokości, rzeczywiste drzewa i wodę na jednym canvas pod SVG, pointer-events:none. src/world/landscape/raster.ts: wspólny loader i obcinanie niewidocznych pikseli (rasterWindow), jeden cache danych/obrazów. Nie zmieniono silnika, IndexedDB, schematu ani danych 04A.

Testy 04C-3: **npm test 63/63**, **typecheck OK**, **build OK**, **E2E 27/27**. Wszystkie istniejące 52/23 wliczone i przechodzą. Nowe testy: prawdziwe źródła/rozmiary/LOD, próbki gór i znanych kompleksów leśnych, crop/reprojekcja, poprawna kolejność i ograniczona liczba SVG oraz awaria/retry rastra bez zatrzymania zegara. Tymczasowe widoki /tmp/pixelcargo-04C3-country.png i /tmp/pixelcargo-04C3-demo.png obejrzane: krajobraz rzeczywisty, miasta czytelne; krajowe drobne plamki lasu i mocne granice wymagają dopracowania w 04C-4.

**Następny krok: 04C-4.** Dopracować krajowy LOD lasów (usunąć drobne wyspy przy oddaleniu, bez zmiany źródłowego położenia), stonować granice, sprawdzić płynność całej mapy, przygotować finalne zrzuty kraj/Małopolska/Kraków/południe dla obu rozdzielczości w docs/screenshots/04C, obejrzeć je. Uaktualnić README i statusy niedostępności, pełne testy + produkcyjny Chromium, commit i push bez force-push. Nie rozpoczynać 05.

Polecenie wznowienia: „Kontynuuj istniejący PixelCargo od 04C-4 zgodnie z docs/PixelCargo_Etap_04C.md. 04C-1..3 działają, źródła są dostępne i przygotowane lokalnie. Nie twórz aplikacji od nowa ani nie regeneruj danych podczas E2E/HMR”.

## Stan bazowy 04B (archiwum)

Punkt startowy 04B: `c525e66cc21e77652adeef9cbc195d45383b964b`. Kontynuowano istniejącą aplikację, bez nowego projektu. Faza I oraz 04A zachowane. **Nie rozpoczęto 04C**, dróg, tras ani kolejnych mechanik. Następny krok wymaga osobnego polecenia użytkownika dotyczącego 04C.

## Wynik 04B

- Przeciąganie myszą, kursory grab/grabbing, próg gestu 4 piksele CSS, pointer capture także po wyjściu kursora poza mapę. Kliknięcie miasta jest oddzielone od przeciągnięcia; zakończenie gestu nie wybiera miasta ani nie blokuje następnego kliknięcia kontrolki.
- Kółko powiększa wokół kursora, z wykładniczą zmianą skali i ograniczeniem pojedynczego skoku; obsługuje deltaMode piksel/linia/strona. Native listener jest niepasywny i zatrzymuje scroll wyłącznie nad mapą. W samych przewijanych nakładkach pozostaje normalne przewijanie.
- Przyciski +/− względem środka: 150 ms interpolacji, szybkie kliknięcia kumulują docelowy zoom. Respektowana preferencja reduced motion. Nowy gest, reset, resize i kółko przerywają animację. requestAnimationFrame jest używany wyłącznie do animacji kamery, nigdy do zegara symulacji.
- Minimalny zoom dopasowuje całą Polskę. Maksymalny to około **200 m rzeczywistych na piksel CSS w centrum widoku**. Metryka sferycznej Web Mercator: cos(szerokość) / scale. Przesunięcie na inną szerokość ponownie kontroluje limit. Brak zależności od devicePixelRatio.
- Ograniczenie przesuwania korzysta z prawdziwego obrysu kraju. Środek poza powierzchnią jest rzutowany na najbliższy odcinek granicy, dzięki czemu nie można zgubić Polski również w narożnikach jej obwiedni. Na minimalnym zoomie kamera wraca do dopasowania kraju. Punkt pod kursorem jest zachowany dokładnie, dopóki nie zadziała ograniczenie nawigacji/zoomu.
- Przyciski Cała Polska i Obszar demo resetują kadr. Resize zachowuje środek i powiększenie przybliżonego widoku w dozwolonych granicach; widok minimalny dopasowuje ponownie kraj.
- Wyszukiwarka nad mapą: fragmenty nazw, wielkość liter, polskie znaki i ASCII (w tym jawne ł→l), pełna lista wyników. Strzałki nawigują, Enter wybiera, Escape zamyka; mysz także działa. Wybór centruje i przybliża miasto (do co najmniej regionalnego widoku 500 m/px, z zachowaniem już bliższego zoomu i limitów), podświetla znacznik i aktualizuje podgląd.
- Katalog nadal obejmuje **tylko 19 miast demo Małopolski**, co widać w UI. Search otrzymuje katalog i województwa z danych, nie ma zakodowanych ręcznie nazw miast ani filtra 19 rekordów. Pełnego katalogu Polski nie dodano.
- Etykiety: daleki widok do 3 nazw, średni do 9, bliski wszystkie mieszczące się bez kolizji. Wybrane miasto jest pierwsze w rozmieszczaniu i renderowane ponad innymi znacznikami. Znaczniki/hitboxy zachowują rozmiar CSS przy dowolnym zoomie. Nakładające się znaczniki pokazują listę rzeczywistych miast do wyboru. Tab i Enter/Spacja wybierają miasto; fokus poza kadrem przywraca jego widok.
- Nazwa, województwo i współrzędne pozostają widoczne pod mapą. Swobodne przesunięcie może wyprowadzić wybrane miasto poza kadr — przycisk Pokaż miasto przywraca je bez zmiany danych.
- Graficzna skala w dolnym rogu jest dynamiczna (1/2/5 × potęga 10, m lub km), uwzględnia szerokość przy samej belce, a nie tylko projekcyjne metry. Zachowano grafitowy styl pixel art.

## Architektura i ważne pliki

- `src/world/projection.ts`: istniejąca projekcja i dopasowanie plus unproject/worldPoint/viewportCenter, createNavigationLimits, constrainViewport, zoomViewport, panViewport, resizeViewport, focusViewport, groundMetersPerPixel, distanceScale i viewportTransform. Jedno źródło przeliczeń dla wszystkich warstw.
- `src/ui/PolandMap.tsx`: kamera, wybór miasta, gest, krótka animacja i grupa nakładających się miast to lokalny stan UI. Nie są częścią GameState ani zapisu. Geometrie granic pozostają cache’owane w bazowej kamerze; podczas interakcji zmienia się transformacja grupy SVG. Etykiety i znaczniki używają tej samej kamery przez screenPoint. Nowe warstwy dróg/tras/pojazdów w przyszłości muszą dołączyć do tego układu.
- `src/world/labels.ts`: rozmieszczanie z priorytetem wybranego miasta, progami rzeczywistej rozdzielczości i kontrolą kolizji oraz granic widoku.
- `src/world/search.ts`: czysta normalizacja i filtrowanie katalogu. `src/ui/CitySearch.tsx`: combobox/listbox, sterowanie klawiaturą i wybór wyniku; nazwa województwa pobierana z katalogu.
- `src/world/navigation.test.ts`: testy matematyki kamery, granic, metryki Mercator, etykiet i wyszukiwania.
- `e2e/navigation.spec.ts`: interakcje myszy/klawiatury, zoom kotwiczony, przeciąganie, reset, fizyczna skala, DPR 2, resize, nakładanie znaczników i szybkie kolejne kliknięcia.

## Dane i zachowana Faza I / 04A

Git diff względem c525e66 potwierdza brak zmian w **src/core, src/persistence, src/domain, src/world/data, docs/SPEC_0_1_ORIGINAL.txt, package.json i package-lock.json**. Nie zmieniono rzeczywistych współrzędnych, nie dodano nowych zależności ani danych ogólnopolskich.

Nadal są prawdziwe granice Polski i 16 województw, 19 miast demo, rozdzielone warstwy i lokalne zasoby bez zewnętrznych kafelków lub API. Źródła i licencje: PRG/GUGiK według opracowania ppatrzyk/polska-geojson (MIT), miasta © GeoNames (CC BY 4.0) przez geonamescache 3.0.2. Przypięte wersje, sumy, daty i generator z 04A pozostają w docs/MAP_DATA.md. Link do źródeł i licencji w mapie działa.

Centralny GameSession/updateWorld, start poniedziałek 06:00, 1 s = minuta gry, nadrabianie otwartej sesji w tle, RNG i numerowane komendy pozostają bez zmian. IndexedDB pixelcargo-v1 / saves / current, SaveEnvelope schemat 1, ręczny zapis, autosave co 10 s, import/eksport do 2 MB, brak offline progress oraz Web Locks także pozostają bez zmian. Zapisy poprzednich etapów są zgodne. Firma nadal nieutworzona, brak kredytu i ekonomii.

## Weryfikacja końcowa 04B

- `npm test` — **52/52**, w tym 37 istniejących testów i 15 nowych: Web Mercator i szerokość geograficzna, kotwiczenie kursora, min/max zoom, różne szerokości, pan i zachowanie Polski, resize, rzeczywista belka skali, polskie/ASCII wyszukiwanie i etykiety bez kolizji.
- `npm run typecheck` — **OK**, także E2E i konfiguracje narzędzi.
- `npm run build` — **OK**. Osobne niezmienione pliki geograficzne, główny JS około 260 kB / 83 kB gzip, bez ostrzeżenia o dużym module.
- `npm run test:e2e` — **23/23 w Chromium**: wszystkie wcześniejsze 17 testów i 6 nowych scenariuszy nawigacji. Weryfikacja 1366×768 i 1920×1080, a także resize między tymi rozmiarami i **DPR 2**. Przeszły regresje zegara, autosave, importu/eksportu i dwóch kart.
- Build produkcyjny sprawdzony dodatkowo przez Vite preview w Chromium: 16 granic, ASCII wyszukiwanie Oświęcimia, wybór, zoom i skala działają; brak runtime errors.
- Zrzuty obu rozdzielczości obejrzane; brak nachodzenia paneli. Zrzuty robocze /tmp/pixelcargo-04B-1366.png i /tmp/pixelcargo-04B-1920.png są poza wymaganymi plikami aplikacji. Istniejący test 390×844 także przeszedł.
- `git diff --check` — OK. W przebiegu roboczym poprawiono selektor testu wyszukiwarki, który obejmował także opcje istniejącego select; nie wyłączano asercji i nie zmieniano istniejących testów silnika/zapisu.

## Uruchomienie, Git i następny krok

Uruchomienie bez zmian: w /workspace/piexelCARGO `npm ci`, potem `npm run dev`. W tym środowisku cache npm: `--cache /tmp/pixelcargo-npm-cache`, Chromium /usr/bin/chromium. Szczegóły w README.md. Nie regenerować JSON w czasie E2E — HMR mógłby zresetować sesję autosave.

Faza I jest na GitHubie: 430aeab, 93b2e1f, 9020a19, 31f83ac. Etap 04A: c525e66cc21e77652adeef9cbc195d45383b964b. Etap 04B jest zapisywany jako osobny commit na main i wysyłany bez force-push, zgodnie z poleceniem użytkownika; dokładny hash i potwierdzenie GitHub podaje raport końcowy. Przed commitem wykonano fetch: main i origin/main były zgodne, bez nowych zmian zdalnych. Push kodu nie oznacza publikacji witryny.

Brak znanych nierozwiązanych błędów wymaganych funkcji 04B. Nie ma 04C, terenu, dróg, routingu, nowych danych krajowych, rynku, aktywnych pojazdów/kierowców ani ekonomii. Cały etap 04 pozostaje nieukończony do realizacji 04C na osobne polecenie. Web Locks/IndexedDB nadal wymagają nowoczesnej przeglądarki i HTTPS/localhost; nagłe zamknięcie może utracić niezapisany odcinek między autosave, a powrót wczytuje ostatni trwały zapis.

**Następny krok:** po osobnym zleceniu przeczytać bieżący HANDOFF, ROADMAP, MAP_DATA i wymagania 04C; rozwijać istniejący komponent i wspólne warstwy. Nie rozpoczynać 04C samodzielnie.
