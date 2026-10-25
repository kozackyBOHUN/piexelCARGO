# Drogi OSM — etap 05

05A ukończony: rzeczywista baza regionalna i walidacja topologii. 05B–05D nie są jeszcze ukończone. Źródła OSM zostały pobrane
i zweryfikowane; krajowy PBF nie oznacza jeszcze gotowego krajowego grafu.

## Źródła, migawki i integralność

© OpenStreetMap contributors, [Geofabrik](https://download.geofabrik.de/europe/poland.html).
Pobranie 2026-10-25. Dwa datowane ekstrakty (bez kluczy/API):

| Zakres | Plik Geofabrik | Bajty | SHA-256 |
| --- | --- | ---: | --- |
| Małopolska | europe/poland/malopolskie-261024.osm.pbf | 203104424 | a0575a3f5bd99f190923818d79bbce882935809bf229792385392a9fa4262cbc |
| Polska | europe/poland-261024.osm.pbf | 2112079930 | 4d9f766c3e6cbdc4a333608a67058f617ac53c5e89707a606542b46f3ba546cb |

Pełne adresy, oficjalna MD5, ETag/Last-Modified i lokalna SHA-256:
`scripts/roads-demo-source.json`, `scripts/roads-poland-source.json`.
Nagłówek danych regionalnych: **2026-10-24T20:20:51Z**. Daty danych krajowych
i statystyki produktu zapisuje generator w manifeście. Data HTTP ani nazwa pliku
nie zastępuje daty replikacji OSM.

Początkowe próby kończyły się `curl: (56) CONNECT tunnel failed, response 403`
/ HTTP 403 (proxy envoy). Dodano `download.geofabrik.de` do szkicu egress,
zachowując ESA/S3 i preset package_managers. Po ponownej weryfikacji HTTP 200
pobrano oba źródła. Samo zapisanie szkicu nie jest jego publikacją; odtworzenie
w nowym zadaniu nie zostało potwierdzone. Nie wyłączano TLS ani weryfikacji sum.

## Odtworzenie źródeł i grafu

Surowe PBF są poza repozytorium, `/tmp/pixelcargo-roads/`. Suma niezgodna
z lockiem blokuje pracę. Nie zastępować locka w celu ukrycia zmiany źródła.

```sh
python3 scripts/fetch-road-source.py --scope demo --lock scripts/roads-demo-source.json
python3 scripts/fetch-road-source.py --scope poland --lock scripts/roads-poland-source.json
python3 -m pip install --target /tmp/pixelcargo-road-tools -r scripts/requirements-roads.txt --cache-dir /tmp/pixelcargo-pip-cache
PYTHONPATH=/tmp/pixelcargo-road-tools python3 scripts/extract-road-border.py \
  /tmp/pixelcargo-roads/poland.osm.pbf /tmp/pixelcargo-roads/poland-border.json
PYTHONPATH=/tmp/pixelcargo-road-tools python3 scripts/prepare-roads.py \
  --pbf /tmp/pixelcargo-roads/demo.osm.pbf --lock scripts/roads-demo-source.json \
  --border /tmp/pixelcargo-roads/poland-border.json --output public/roads/demo
PYTHONPATH=/tmp/pixelcargo-road-tools python3 -m unittest discover -s scripts -p 'test*road*.py' -v
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Na pierwszym pozyskaniu użyto `--initialize-lock`; odmawia nadpisania istniejącego
locka. Rozwiązany datowany URL jest zachowany. Przy odtwarzaniu wymagamy tej
samej SHA-256 i liczby bajtów. Nie zakładamy nieograniczonej retencji archiwów
Geofabrik; lokalna kopia zgodna z sumą również może odtworzyć źródło.
Oficjalna MD5 to dodatkowa kontrola dostawcy, nie zamiennik SHA-256/TLS.
Skrypt pobierania używa standardowej biblioteki Pythona. PyOsmium/Shapely są
potrzebne wyłącznie do regeneracji, nie do gry/testów JS/buildu.

Granica do filtrowania: rzeczywista kompletna relacja OSM **49715** z tego
samego krajowego PBF. Regionalny plik nie zawiera jej kompletnej geometrii;
ekstraktor wtedy odmawia generacji. Nie zastępuj jej uproszczoną granicą 04A.
Generator wymaga pokrycia całego segmentu przez granicę, usuwa odcinki wychodzące
poza kraj. Nie wstawia geometrycznych przecięć jako nowych węzłów ani nie łączy
urwanych części. Konserwatywnie może wykluczyć transgraniczny fragment drogi.

## Polityka dostępu i topologia 05A-v1

- Klasy: motorway/trunk/primary/secondary/tertiary/unclassified/residential/
  living_street/service oraz ich `_link`. Ścieżki piesze/rowerowe, tracks,
  construction/proposed i pozostałe nie są przejezdne dla demo.
- Dostęp według pierwszego obecnego goods → motorcar → motor_vehicle → vehicle
  → access. Dopuszczamy yes/permissive/designated, domyślnie tak dla wymienionych
  klas. No/private/destination/customers/delivery oraz nieznane wartości są
  wyłączone: zwykły furgon bez indywidualnych zezwoleń.
- Oneway yes/1/true, -1, no/0/false. Domyślna jednokierunkowość motorway
  i junction=roundabout, chyba że źródło określa inaczej. Nieznane/reversible/
  alternating wyłączone. Kierunkowe tagi dostępu mogą zamknąć jedną stronę.
- Warunkowy dostęp/kierunek: konserwatywnie cała droga wyłączona. Nie oceniamy
  godzin/dni ani zezwoleń; to ograniczenie zbioru dostępnych dróg, nie milczące
  uznanie warunku za pozwolenie. Smoothness=impassable/impassable=yes wyłączone.
- Bariera w węźle usuwa sąsiednie segmenty, o ile brak jawnego publicznego
  dostępu; wyjątki przejezdnych typów: cattle_grid/entrance/toll_booth/border_control.
- Połączenia wyłącznie według tych samych oryginalnych OSM node IDs. Przecięcia
  geometrii, estakady i tunele nie tworzą dodatkowych połączeń.
- Kompresja węzłów stopnia 2 zachowuje pełną polilinię, oryginalne końce ways,
  węzły wspólne, via-node restrykcji i przypięcia miast. Żadnej generalizacji
  geometrii routingu. Długość: suma haversine po każdej parze punktów, promień
  6371008,8 m. Kierunki źródłowej geometrii nie są odwracane w bazie.
- Zachowane tagi prędkości, dostępu, ref/name, bridge/tunnel/layer/surface/toll
  i miejsce na maxweight/maxheight/maxwidth. Tagi liczbowe będą interpretowane
  przez profil/routing 05B; 05A nie udaje działającego planera.
- 19 miast: najbliższy źródłowy węzeł drogi w głównej silnie spójnej części sieci (iteracyjny Kosaraju), jawna odległość przypięcia. Lokalny odłączony parking/fragment nie jest odpowiednim punktem startowym. Inne komponenty pozostają w grafie; nie łączymy ich sztucznie.
  Luka nie jest drogą i nie zwiększa przejechanych metrów. Nie zmieniamy GeoNames.
- Relacje restrykcji dotyczące zachowanych ways są przechowane w całości.
  Test połączenia 05A bada skierowaną topologię **przed** restrykcjami skrętów;
  obsługa no/only i raport ograniczeń jest kryterium 05B.

## Format pochodnej bazy v1

`public/roads/demo/graph.json.gz`: gzip JSON UTF-8, `format=1`, `version` obejmuje
wersję polityki, SHA źródła i granicy. `nodes`: `[osmId,lon,lat]`.
`ways`: `{id,tags}`. `segments`: `[stableId,fromIndex,toIndex,wayIndex,meters,
directionBits,geometry]`, stableId=`wayId:startSourceIndex:endSourceIndex`,
bit 1=zgodnie ze źródłem, 2=przeciwnie. Geometria: wszystkie `[lon,lat]` w źródłowej
kolejności. `restrictions`: IDs/tagi/OSM members; `snaps`: cityId/nodeId/gapMeters.
`manifest.json`: pochodzenie, statystyki i walidacja sześciu wymaganych par.
`border.json.gz`: pełna źródłowa granica do kontroli pochodzenia/maski.

`src/world/roads/model.ts`: niezależny od symulacji kontrakt grafu,
skierowane krawędzie i test osiągalności. `loader.ts`: lokalny zasób, cache
obietnicy i retry po błędzie, natywna dekompresja. Nie zmieniamy GameState ani
schematu zapisu. Format regionalny nie jest jeszcze docelową optymalizacją
całej Polski; wydzielenie geometrii/chunków/Worker to zakres 05D.

## Licencja i udostępnienie bazy

OSM: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/),
[informacje o prawach](https://www.openstreetmap.org/copyright),
[wytyczne OSMF](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).
Pełna lokalna kopia licencji: public/licenses/ODbL-1.0.txt (SPDX license-list-data).
Atrybucja i opis zmian: public/licenses/roads-ATTRIBUTION.md.

Graf to pochodna baza OSM, udostępniana na ODbL, razem z informacją o zmianach,
pochodzeniu i całą bazą w maszynowym formacie z opisem. Pliki graph.json.gz,
border.json.gz i manifest.json można pobrać z tej samej instancji bez opłat,
kluczy i backendu; strona „Źródła i licencje” podaje bezpośrednie odnośniki.
Realizuje to dostęp do pochodnej bazy, nie tylko odesłanie do oryginalnego OSM.
Obowiązki publicznego użycia Produced Work i bazy opisują szczególnie §§4.4–4.6.
Nie przenosimy automatycznie licencji na niezależny kod gry, rastry ESA,
granice MIT ani miasta CC BY. Źródła nie są wykorzystywane do płatnego API.

## Statystyki, testy i ograniczenia

Wyniki generacji: public/roads/demo/manifest.json.

- 537460 węzłów, 332727 źródłowych ways, 565817 fizycznych odcinków,
  1102271 skierowanych krawędzi, 3093 zachowane relacje restrykcji.
- 140180397 B JSON, 40081233 B gzip; dodatkowo maska granicy i mały manifest.
- Pierwsza poprawna generacja: 169,74 s, ta instancja (4 vCPU/32 GiB).
- 19 przypięć: około 0,99–314,78 m. Największa luka dotyczy Krakowa,
  którego punkt GeoNames jest na staromiejskim obszarze. Nie jest doliczana do
  przejezdnej długości i nie staje się sztucznym odcinkiem.
- Sprawdzone skierowane połączenia: Kraków–Tarnów/Zakopane/Nowy Sącz/Oświęcim,
  Tarnów–Nowy Sącz, Nowy Targ–Zakopane. To osiągalność, jeszcze nie routing
  z restrykcjami; dystanse/czasy tras będą dopiero wynikiem 05B.
- Pierwsza próba przypięcia do dowolnego najbliższego publicznego węzła nie
  przeszła Kraków–Tarnów. Zastąpiono ją najbliższym źródłowym punktem na głównej
  silnie spójnej sieci; nie dodano żadnego łącznika i nie usunięto innych
  komponentów z grafu.

Regionalny format ma celowo jawną geometrię i tagi, nie jest docelową
optymalizacją danych krajowych. Normalny widok mapy 04C jeszcze go nie ładuje.
Przed krajowym routingiem wymagane są kompaktowa topologia, odrębna geometria,
indeks/chunki i Worker oraz pomiary faktycznego ładowania/pamięci.

Czas generacji czas to pomiar tej
instancji, nie gwarancja urządzeń użytkowników. Testy narzędzia pobierania badają
integralność/odmowę/przerwanie/niezmienność locka; bajty kontrolne nie są PBF.
Kontrolowane grafy testują kierunki, dostęp, wspólne IDs i most bez skrzyżowania;
nie są publikowane jako drogi. Testy rzeczywistej topologii badają sześć par,
przypięcia, geometrię i kierunki. Brak jeszcze pomiarów tras/animacji czy
krajowego grafu; zostaną dodane w kolejnych podetapach.

Weryfikacja 05A: 72/72 Vitest, 15/15 Python, typecheck/build OK, 27/27 Playwright. Ponowna generacja 162,70 s; gzip grafu i maski identyczne SHA-256. Graf gzip SHA-256: `e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f`.
