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
