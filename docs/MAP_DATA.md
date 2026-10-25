# Dane mapy — źródła 04A i obsługa 04B

Mapa jest lokalną warstwą wektorową, bez zewnętrznych kafelków, kluczy API i backendu. Obejmuje prawdziwe granice Polski i wszystkich 16 województw oraz **wyłącznie 19 miast demonstracyjnych Małopolski**. Nie jest to komplet miast Polski ani sieć dróg. Nie wyznacza tras.

## Źródła i licencje

| Dane | Źródło i przypięta wersja | Licencja / data |
| --- | --- | --- |
| Województwa | [ppatrzyk/polska-geojson](https://github.com/ppatrzyk/polska-geojson/tree/74a22f97cf822aa1cb49802c1700ccb8b6340eca), wojewodztwa/wojewodztwa-medium.geojson. Według README: konwersja danych Państwowego Rejestru Granic GUGiK. | Repozytorium: MIT, © 2019 Piotr Patrzyk. Kopia pełnej licencji: public/licenses/polska-geojson-MIT.txt. Źródło nie podaje daty stanu administracyjnego; nie deklarujemy aktualnej migawki urzędowego PRG. |
| Granica Polski | Suma geometryczna tych samych 16 województw. | To samo źródło i licencja co wyżej. |
| Miasta | © [GeoNames](https://www.geonames.org/), cities500, dystrybucja [geonamescache 3.0.2](https://pypi.org/project/geonamescache/3.0.2/) autorstwa Ramiro Gómez. | Dane GeoNames: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Kod/dystrybucja pakietu: MIT, kopia public/licenses/geonamescache-MIT.txt. Brak daty pojedynczych rekordów w dystrybucji; nie używamy jej populacji jako danych spisowych. |

Data pobrania: **2026-10-25**. Atrybucja i opis zmian są także dostępne z działającej mapy pod „Źródła i licencje” (public/map-sources.html).

Plik granic pobrano z przypiętego commita `74a22f97cf822aa1cb49802c1700ccb8b6340eca`. SHA-256:

```
0a4ffcd220604124b3170c496b3a02f6d7f8d867e46f0b23f7ac0ef9798d2a2d
```

Koło `geonamescache-3.0.2-py3-none-any.whl`, SHA-256:

```
b830e8942f2d58c7e68782dcf4dff2ffe8c4104a35ee881ed1ad4023cefcdba4
```

## Przekształcenia i zakres demo

Generator `scripts/prepare-map.py` weryfikuje sumy plików wejściowych. Dziesięć województw w uproszczonym pliku źródłowym ma niepoprawną topologię; `Shapely.make_valid` naprawia pierścienie, zachowując ich geometrię (z GeometryCollection pozostają części powierzchniowe). Następnie `unary_union` daje granicę państwa. Współrzędne zaokrąglono do 5 miejsc po przecinku. Nie rysowano granic ręcznie i nie dodawano fikcyjnych połączeń. Generator sprawdza poprawność geometrii przed zapisem i przynależność wszystkich miast do Małopolski.

Identyfikatory województw: `PL-` + dwucyfrowy kod województwa TERYT (np. PL-12). Identyfikatory miast: `geonames:` + oryginalny geonameid. Kolejność współrzędnych GeoJSON/WGS84: **długość, szerokość**.

Demo zawiera: Bochnia, Brzesko, Chrzanów, Dąbrowa Tarnowska, Gorlice, Kraków, Limanowa, Miechów, Myślenice, Nowy Sącz, Nowy Targ, Olkusz, Oświęcim, Proszowice, Sucha Beskidzka, Tarnów, Wadowice, Wieliczka, Zakopane. To jawnie wybrany zestaw siedzib powiatowych Małopolski, nie wynik filtra ludności ani komplet miast Polski. Współrzędne i nazwy pochodzą z GeoNames, a nie z ręcznego rozmieszczenia. Populacja, limity ofert i dane rynku nie są częścią tego etapu.

## Odtworzenie danych

Nie jest wymagane do zwykłego `npm ci`, `npm test` ani `npm run build`. Dane wynikowe są commitowane, przeglądarka ładuje je z własnego originu.

W katalogu repozytorium, przy dostępie do raw.githubusercontent.com oraz PyPI:

```sh
mkdir -p /tmp/pixelcargo-geo
curl -fLsS 'https://raw.githubusercontent.com/ppatrzyk/polska-geojson/74a22f97cf822aa1cb49802c1700ccb8b6340eca/wojewodztwa/wojewodztwa-medium.geojson' -o /tmp/pixelcargo-geo/woj.geojson
python3 -m pip download geonamescache==3.0.2 --no-deps --dest /tmp/pixelcargo-geo --cache-dir /tmp/pixelcargo-pip-cache
python3 -m pip install --target /tmp/pixelcargo-map-tools -r scripts/requirements-map.txt --cache-dir /tmp/pixelcargo-pip-cache
PYTHONPATH=/tmp/pixelcargo-map-tools python3 scripts/prepare-map.py \
  --boundaries /tmp/pixelcargo-geo/woj.geojson \
  --cities-wheel /tmp/pixelcargo-geo/geonamescache-3.0.2-py3-none-any.whl
```

Zweryfikowano generator na Pythonie 3.12 i Shapely 2.1.2. Zmiana źródła wymaga świadomej aktualizacji wersji/sum oraz ponownej walidacji danych; nie zastępować sum przy błędzie pobrania. Bezpośredni serwer dumpów GeoNames zwracał w tym środowisku HTTP 403, dlatego użyto przypiętej dystrybucji GeoNames z PyPI. Nie wyłączano weryfikacji TLS ani integralności danych.

## Architektura i dalsze rozszerzanie

- `src/world/geography.ts`: kontrakty GeoJSON, WGS84 i `GeographyDataset` niezależne od GameState.
- `src/world/data/*.json`: commitowane geometrie i miasta. `data.ts` daje synchroniczny katalog do testów; `loader.ts` ładuje te same pliki jako zasoby statyczne w aplikacji, z jednym współdzielonym żądaniem i możliwością ponowienia błędu.
- `projection.ts`: standardowa projekcja Web Mercator (EPSG:3857, oś Y odwrócona dla SVG), obliczenie obwiedni, dopasowanie z zachowaniem proporcji, wspólne `screenPoint` i `geometryPath` dla przyszłych warstw.
- `labels.ts`: deterministyczne rozmieszczenie bez kolizji w pikselach CSS. Etykiety są ograniczane, ale wszystkie znaczniki i lista miast pozostają dostępne klawiaturą.
- `src/ui/PolandMap.tsx`: izolowany, memoizowany widok. Oddzielne grupy SVG: województwa, granica państwa, miasta, etykiety. Przyszłe drogi, pojazdy i trasy mogą użyć tej samej projekcji, bez własnego przeliczania czasu ani zmiany silnika.

**Stan historyczny 04A:** dwa stałe kadry (Polska i Małopolskie) służyły przeglądowi danych 04A. Nie dodano swobodnego przesuwania, zoomu, wyszukiwania miast, routingów, danych całego rynku ani implementacji 04B/04C. Wybór miasta pokazuje jedynie nazwę i prawdziwe współrzędne, bez udawania ofert. Stan prezentacji mapy nie zmienia formatu zapisów gry.


## Nawigacja 04B — bez zmiany danych

Etap 04B rozwija istniejącą mapę, zachowując pliki danych, ich SHA-256 i licencje. Swobodne przesuwanie, zoom i wybór miasta są lokalnym stanem UI. Nie zmieniono GameState, zegara ani schematu zapisu.

`projection.ts` udostępnia jedną kamerę `MapViewport`: rozmiar w pikselach CSS, skalę pikseli na metr projekcji i przesunięcia. Wszystkie warstwy korzystają z tego samego przekształcenia. Geometrie granic są cache’owane przy bazowym dopasowaniu; `viewportTransform` przekształca grupę SVG podczas nawigacji. Znaczniki, hitboxy i etykiety są obliczane przez wspólne `screenPoint`, zachowując rozmiar w pikselach CSS. Nie mnożymy skali przez devicePixelRatio.

Dla sferycznej Web Mercator rzeczywiste metry na piksel w szerokości φ to `cos(φ) / viewport.scale`. `groundMetersPerPixel` stosuje φ w środku kamery. Maksymalna skala wynosi `cos(φ) / 200`; po przesunięciu na inną szerokość limit jest ponownie kontrolowany. `distanceScale` stosuje szerokość przy samej belce w dolnym rogu i dobiera długość 1/2/5 × potęga 10 z jednostką m lub km. Jest to lokalna metryka sferycznej projekcji, zgodna z przybliżonym limitem specyfikacji.

Minimalna skala pochodzi z dopasowania całej Polski. Na minimalnym zoomie przesuwanie wraca do tego dopasowania. Przy większym zoomie środek kamery może poruszać się po powierzchni kraju; próba wyjścia poza rzeczywisty obrys jest rzutowana na najbliższy odcinek granicy. Dzięki temu Polska pozostaje widoczna także w narożnikach obwiedni, w których sam prostokątny clamp nie wystarcza. Zachowanie punktu pod kursorem jest dokładne, dopóki nie zadziała ograniczenie przesuwania lub zoomu.

`labels.ts` ma progi rozdzielczości: ponad 1800 m/px — do 3 nazw, 600–1800 m/px — do 9, poniżej — wszystkie mieszczące się bez kolizji. Nazwa wybranego miasta ma pierwszeństwo. Nie renderujemy etykiet miast poza kadrem. Ich znaczniki nadal mają stały hitbox i obsługę klawiatury, a przy nakładaniu można wybrać miasto z listy grupy.

`search.ts` normalizuje znaki Unicode i polskie ł, porównuje fragmenty nazw i sortuje wyniki. `CitySearch.tsx` otrzymuje katalog oraz nazwy województw z istniejących danych; nie zawiera ręcznej listy 19 nazw ani filtra ograniczającego przyszły większy katalog. Obecna aplikacja nadal przekazuje wyłącznie 19 miast demo i jawnie to komunikuje. Nie dodano danych ogólnopolskich ani 04C.

## Hydrografia 04C-2 — lokalna, rzeczywista warstwa wody

Źródło: **Natural Earth 5.1.2**, domena publiczna, „Made with Natural Earth”. [Warunki źródła](https://www.naturalearthdata.com/about/terms-of-use/), kopia pełnego oświadczenia z przypiętej wersji: public/licenses/natural-earth-PUBLIC-DOMAIN.md. Europejskie suplementy mają pochodzenie EC JRC IES opisane w tym samym oświadczeniu Natural Earth. Data pobrania: **2026-10-25**; wersja zbioru nie oznacza aktualnej daty pomiaru każdej rzeki.

Wszystkie adresy zaczynają się od `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/`:

| Plik źródłowy | SHA-256 |
| --- | --- |
| ne_10m_rivers_lake_centerlines.geojson | bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a |
| ne_10m_rivers_europe.geojson | 90712202ac46985812e90840df9acd5101599a9c649868d5bc55ee96c2fedd4c |
| ne_10m_lakes.geojson | 2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9 |
| ne_10m_lakes_europe.geojson | b4dd9e7a5edd0d07b54768b5404d1ebe77f80b9d579c85fff65f90cf50369769 |

### Rzeczywisty zakres

Wynik: **33 obiekty rzek/osi wodnych oraz 21 poligonów jezior i zbiorników** po przecięciu z istniejącą granicą kraju. Zawiera Wisłę, Odrę, Wartę, Bug, Narew, San, Dunajec i Pilicę; także m.in. Bzurę, Drwęcę, Wkrę, Gwdę, Łynę, Wieprz, Nysę Kłodzką, Prosnę, Bóbr i Noteć. Obiekty mogą być wieloczęściowe; liczba obiektów nie oznacza liczby unikalnych nazw rzek.

Jeziora/zbiorniki obejmują m.in. Dąbie, Gardno, Łebsko, Miedwie, Drawsko, Gopło oraz geometrie głównych jezior mazurskich i większych zbiorników, z których część nie ma nazwy w źródle. Nie dopisujemy niezweryfikowanych nazw do anonimowych rekordów. To generalizowany zbiór 1:10m, **nie pełny rejestr wszystkich polskich rzek, jezior i małych zbiorników**. Nie służy nawigacji ani analizie hydrologicznej; przy maksymalnym zoomie widać uogólnienie źródła.

### Przetwarzanie i odtworzenie

Generator scripts/prepare-hydrography.py wymaga narzędzi z scripts/requirements-map.txt i sprawdza cztery sumy SHA-256. Naprawia geometrię w razie potrzeby, przecina ją z niezmienioną granicą z 04A, zachowuje liniowe/powierzchniowe części, tłumaczy potwierdzone nazwy Vistula→Wisła, Oder→Odra i Luzicka Nisa→Nysa Łużycka. Nie łączy fikcyjnie brakujących odcinków. Douglas–Peucker z zachowaniem topologii: tolerancje 0,012°, 0,003° i 0,0007° dla trzech LOD, następnie pięć miejsc po przecinku. To najwyżej około 1,3 km / 330 m / 78 m w szerokości geograficznej; zmiana przebiegu wynika z kontrolowanego uproszczenia rzeczywistej geometrii.

```sh
mkdir -p /tmp/pixelcargo-landscape
for layer in rivers_lake_centerlines rivers_europe lakes lakes_europe; do
  curl -fLsS "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_${layer}.geojson" \
    -o "/tmp/pixelcargo-landscape/ne_10m_${layer}.geojson"
done
python3 -m pip install --target /tmp/pixelcargo-map-tools -r scripts/requirements-map.txt --cache-dir /tmp/pixelcargo-pip-cache
PYTHONPATH=/tmp/pixelcargo-map-tools python3 scripts/prepare-hydrography.py --source-dir /tmp/pixelcargo-landscape
```

Wynik src/world/data/hydrography.json: około **148 kB / 30 kB gzip**, commitowany lokalnie. Nie regenerować podczas działających testów E2E z Vite/HMR. Normalne uruchomienie aplikacji nie wymaga Pythona, Shapely ani żadnych zewnętrznych żądań mapowych.

### Renderer i optymalizacja hydrografii

Jedna warstwa Canvas pod istniejącym SVG miast i granic, `pointer-events:none`. Korzysta wyłącznie ze wspólnego project() i MapViewport. Path2D dla wszystkich trzech LOD powstają raz po odczycie danych, a indeks siatki w metrach projekcji odrzuca obiekty niewidoczne. Wzrost zoomu ujawnia dopływy i mniejsze poligony. Nad krajobrazem pozostają granice, miasta i etykiety; przyszłe lasy/wysokości należą przed wodą, a drogi/trasy/pojazdy wymagają osobnego etapu 05. Nie dodano ich pustych imitacji.

Pomiar warstwy wody w bieżącym headless Chromium podczas 50 próbek przeciągania: 1366×768 mediana 0,2 ms, P95 0,3 ms, max 1,1 ms; 1920×1080 mediana 0,2 ms, P95 0,4 ms, max 0,8 ms. To czas wykonania funkcji rysującej, nie pomiar pełnego kosztu GPU/React ani gwarancja FPS na każdym laptopie. Woda dodaje jeden canvas zamiast 54 lub większej liczby elementów SVG.

### Blokada kolejnego podetapu 04C-3

Lasy i rzeźba terenu **nie są jeszcze zaimplementowane**. Sprawdzone planowane źródła: ESA WorldCover 2021 v200 (CC BY 4.0, klasyfikacja pokrycia terenu; planowany wybór pokrycia drzewiastego z jawnie podaną rozdzielczością) i publiczne kafle wysokości Terrarium z elevation-tiles-prod (weryfikacja źródeł i wymaganej atrybucji przed użyciem). Dane nie zostały pobrane i nie deklarujemy ich pokrycia ani licencji przygotowanego produktu wysokościowego.

Żądania testowe do `esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N48E018_Map.tif` oraz `s3.amazonaws.com/elevation-tiles-prod/terrarium/7/71/43.png` kończyły się `curl: (56) CONNECT tunnel failed, response 403` / HTTP 403. To blokada dostępu w obecnym środowisku, nie brak sekretu. Dodano obie domeny do szkicu egress bez naruszania presetów. Sam zapis szkicu nie stosuje ustawień do runtime; po ich zastosowaniu należy ponowić żądania, sprawdzić metadane/licencje, przygotować lokalny zoptymalizowany zestaw i dopiero wtedy implementować 04C-3. Nie zastąpiono tych danych losową grafiką.
