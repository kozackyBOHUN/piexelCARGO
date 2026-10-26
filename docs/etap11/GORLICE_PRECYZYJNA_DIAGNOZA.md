# Gorlice: cztery prawdziwe kandydackie przejazdy, bez fikcyjnych dróg

Przeprowadzono lokalne przypasowanie polilinii 4 najważniejszych tras 05B do źródłowych kierunkowych segmentów **TEGO SAMEGO** grafu OSM, którego hash sprawdza Etap 09. Dla każdego źródłowego segmentu sprawdzono kierunek (`directions`), ciągłość, proste relacje via-node (tylko `no_` / `only_`). Wspólne źródło danych: `graph.json.gz` (OSM snapshot 2026-10-24). Nie jest to niezależny kompletny audyt wszystkich warunków dostępu i restrykcji via-way (choć na tych czterech ścieżkach nie stwierdzono dotkniętych relacji via-way).

| Kierunek | Źródłowe ID | Dystans | Segmenty | Wstępna diagnostyka |
|---|---|---:|---:|---|
| Tarnów → Gorlice | `9c0dd3cb` | 50,873 km | 764 | Jeden segment way `25092944` z tagiem `maxgvweightrating:hgv:conditional = none @ marked` |
| Gorlice → Tarnów | `2ef7b4ea` | 51,306 km | 793 | Brak wykrytych tagów `:conditional` |
| Nowy Sącz → Gorlice | `abb64222` | 39,673 km | 553 | Brak wykrytych tagów `:conditional` |
| Gorlice → Nowy Sącz | `1eb355ab` | 39,672 km | 550 | Brak wykrytych tagów `:conditional` |

We wszystkich 4 geometria jest ciągła, dopasowana do źródłowych segmentów i nie wykryto prostych naruszeń via-node. Zestaw trzech ostatnich może być dobrym punktem wyjścia dla nowego audytu. Tag dotyczący **HGV** nie może być automatycznie utożsamiony z ograniczeniem dla furgonu B 3,5 t, ale jego semantyka wymaga sprawdzenia.

**Ważne:** potwierdzenie tu oznacza weryfikację techniczną źródłowej geometrii i podzbioru reguł, NIE zgodę na aktywację. Pełny niezależny audyt 08/09, komplet krawędzi, wagi, kierunki, wyjątki pojazdu, `no_turn` i via-way i tak obowiązuje, jak również 36 końcowych relacji z Gorlicami.

W razie braku dobrego wejścia/wyjścia **nie publikować Gorlic** jako działającego miasta ani nie twierdzić „19/19”.
