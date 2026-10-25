# PixelCargo preview — pięć zweryfikowanych tras OSM

`routes.json` to minifikowana tablica `TransportRoute[]`, zgodna z
`feat/preview-gameplay-core`, `src/preview/gameplay.ts` (sprawdzono commit
f09d86100e187feaed5d37b7531a132316109bc7).

Każdy rekord ma dokładnie: id, fromCityId, toCityId, meters, seconds, geometry.
WGS84 geometry = [longitude, latitude], od startu do celu; meters = rzeczywista
suma odcinków, seconds = oszacowanie według profilu van-default-v1 i tagów prędkości.
Nie zaokrąglano ani nie upraszczano współrzędnych, nie dodawano prostych łączników.

| Kierunek | meters | seconds |
| --- | ---: | ---: |
| geonames:3094802 (Kraków) → geonames:757026 (Tarnów) | 82690.59621817915 | 3731.6861567048504 |
| geonames:757026 → geonames:3094802 | 82891.15307982748 | 3206.357701530177 |
| geonames:3094802 → geonames:3080866 (Zakopane) | 103642.61551548932 | 5952.062131198946 |
| geonames:3094802 → geonames:775758 (Bochnia) | 41628.10078975017 | 2410.606749415167 |
| geonames:775758 → geonames:3094802 | 41320.188527554565 | 2281.713125263922 |

**Celowo brak Zakopane → Kraków**: niepełne relacje OSM 16545970 (brak from)
i 16545971 (brak to) uniemożliwiają pozytywne zatwierdzenie tego kierunku.
Nie zastępować brakującej trasy odwróceniem innej, prostą linią ani domyślnym
zezwoleniem na skręt. Zestaw jest kierunkowy i celowo niekompletny.

Geometria zaczyna/kończy się na rzeczywistych przypięciach do dróg, niekoniecznie
na punkcie centrum miasta GeoNames. Luka przypięcia (np. Kraków ~315 m) nie jest
drogą i nie jest doliczona do metrów. Czasy nie są pomiarem ruchu drogowego.

Rozmiar 236923 B, orientacyjnie 71701 B gzip. SHA-256:
45228573e2602e72f1d9caf8fd947d1ff44b31153f39b7fe68f60b75c21cca8f

Gra może pobrać wyłącznie `/roads/preview/routes.json` i użyć `geometry` do ruchu
po polilinii. Nie potrzebuje `/roads/demo/graph.json.gz`, createNetwork ani A*.
Nie dołączono kodu firmy, zleceń, pojazdu ani interfejsu.

## Źródło, licencja i kontrola

© OpenStreetMap contributors, ODbL 1.0:
https://www.openstreetmap.org/copyright
Pełna licencja: `/licenses/ODbL-1.0.txt`. Cała pochodna baza tego zestawu jest
udostępniona do pobrania jako routes.json na ODbL. Atrybucję należy zachować
przy integracji z mapą/grą. Istniejące licencje innych danych pozostają oddzielne.

Źródło: Geofabrik malopolskie-261024.osm.pbf, data OSM 2026-10-24T20:20:51Z;
graf 05A-v1-a0575a3f5bd99f19-98733c38. Zmiany: selekcja pięciu przebiegów
wyznaczonych na istniejącym grafie, usunięcie pól zbędnych w TransportRoute,
minifikacja JSON. Pełne polilinie bez generalizacji. Audyt sprawdza rzeczywiste
krawędzie i ich kierunki, spójność węzłów/geometrii, końce city snaps,
sumy odległości/czasów i stosowalne restrykcje. Niepewne kierunki są pomijane.

Regeneracja offline z istniejącego grafu, w katalogu repozytorium:
`node --max-old-space-size=4096 scripts/export-preview-routes.mjs`.
Wymaga zainstalowanych zależności npm; używa esbuild dostarczanego z Vite.
Nie regeneruje danych OSM. Raport, wyniki audytu i pochodzenie:
`docs/reports/05b-preview-export.json`. Zasady grafu: `docs/ROAD_DATA.md`.
Nie jest to deklaracja ukończenia całego 05B ani pełnego routingu Polski.
