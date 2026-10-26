# Etap 11 — ostateczna naprawa routingu Małopolski

Baza `92ff5c46eaa334f6ad6f7ec6ab03bb1bafe32d25`. Praca w osobnym worktree, wyłącznie gałąź docelowa `feat/preview-gameplay-core`, bez merge do main. Pełne polecenie i instrukcje paczki w `docs/etap11/`. Nie zmieniono mechanik ładunków, zegara, kredytu, paliwa, odpoczynku, zapisu ani PNG.

## Wynik

- **19 miast, 342/342 kierunków**, w tym 36 do/z Gorlic i 36 do/z Oświęcimia.
- **135/135** tras etapu 08 bez pogorszenia dystansu, kontrola każdego kierunku, nie tylko przykładowych.
- **342** niezależne certyfikaty źródłowych krawędzi, geometrii, kierunków, access, wymiarów/masy, barier, via-node i via-way. `unresolved: []` w `docs/reports/11-route-acceptance.json`.
- Największy stosunek wybranego dystansu do niezależnie audytowanego bezpiecznego optimum pełnego grafu: **1,0 (0% nadmiaru)**. Nie porównujemy wyłącznie z siecią miast powiatowych.

| Kierunek | Wybrany dystans |
|---|---:|
| Kraków → Wieliczka | 14,141 km |
| Kraków → Myślenice | 30,298 km |
| Kraków → Zakopane | 103,643 km |
| Kraków → Tarnów | 82,691 km |
| Tarnów → Gorlice | 50,873 km |
| Gorlice → Tarnów | 51,306 km |
| Nowy Sącz → Gorlice | 39,673 km |
| Gorlice → Nowy Sącz | 42,672 km |

Ostatni kierunek **nie używa** dostarczonego skrótu 39,672 km: przechodzi on przez nierozstrzygnięty manewr relacji 4012861. Zamiast go legalizować na podstawie geometrii, wybrano audytowany przejazd 42,672 km.

## Dane i powtarzalność

Źródła pozostają niezmienione: 135 tras i raport 08, 75 odcinków i 306 łańcuchów/raport 09, `public/roads/demo/graph.json.gz`. Nie pobierano PBF ani nie generowano topologii od nowa. Dostarczone geometrie i skrypt naprawczy wykorzystano najpierw do wyeliminowania regresji 18 miast, następnie jako kandydatów pełnego wyboru.

- Paczka właściciela: `data/sources/etap11.zip`; sprawdzono manifest SHA jej plików.
- Graf: `05A-v1-a0575a3f5bd99f19-98733c38`, SHA-256 `e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f`.
- Lokalny PBF: `malopolskie-261024.osm.pbf`, SHA-256 `a0575a3f5bd99f190923818d79bbce882935809bf229792385392a9fa4262cbc`, migawka `2026-10-24T20:20:51Z`.
- Z oryginalnego lokalnego PBF odczytano uzupełniające tagi bezpieczeństwa **668374 dróg, 76615 węzłów i 3200 relacji**. Potwierdzono dokładną zgodność członków i tagów wszystkich 3093 relacji używanych przez graf. To odczyt danych bezpieczeństwa, nie nowy generator tras/topologii.
- Wyciąg: `data/sources/etap11-safety.json.gz`, wejście do powtarzalnej kontroli bez kolejnego pobierania PBF. SHA paczki, wyciągu, grafu, katalogu oraz kodu audytorów są w raporcie.

© OpenStreetMap contributors, ODbL 1.0. Kod gry zachowuje swoją licencję. Atrybucja i pobranie pochodnego katalogu dostępne pod „Źródła i licencje”. Migawka nie opisuje późniejszych robót drogowych i zmian przepisów.

Odtworzenie normalnie wymaga tylko Node i Python stdlib:

```sh
node scripts/verify-routes11.mjs
```

Program weryfikuje paczkę, uruchamia dostarczony `build_preferred_catalog.mjs`, odtwarza źródłowe krawędzie gotowych geometrii, bada pełny graf i uruchamia niezależny audyt. Następnie sprawdza PBF-side safety, zapisuje raport/katalog i uruchamia oryginalną bramkę `--strict19 --audited11`. Bramka potwierdza 342, a nie częściowe 306. Robocze pliki lądują w /tmp i ignorowanym tmp/route-recovery11/.

Opcjonalne ponowne wydobycie metadanych z tego samego lokalnego PBF:

```sh
python3 -m venv /tmp/pixelcargo11-venv
/tmp/pixelcargo11-venv/bin/pip install osmium==4.3.2
/tmp/pixelcargo11-venv/bin/python scripts/routes11/source_safety.py --pbf /tmp/pixelcargo-roads/demo.osm.pbf
```

## Pełny graf i niezależny audyt

Dijkstra działa na wszystkich rzeczywistych skierowanych krawędziach grafu. Jeden przebieg z danego miasta zbiera 18 celów, zamiast ponownie liczyć wszystko osobno. Stan obejmuje przychodzącą krawędź oraz aktywne sekwencje via-way; przejście przez miasto nie zeruje restrykcji. 12 priorytetowych kierunków dodatkowo porównano z istniejącym A*. Każdy najkrótszy kandydat podlega niezależnemu audytowi, zanim może zostać wybrany.

Źródłowy audytor 08 pozostał bez zmian. Kopia `scripts/routes11/audit.ts` stosuje te same reguły z indeksami przyspieszającymi wyszukiwanie. Końcowy audyt uruchamia również oryginał 08, uzupełniony osobnym dowodem z rzeczywistych członków relacji. Poszczególne krawędzie są rekonstruowane z ich kierunkowych ID, a geometria i sumy porównywane z rzeczywistym źródłem. Nie wstawiono linii prostych i nie odwracano przebiegów bez kontroli.

Niekompletne relacje nie są dopisywane ani ignorowane. Dopuszczalne są tylko manewry **bezpieczne dla każdej możliwej wartości brakującego członka**. Przykłady: only_* bez from ze znanym to jest spełnione, jeśli faktyczny wyjazd prowadzi właśnie do tego to; no_* bez to nie dotyczy podejścia innym znanym from. Inne przypadki pozostają zamknięte. Wiele from/to i alternatywy only_* są sprawdzane poprawnie; testy obejmują OR alternatyw, same-way continuation i odrębne zakazy. W raporcie zachowano konkretny dowód dla każdego użytego niekompletnego manewru, bez odgadywania brakującego ID.

Profil: zwykły furgon goods/motorcar do 3,5 t, 2,7 m wysokości, 2,1 m szerokości; konserwatywna górna długość 7 m i masa pojedynczej osi nie większa od całej DMC. HGV-specific oraz bus/hazmat/agricultural warunki dotyczące innych klas nie są zakazem dla tego profilu. Każde wyłączenie ma jawny klucz/wartość i decyzję w `excluded_tags_report`. Nieznane warunki dotyczące furgonu pozostają zamknięte. Kontrola PBF osobno potwierdziła wszystkie 342 wybrane przebiegi, również kierunki i węzłowe ograniczenia fizyczne, zamknięte/bramkowane przejazdy.

### Krótsze, ale niecertyfikowalne dolne granice

Dodatkowa optymistyczna kontrola ignoruje niekompletne manewry i stanowi tylko dolną granicę długości — **nie dowód legalności**. Trzy warianty mają przewagę >5%, ale nie przechodzą niezależnej kontroli:

- Bochnia → Brzesko: 13,251 km, manewr relacji 18953760; wybrano 14,505 km.
- Miechów → Kraków: 37,668 km, manewr relacji 6705072; wybrano 39,745 km.
- Gorlice → Nowy Sącz: 39,672 km, manewr relacji 4012861; wybrano 42,672 km.

Maksymalny stosunek do takiego **niezweryfikowanego** skrótu wynosi 1,094659. Nie ukrywamy go ani nie przedstawiamy skrótu jako legalnego optimum. Wszystkie 342 właściwie wybrane trasy są audytowane i równe lub lepsze od bezpiecznego optimum pełnego grafu; żadna z 135 certyfikowanych tras 08 nie jest dłuższa.

## Runtime i zapis

Gra pobiera `roads/preferred/manifest.json` z cache no-store, następnie katalog z SHA w parametrze URL. Sama liczy SHA-256 pobranych bajtów, sprawdza wersję i komplet 342. Nie ma cichego fallbacku do sieci powiatowej ani starych tras. Przy błędnej/dostępnej tylko częściowo wersji pokazuje błąd zamiast przywracać objazdy.

Katalog ma **13646118 bajtów**, a pełny graf nie jest pobierany przez grę. Przechowuje geometrię każdego skierowanego segmentu tylko raz, a 342 trasy jako łańcuchy indeksów. Pełne polilinie są składane na żądanie. Nie ma przymusu wjazdu do centrów sąsiednich miast. Wersja: `11-3c539dacd20d148a`, SHA-256 katalogu `502fc56e986e477e76eeb4bde63c111d37e1ce374e0d99cf9e4c5b7ab0afd1a6`.

Zapisane aktywne kursy zachowują swoją osadzoną geometrię, długość, ETA, postęp, paliwo, postoje i przyjętą cenę. Nowy katalog aktualizuje metadane dostępnych przyszłych kierunków, bez zastępowania aktualnego kursu. Nowe zlecenia i przejazdy puste korzystają z naprawionych dróg. Nie zmieniono kluczy i schematu zapisu ani dodano naliczania offline.

## Testy i publikacja

Końcowe wyniki zapisane w HANDOFF/ROADMAP i raporcie. Kontrole: TypeScript, wszystkie unit, pełny Playwright, zwykły build, build:pages i test produkcji /piexelCARGO/. Playwright obejmuje obie rozdzielczości, 12 priorytetów, dostawę i powrót z każdego z 19 miast, stary aktywny kurs po aktualizacji oraz wcześniejsze mechaniki 09/10. Osobna konfiguracja `playwright.routing11-live.config.ts` wykonuje te same cztery scenariusze na opublikowanych Pages, w odrębnej przeglądarce testowej. Po sukcesie commit/push i dokładnej kontroli Pages zatrzymać pracę.
