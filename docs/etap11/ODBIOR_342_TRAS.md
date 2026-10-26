# Test akceptacyjny - definicja „cała Małopolska działa poprawnie”

## Warunki konieczne

1. Dokładnie 19 obsługiwanych miast, 19×18 = **342 kierunki**. Każdy ma prawdziwą skierowaną trasę, dystans i ETA. Nie należy dublować Krakowa, Nowego Sącza ani Tarnowa, mimo podwójnego statusu siedziby powiatu.
2. 135 zatwierdzonych przejazdów z Etapu 08 zachowanych co najmniej w dawnych lub **krótszych, ponownie audytowanych** wersjach. Test obejmuje WSZYSTKIE 135, nie tylko kilka przykładów.
3. 306 dotychczas zatwierdzonych relacji między 18 miastami nadal kompletnych. Nie wolno cofnąć Oświęcimia do „brak połączenia”.
4. Legalność dla pojazdu furgon o parametrach z gry: jednokierunkowe, `access`, `motorcar`, `motor_vehicle`, zakazy skrętu `via-node`, `via-way`, bariery, wysokość/szerokość/masa, warunkowe reguły, stan łańcucha przy zmianie odcinka. Każdą z 342 tras przebudować od ID oryginalnych skierowanych krawędzi OSM i **niezależnie skontrolować**.
5. Weryfikacja, że żaden najlepszy wariant w sieci powiatów nie zastępuje krótszego audytowanego wariantu bezpośredniego. Ostatecznie porównanie z niezależnie wygenerowaną legalną drogą w PEŁNYM grafie OSM, a nie tylko między centrami powiatów.
6. Wymuszony test opłacalności: dystans jazdy wpływa na czas, paliwo, zmęczenie, planowany odpoczynek i terminy. Jedna geometra = jeden dystans = jedna symulacja. Brak niezamierzonych 200+ km objazdów.
7. GitHub Pages: sprawdź odpowiedź sieciową i wersję katalogu aktywnego w grze, nie tylko wynik builda. Bez cichego fallbacku do starego zestawu dla długich tras.
8. Test zapisu/zlecenia w trakcie jazdy: po aktualizacji aktywne przewozy ze starą geometrią kontynuują się bez teleportacji; nowe kursy używają naprawionych tras.

## Obowiązkowe regresje z etapu 08

| Kierunek | Etap 08 | 09/10 błąd | Warunek |
|---|---:|---:|---|
| Kraków → Wieliczka | 14,14 km | 102,57 km | ≤ 14,14 km + tolerancja zaokrąglenia albo lepsza, legalna trasa |
| Wieliczka → Kraków | 13,97 km | 54,64 km | nie pogarszać 08 |
| Kraków → Myślenice | 30,30 km | 88,69 km | nie pogarszać 08 |
| Kraków → Zakopane | 103,64 km | 146,02 km | nie pogarszać 08 |
| Kraków → Tarnów | 82,69 km | 113,9 km | nie pogarszać 08 |
| Kraków → Nowy Sącz | 86,1 km | 132,4 km | nie pogarszać 08 |
| Olkusz → Kraków | 39,89 km | 70,79 km | nie pogarszać 08 |

**Tolerancja 0,06 m w programie dla metadanych źródłowych**, nie dla źle wybranej drogi. Dodatkowo testy ekranowe i scenariusze ekonomiczne.

## Raport bramki

Wymagane pola do odbioru: `source_graph_sha256`, `route_catalog_sha256`, `osmium_date`, `profile_id`, `city_count:19`, `directed_pairs:342`, `independent_audited_count:342`, `unresolved:[]`, `shorter_than_or_equal_certified08_count:135`, `worst_stretch_ratio_vs_OSM`, `excluded_tags_report`, `oswiecim_inbound_outbound`, `gorlice_inbound_outbound`, wyniki unit+Playwright+Pages+E2E pełne kursy.

**Jeśli 342/342 nie przejdzie, uczciwy status = „naprawa częściowa, NIE zakończona”.** Żadnej deklaracji „wszystko działa”, żadnego obejścia blokad. Jeżeli semantyka prawdziwych dróg pozostaje nieznana, zapisujemy warunek i potrzebny nowy snapshot OSM.
