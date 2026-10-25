# OpenStreetMap — pochodna baza drogowa PixelCargo

© OpenStreetMap contributors. Dane dostępne na Open Database License 1.0:
https://www.openstreetmap.org/copyright
Pełny tekst: /licenses/ODbL-1.0.txt

Źródło: datowane ekstrakty Geofabrik z 24 października 2026.
Dokładne URL, SHA-256, data danych OSM i reguły: docs/ROAD_DATA.md,
scripts/roads-demo-source.json, scripts/roads-poland-source.json.

Zmiany: filtrowanie dróg według dostępu dla demonstracyjnego furgonu;
wykluczenie odcinków poza granicą Polski i przy niedostępnych barierach;
kompresja węzłów stopnia 2 z zachowaniem rzeczywistej geometrii;
skierowany graf według OSM IDs, przypięcie istniejących 19 punktów GeoNames;
zachowane relacje restrykcji i tagi ograniczeń.

Cała wytworzona pochodna baza OSM jest udostępniona na ODbL 1.0. Pliki
/roads/demo/graph.json.gz, /roads/demo/border.json.gz i /roads/demo/manifest.json
są bezpośrednio dostępne z tego samego serwera; nie wymagają kluczy ani opłat.
Opis formatu i narzędzia regeneracji: docs/ROAD_DATA.md i scripts/ w repozytorium.
Niezależne dane terenowe/granice/miasta zachowują własne licencje.
