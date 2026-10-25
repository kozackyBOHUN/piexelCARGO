# Aktualizacja — rynek zleceń preview

Rozbudowano deterministyczny rynek dziesięciu towarów, trwałe oferty (5 dni), trzy rezerwacje, ręczne rozpoczęcie, terminy 3 dni i jednorazowe kary/wypłaty. Zachowano wspólny zegar, mapę, paliwo, pensje i stare zapisy; brak zmian CSS/grafik/OSM. Szczegóły i jawne ograniczenia puli/danych ludnościowych: docs/FREIGHT_MARKET.md. Baza 15e64015b1322fa96aafd45b06af4add7f30dfb0; gałąź feat/preview-gameplay-core. Po commit/push czekać na polecenie. Nie rozpoczynać dalszych etapów ani ingerować w feat/pixelcargo-art-assets.

---

# Aktualizacja — jedna grywalna aplikacja

Połączono mapę, firmę, bazę, flotę, rynek i prawdziwy harmonogram. Jeden zegar GameRuntime.session.time, obsługiwany przez PreviewSession; stary zapis firmy zostaje zachowany. / oraz /?preview=1 otwierają tę samą grę; diagnostyka tylko /?dev=1. Pojazd porusza się po gotowej geometrii OSM i pozostaje w celu. Bez zmian ekonomii, tras i IndexedDB.

Opis architektury, testów i ograniczeń: docs/UNIFIED_GAME.md. Punkt wznowienia: ukończona integracja na feat/preview-gameplay-core, baza 0222e511156683bb0819b85bb9ba7a8a42cfbfb1. Po commit/push czekać na nowe polecenie; nie rozpoczynać następnych etapów. Publikację potwierdza dopiero udany workflow Pages.

---

# Aktualizacja — przygotowana publikacja GitHub Pages

Gałąź feat/preview-gameplay-core, baza a233b302b597ac46d178b399f42d199956850157.
Workflow .github/workflows/preview-pages.yml buduje i publikuje wyłącznie tę gałąź.
npm run build:pages ustawia /piexelCARGO/; fetch tras i linki UI/licencji obsługują
bazę repozytorium. localStorage i mechanika bez zmian. Nie scalono do main.

Lokalny produkcyjny build i test Playwright pod /piexelCARGO/ przechodzą (1/1):
firma, furgon/kierowca, zapis/reload, trasa, powrót do mapy i licencje, bez 404.
Publiczna publikacja wymaga włączenia Pages → Source: GitHub Actions i zielonego
workflow. Nie podawać URL jako zweryfikowanego przed faktycznym deploy.
Brak narzędzia publicznego podglądu Codexa; proxy blokowało dostęp do GitHub API
oraz domeny Pages (403). Dokładne ostatnie kroki: docs/GITHUB_PAGES.md.
Adres docelowy: https://kozackybohun.github.io/piexelCARGO/?preview=1.
Czekać na nowe polecenie po zakończeniu tej publikacji/raportu.

Poniżej historyczny raport stabilizacji preview.

---

# Preview — stabilizacja zapisu ukończona

Gałąź feat/preview-gameplay-core, baza 1b361852066205a2c7139ec9f1a1ff7ae91e1b0e.
Naprawiono odrzucanie zapisu preview podczas startu (wyścig z odczytem IndexedDB)
i wznowienie czasu przy różnych częstotliwościach zapisu. Firma, saldo, furgon,
kierowca i aktywny przewóz zachowują się po reload; dostawa płaci dokładnie raz.
Poprawka paliwa z bazy potwierdzona, bez zmiany stawek i parametrów.

Typecheck/build OK, unit 79/79, tylko potrzebny Playwright 2/2:
npx playwright test --config playwright.preview.config.ts.
Szczegóły i zakres: docs/PREVIEW_STABILIZATION.md.
Bez zmian tras/grafów/routingu, silnika głównego, schematu IndexedDB i innych etapów.
Praca w osobnym worktree /workspace/pixelcargo-preview-stabilization; stare szkice
w /workspace/piexelCARGO nietknięte. Nie scalono do main. Czekać na nowe polecenie.

Poniżej archiwalny raport 05A, sprzed prac nad grywalnym preview.

---

# Stan przekazania — 05A ukończony

Ostatni ukończony podetap: **05A**, osobny commit w bieżącej historii.
Baza 04C: `0700e01692f3feb70ed42ec855779894cfeccdb1`. Aktualne polecenie
obejmuje 05A → 05B → 05C → 05D; nie rozpoczynać 06.

## Ukończone 05A

- Rzeczywisty graf OSM Małopolski: **537460 węzłów, 332727 ways, 565817
  odcinków, 1102271 krawędzi skierowanych**, 3093 zachowane relacje restrykcji.
- Pełna geometria/tagi, źródłowe IDs, oneway/-1/roundabout/dostęp i bariery,
  maxweight/height/width jako dane. Wspólne IDs łączą drogi; przecięcia geometrii nie.
- Granica do filtrowania: kompletna OSM relation 49715 z krajowego PBF, nie
  uproszczony obrys 04A. Zagraniczne odcinki/gap fragmenty wykluczone, brak
  syntetycznych napraw. Istniejące dane mapy są niezmienione.
- 19 miast przypiętych do najbliższego źródłowego punktu głównej silnie spójnej
  sieci. Pierwsza próba dowolnego najbliższego węzła nie przeszła Kraków–Tarnów;
  poprawiono dobór odpowiedniej sieci bez dodawania odcinków. Luki 0,99–314,78 m,
  największa Kraków, nie stanowią drogi ani przejezdnego dystansu.
- Sześć wskazanych par ma skierowane połączenie. Ponowna generacja sprawdza także
  wzajemną osiągalność wszystkich 19 przypięć. To topologia, jeszcze bez reguł skrętów.
- Baza: public/roads/demo/graph.json.gz **40081233 B**, JSON 140180397 B.
  SHA-256 gzip: e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f.
  Wersja 05A-v1-a0575a3f5bd99f19-98733c38. Manifest zawiera źródła/statystyki/sumy.
- ODbL 1.0, lokalna pełna licencja i opis zmian, bezpośredni dostęp do całej
  pochodnej bazy/maski/manifestu na stronie źródeł. Format/reguły/regeneracja
  w docs/ROAD_DATA.md. Dokładne polecenie w docs/PixelCargo_Etap_05.md.

## Dane i środowisko

Pobrane, oficjalna MD5 i SHA-256 zweryfikowane:
- /tmp/pixelcargo-roads/demo.osm.pbf — 203104424 B, 261024, data OSM 2026-10-24T20:20:51Z;
- /tmp/pixelcargo-roads/poland.osm.pbf — 2112079930 B, 261024, surowe źródło przyszłego 05D;
- /tmp/pixelcargo-roads/poland-border.json — poprawna pełna granica z krajowego PBF.

Locki scripts/roads-{demo,poland}-source.json. Nie commitować PBF. Generator
scripts/prepare-roads.py, ekstraktor extract-road-border.py, pobieranie
fetch-road-source.py, zależności requirements-roads.txt. Python zainstalowany
w /tmp/pixelcargo-road-tools i /tmp/pixelcargo-map-tools; używaj obu w PYTHONPATH
w tej instancji, bo NumPy/Shapely są także w drugim katalogu. Normalna gra i build
nie wymagają Pythona. Pełna instrukcja odtwarzania w ROAD_DATA.

Początkowe HTTP 403 rozwiązane; po dodaniu download.geofabrik.de do szkicu egress
sprawdzono rzeczywiste HTTP 200 i pobrano dane. Sam zapis szkicu nie oznacza
publikacji nowej migawki środowiska. Nie twierdzimy, że sprawdzono nowe zadanie.

## Weryfikacja 05A

- npm test **72/72** (oryginalne 64 + 8 realnego grafu).
- Python narzędzia **15/15**: integralność, odmowy/przerwania, access/directions,
  most bez skrzyżowania, wspólne IDs, SCC i przypięcie.
- typecheck **OK**, build **OK**, Playwright **27/27**; żaden stary test nie usunięty.
- Produkcyjny Chromium otwiera obecną mapę bez pageerror.
- Dwie poprawne generacje: 169,74 s i 162,70 s; gzip grafu oraz maski mają
  identyczne SHA-256. Druga baza w /tmp/pixelcargo-roads/reproduced-demo.
- Bez zmian w src/core, src/persistence, src/domain, oryginalnej specyfikacji,
  trzech katalogowych danych 04A i krajobrazie. Zapis nadal schema 1.

## Co dalej — kontynuować istniejący projekt

**05B następny:** A* najkrótszej dozwolonej drogi po metrach, profil furgonu,
prędkości/tagi, podstawowe no/only turn restrictions (także rozpoznanie/przejrzysty
raport niewspieranych), dystans/czas/geometria/stabilny ID, punkt i orientacja po
przejechanym dystansie. Dijkstra referencyjny na kontrolowanych grafach; realne
sześć tras i testy błędów. Nie traktować hasDirectedConnection jako routingu.

Następnie 05C: wydajny Canvas dróg, planer 19 miast, trasa na tej samej geometrii,
fit, kierunek, opcjonalne powiększenie mapy z ukryciem timeline. Dalej 05D: pełny
krajowy graf (sam pobrany PBF NIE oznacza ukończenia), compact/chunks/indeks,
Worker, pomiary i siedem par krajowych. Regionalny JSON 140 MB wymaga rozdzielenia
geometrii/topologii przed skalowaniem. Nie ładować go synchronicznie do głównego UI.

W interfejsie nadal **nie ma dróg ani planera**, nie ma wyliczonych dystansów/czasów
tras, zrzutów 05 ani krajowego grafu. 05B–05D nieukończone. Nie dodano pojazdów,
transportów, ekonomii, nowych miast ani zmian zapisu. Każdy następny ukończony
podetap zakończyć testami, HANDOFF/ROADMAP, osobnym commitem i push bez force-push.

---

# Archiwalny raport 04C — stan przed poleceniem 05

# Stan przekazania PixelCargo — 04C ukończony

Ostatni w pełni ukończony etap: **Faza II / 04C**, wszystkie podetapy **04C-1 → 04C-2 → 04C-3 → 04C-4**. Rozwinięto istniejącą aplikację z bazy `217be676ca434fd2a0d730db01f75a0930294f7a`, bez tworzenia projektu od nowa. **Etap 05 nie jest rozpoczęty i wymaga osobnego polecenia.**

## Punkty kontrolne

- **04C-1**, `ed2884a`: odczytano dokumentację i sekcje 3–5/19 specyfikacji, zaktualizowano AGENTS, zachowano pełne polecenie w docs/PixelCargo_Etap_04C.md, uruchomiono Chromium i zapisano/obejrzano cztery zrzuty bazowe. Testy 52/52, typecheck/build OK.
- **04C-2**, `8305417`: rzeczywista lokalna hydrografia Natural Earth 5.1.2, 33 obiekty rzeczne i 21 poligonów jezior/zbiorników, w tym wszystkie osiem wymaganych rzek. Trzy LOD, cache Path2D i indeks siatki do cullingu, jeden Canvas pod istniejącym SVG. Naprawiono zasłonięcie przycisku retry oraz istniejący błąd 404 favicony bez wyłączania asercji. Testy 58/58, E2E 25/25, typecheck/build i produkcyjny Chromium OK.
- **04C-3**, `92bbca5`: prawdziwe pokrycie drzewiaste ESA WorldCover 2021 v200 (13 kafli, CC BY 4.0) i uogólniona rzeźba z 56 kafli Terrarium (SRTM/GMTED2010/ETOPO1, USGS/NOAA, domena publiczna). Reprojekcja do wspólnej EPSG:3857, trzy lokalne rastry terenu/lasów, źródła zablokowane ETag/SHA-256. Rozszerzono i przemianowano HydrographyCanvas na LandscapeCanvas. Testy 63/63, E2E 27/27, typecheck/build OK.
- **04C-4**, osobny końcowy commit w historii: filtrowanie drobnych wysp lasu w oddalonych LOD, spokojniejsze obrysy granic, końcowa kontrola wizualna wszystkich ośmiu widoków, pomiary, testy, README/MAP_DATA/HANDOFF/ROADMAP i push bez force-push zgodnie z poleceniem. Dokładny końcowy hash i synchronizację podaje raport po wykonaniu push.

## Co działa

Kolejność mapy: teren bazowy → rzeźba → rzeczywiste obszary drzewiaste → jeziora i rzeki → granice województw/państwa → miasta → etykiety i wybór. Wszystkie warstwy używają tej samej kamery i projekcji. Nie ma fotografii, losowych lasów/gór ani dekoracyjnych fikcyjnych dróg.

Nawigacja 04B pozostała: przeciąganie, rozróżnienie kliknięcia i gestu, kółko pod kursorem, +/−, Polska/demo, resize, wyszukiwanie 19 miast z polskimi i ASCII nazwami, Enter/strzałki/Escape, wybór klawiaturą/myszą, lista nakładających się miast, priorytet wybranego miasta, dynamiczna skala i limit około 200 m/piksel CSS z korektą Mercatora. Canvas nie przejmuje kliknięć. Awaria hydrografii lub rastrów daje działający przycisk retry bez utraty mapy ani zatrzymania zegara.

Git diff względem bazy potwierdza brak zmian w **src/core, src/persistence, src/domain, trzech oryginalnych plikach danych 04A, docs/SPEC_0_1_ORIGINAL.txt, package.json i package-lock.json**. Centralny zegar, RNG, IndexedDB, SaveEnvelope schemat 1, autosave, import/eksport i Web Locks pozostają zgodne. Firma nadal nieutworzona. Kamera i wybór to stan UI, nie zapis gry.

## Dane, licencje i istotne pliki

- **docs/MAP_DATA.md**: źródła, wersje, daty, pełne ograniczenia, SHA/ETag i odtwarzanie. W aplikacji działa strona **public/map-sources.html** i kopie licencji w public/licenses.
- **src/world/data/hydrography.json**, 148 kB / około 30 kB gzip: Natural Earth global+Europe rivers/lakes v5.1.2, przycięte do niezmienionej granicy Polski, trzy kontrolowane poziomy uproszczenia. Generator scripts/prepare-hydrography.py, narzędzia scripts/requirements-map.txt.
- **public/landscape/**: manifest i sześć PNG, łącznie około 0,6 MB obrazów. EPSG:3857, bazowe 1395×1319 komórek, 800 metrów projekcji (około 460–525 m rzeczywistych w Polsce), trzy LOD. Pełna maska krajowej siatki ma dane; to nie oznacza pełnego rejestru lasów ani dokładności 10 m.
- **scripts/landscape-sources.json**: dokładne 69 URL, ETag/SHA, wersje i pochodzenie. **scripts/prepare-landscape.py** z **scripts/requirements-landscape.txt**: pobiera przeglądy COG bez gigabajtów całych źródeł, sprawdza blokadę, próbuje klasę tree cover, dekoduje rzeczywiste wysokości Terrarium, reprojektuje i kwantuje paletę. Uruchomiono inicjalnie i ponownie z weryfikacją locka. Nie zmieniać sum, aby ukryć niezgodność; --initialize-lock odmawia nadpisania istniejącego pliku.
- **src/ui/LandscapeCanvas.tsx**: jeden Canvas i osobne asynchroniczne cache/retry wody oraz krajobrazu. **src/world/landscape/**: typy/loader, współdzielona projekcja geometry.ts, indeks/culling spatial.ts oraz loader/crop rastrów raster.ts. Path2D i obrazy powstają raz, na ruch kamery tylko transformacja, dobór LOD i wycinka. Nie przeliczamy źródłowych danych wysokości na każdy tick/render.
- **src/ui/PolandMap.tsx**, projection.ts, labels.ts: dotychczasowa kamera, SVG granic/miast i etykiety. Foreground pozostaje czytelny, granice są stonowane. Przy dalekim lesie pomijane są małe spójne komponenty (25 komórek coarse, 6 medium); fine zachowuje źródłową próbkę.
- **scripts/capture-map.mjs**: odtwarza osiem rzeczywistych zdjęć ekranu z produkcyjnej aplikacji i pomiar. Nie generuje makiet. Południe to zbliżenie Tatr/Podhala przy 200 m/px. Opcja --south-only odtwarza same dwa południowe kadry.

## Weryfikacja końcowa

- **npm test: 64/64** — wszystkie pierwotne 52 oraz 12 testów danych/LOD/rasterWindow/źródeł/geograficznych próbek i uproszczenia.
- **npm run typecheck: OK**.
- **npm run build: OK** — główny JS około 266 kB / 85 kB gzip, źródła w osobnych lokalnych zasobach, bez ostrzeżenia o dużym module.
- **npm run test:e2e: 27/27** — wszystkie pierwotne 23 oraz 4 nowe: LOD/culling/kolejność warstw i błędy/retry danych. Zachowano oryginalne asercje czasu, autosave, dwóch kart i konsoli. Przeszły 1366×768, 1920×1080, resize, DPR 2 i istniejący mały ekran.
- **Produkcja Chromium:** Vite preview z końcowego buildu; faktyczne przejście Polska/demo/Kraków/południe w obu rozmiarach, wybór i zoom 200 m/px, brak błędów konsoli/runtime w zapisie scenariuszy. Dodatkowo osobne smoke testy hydrografii i rastrów po wczytaniu.
- **Kontrola wizualna:** wszystkie osiem końcowych JPEG obejrzano, a wcześniej cztery bazowe i pięć hydrograficznych. Czytelne miasta/teksty/przyciski, rzeczywista woda, leśne kompleksy i dyskretne pasma wysokości. Maksymalny zoom celowo ujawnia piksele uogólnionych danych, nie udaje geodezyjnych szczegółów.
- **Wydajność:** jeden Canvas, 124–133 elementy SVG w badanych kadrach. Pierwszy pomiar 60 ruchów: Canvas mediana 0,2/0,3 ms, P95 0,5/0,9 ms; rAF mediana 16,7 ms, P95 16,7/33,3 ms. Powtórka Canvas P95 0,6 ms; rAF P95 16,7/16,8 ms, pojedyncza klatka 100 ms w 1920. Oba przebiegi zapisane w performance.json, bez ukrywania odstających wartości. To headless Chromium bieżącej chmury, nie gwarancja FPS na każdym fizycznym laptopie.

## Dokładne finalne zrzuty

Wszystkie w docs/screenshots/04C/ (JPEG quality 82, zwykle 110–180 kB):

- final-country-1366.jpg i final-country-1920.jpg
- final-demo-1366.jpg i final-demo-1920.jpg
- final-krakow-1366.jpg i final-krakow-1920.jpg
- final-south-1366.jpg i final-south-1920.jpg

Galeria, baseline i ocena: docs/screenshots/04C/README.md. Pomiary: docs/screenshots/04C/performance.json. Odtworzenie po buildzie i uruchomieniu preview: `node scripts/capture-map.mjs http://127.0.0.1:4173`.

## Ograniczenia i kolejny krok

Brak nierozwiązanych blockerów wymaganych funkcji 04C. Początkowe HTTP 403 dla ESA/S3 rozwiązane; po dodaniu dwóch domen do szkicu i późniejszej weryfikacji oba źródła odpowiadały 200, dane pozyskano. Sam zapis szkicu nie jest publikacją środowiska; nie twierdzimy, że powstała nowa opublikowana migawka lub zweryfikowano nowe zadanie. Gra korzysta z danych lokalnych i nie wymaga usług zewnętrznych. Ustawienia domen do przyszłego odtwarzania można zachować przez przejrzenie/zapisanie i publikację środowiska.

Dane są uogólnione: hydrografia 1:10m nie zawiera wszystkich cieków/jezior; WorldCover tree cover jest szersze od prawnego lasu i nie zachowuje 10 m po próbkowaniu; wysokości z mozaiki z 2017 r. wygładzają małe formy/szczyty. Nie są bieżącym NMT. W masce siatki są także ujemne wartości źródłowej mozaiki (nie poprawiano ich ręcznie). Statystyka pokrycia 0,4177 to wynik konkretnej próbkowanej klasy, nie urzędowa lesistość Polski.

Nie ma 05/routingu/dróg, nowych miast krajowych, transportów, pojazdów, kierowców, rynku, ekonomii ani multiplayera. Nie dodano płatnego API czy klucza. Kolejny etap wymaga nowego polecenia; kontynuować istniejące warstwy/kamerę, bez nowej aplikacji.

Uruchomienie: `npm ci` (tu opcjonalnie `--cache /tmp/pixelcargo-npm-cache`), `npm run dev`. Python i zewnętrzne domeny są potrzebne tylko do regeneracji, nie gry. Nie regenerować zasobów podczas E2E/HMR.

Końcowa weryfikacja: TypeScript OK; npm test 86/86 (11 plików); standardowy build i build:pages OK; Playwright unified 33/33 (w tym scenariusze gry w obu rozdzielczościach); produkcyjny Pages 1/1. Brak zmian w danych OSM, trasach, silniku i schemacie IndexedDB.

Końcowe kontrole: npm run typecheck OK; npm test 93/93 (12 plików); npm run build i build:pages OK; Playwright unified 33/33, freight 1/1, Pages 1/1 (łącznie 35). Pełna płatna dostawa, zapis w trasie, ruch auta, harmonogram i restart potwierdzone.
