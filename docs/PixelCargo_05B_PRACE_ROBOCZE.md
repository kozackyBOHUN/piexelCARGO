# Prace 05B wykonane poza Codexem (gałąź robocza)

**Gałąź:** `feat/05b-routing-prep` utworzona na podstawie ukończonego 05A `694542c852f87d3b6d0bdd88c28480f1501abe43`.

**Status:** 05B **W TRAKCIE**, nieukończony. Nie scalać z `main` bez pełnej weryfikacji na rzeczywistym grafie Małopolski.

## Najnowsze zlecenie — eksport tylko pozytywnie sprawdzonych kierunków

**Dostarczono public/roads/preview/routes.json: 5 tras, 236923 B, ~71701 B gzip.**
Baza: 6fe984e6e5b554bd90689ebf9cfa1eb1104d2844. Dokładna tablica TransportRoute[]
sprawdzona z src/preview/gameplay.ts gałęzi feat/preview-gameplay-core, commit
f09d86100e187feaed5d37b7531a132316109bc7. Bez zmian w mechanice lub UI.

| Kierunek | km | Szacowany czas |
| --- | ---: | --- |
| Kraków → Tarnów | 82,690596 | 1 h 2 min 11,686 s |
| Tarnów → Kraków | 82,891153 | 53 min 26,358 s |
| Kraków → Zakopane | 103,642616 | 1 h 39 min 12,062 s |
| Kraków → Bochnia | 41,628101 | 40 min 10,607 s |
| Bochnia → Kraków | 41,320189 | 38 min 1,713 s |

Wszystkie pięć ponownie wyznaczono i poddano audytowi na oryginalnym grafie.
Sprawdzono także gotowy JSON po serializacji: właściwe pola/unikalne ID/kierunki,
GeoNames IDs, dodatnie skończone długości/czasy, współrzędne WGS84 oraz identyczność
geometrii i sum z audytowanym wynikiem routingu. Bez upraszczania/zaokrąglania
współrzędnych i bez zastępczych łączników. Odczyt w grze wymaga tylko małego JSON,
bez createNetwork i 1,5 GiB grafu/sieci w pamięci przeglądarki.

**Pominięto wyłącznie Zakopane → Kraków**: niekompletne relacje OSM 16545970
(brak from) i 16545971 (brak to). Nie odgadywano członków ani nie uznano zakazu
za nieobowiązujący. Zgodnie z nowym poleceniem pominięcie kierunku nie blokuje
innych, zweryfikowanych tras. Nie odwracano automatycznie geometrii innych tras.

Raport: docs/reports/05b-preview-export.json. Licencja, instrukcja integracji
i odtworzenia: public/roads/preview/README.md. Eksporter offline:
node --max-old-space-size=4096 scripts/export-preview-routes.mjs.
Nie regeneruje OSM ani nie zmienia algorytmu; pomija każdy kierunek z błędem audytu.

Weryfikacja eksportu: typecheck projektu i skryptu eksportera OK, 14/14 testów routingu, build OK. Pięć audytów oraz ponowna kontrola JSON po serializacji przechodzą; kopia w dist jest identyczna z public. Bez Playwright i bez generatorów OSM.

Poniższy raport blokady całego sześciotrasowego eksportu jest historyczny;
obecnie wydano podzbiór dopuszczony nowym poleceniem. Pełnego 05B nie oznaczono
jako ukończonego. Nie rozpoczynać kolejnych prac bez polecenia.

## Historyczny wynik — naprawa 3420948 i blokada preview

**Zadanie A ukończone. Zadanie B wstrzymane, nie ma wydanego routes.json.**
Baza tej poprawki: fd234a10d7d0d13f62a5f47cfd8ebf33b9f776b4.
Nie scalano z main, nie uruchamiano 05C/05D ani mechaniki gry.

### Przyczyna i naprawa

Rzeczywista relacja OSM **3420948**: `restriction=no_u_turn`,
`from way 1392975571`, `via node 30372078`, `to way 101322356`.
Obie drogi to jednokierunkowe odcinki ul. Tadeusza Kościuszki w Krakowie.
Zabroniony przejazd w grafie:

- `1392975571:2:5:f`: węzeł 4157482765 → 30372078;
- `101322356:0:4:f`: 30372078 → 1169737288.

Stary canTurn dodatkowo wymagał `prior.from === next.to` dla każdego
no_u_turn. Tu 4157482765 ≠ 1169737288, więc zakaz z dwóch różnych ways
był pomijany. Naprawa ogólna: gdy from/to są różnymi ways, respektujemy
wskazany zakaz from/via/to. Kontrola powrotu do poprzedniego węzła pozostaje
wyłącznie dla tej samej way, aby nie zabraniać jazdy prosto.
Nie ma wyjątku według ID relacji, zmian grafu ani nowych zasad dla innych typów.
Test regresyjny: dwie jednokierunkowe drogi z różnymi zewnętrznymi węzłami,
legalny objazd, A*/Dijkstra i brak trasy po usunięciu objazdu; niezależny audyt
odrzuca nielegalną trasę. Dawny test jazdy prosto na tej samej way pozostał.

### Sprawdzenie rzeczywistego grafu

| Kierunek | km | Szacowany czas | Kontrola |
| --- | ---: | --- | --- |
| Kraków → Tarnów | 82,690596 | 1 h 2 min 11,686 s | OK |
| Kraków → Zakopane | 103,642616 | 1 h 39 min 12,062 s | OK |
| Tarnów → Kraków | 82,891153 | 53 min 26,358 s | OK |
| Zakopane → Kraków | 103,684099 | 1 h 34 min 8,265 s | **Nie można zatwierdzić: niekompletne relacje** |
| Kraków ↔ Bochnia | — | — | Nie uruchomiono po blokadzie |

Dla trzech zatwierdzonych kierunków: rzeczywiste segmenty/kierunki, łączenie
węzłów i geometrii, końce zgodne z city snaps, sumy odcinków i pełnej geometrii,
via-node no/only oraz pełne sekwencje obsługiwanych via-way przechodzą audyt.
Luki GeoNames–droga nie są dodawane do przejezdnego dystansu.
Relacja 8872144 na Zakopane nie ma via, lecz trasa nie używa jej to-way
173721166, więc nie realizuje jej zabronionego manewru. Nie naprawiano tej relacji.

### Blokada eksportu — brak danych, nie dowiedzione naruszenie

Na Zakopane → Kraków niezależny audyt zatrzymuje zatwierdzenie:

- **16545970**, no_u_turn, via node **11283459677**, to way **1217767694**,
  **brak from**. Trasa jedzie przez ten węzeł na tę way.
- **16545971**, no_left_turn, from way **1312182688**, via node **11283459679**,
  **brak to**. Trasa dojeżdża tą way do tego węzła.

Te same niekompletne członki potwierdzono odczytem PyOsmium z krajowego
`poland-261024.osm.pbf`, SHA-256
`4d9f766c3e6cbdc4a333608a67058f617ac53c5e89707a606542b46f3ba546cb`,
data OSM `2026-10-24T20:20:51Z`. Nie jest to wyłącznie obcięcie naszego grafu.
To inny problem niż błąd no_u_turn z kompletnymi członkami. Nie dopisano
nieznanych członków, nie wywnioskowano zezwolenia z samego wyglądu skrętu,
nie zmieniano algorytmu dla nowej klasy problemu.
Nie twierdzimy, że ta trasa jest zakazana; jej zgodność pozostaje niepotwierdzona.

**Nie opublikowano częściowego ani niezweryfikowanego zestawu preview.**
`public/roads/preview/routes.json` nie istnieje; brak rozmiaru produktu do podania.
Roboczy kod pakowania usunięto, aby nie zostawiać pozornej gotowej integracji.
Dalsze kroki wymagają osobnego polecenia: uzupełnione wiarygodne dane albo
jawnie uzgodniona konserwatywna polityka niekompletnych restrykcji, następnie
ponowny audyt sześciu kierunków i dopiero eksport.

### Testy i odtwarzanie

- `npm run typecheck`: OK.
- `npx vitest run src/world/roads/routing.test.ts`: **14/14**.
- `npm test`: **86/86** (w tym dotychczasowe 72).
- `npm run build`: OK.
- Bez Playwright i bez generatorów OSM.
- `node --max-old-space-size=4096 scripts/verify-road-routes.mjs`:
  **exit 1, oczekiwana blokada audytu** przy czwartym kierunku, nie zaliczony test preview.
  Raport: docs/reports/05b-routing-check.json. Wymaga Node/npm dependencies jak projekt,
  ~1,5 GiB RSS; nie jest kodem uruchamianym w przeglądarce.

Diagnostyka routera niezmieniona: 206 handledViaWayRestrictions,
9 conservativeViaWayRestrictions, 41 unsupportedRestrictions. To nie oznacza
pełnej zgodności całego grafu OSM. Audyt nie korzysta z prywatnego canTurn:
ponownie sprawdza źródłowe relacje na zwróconym przebiegu. Niekompletne relacje
są uznane za nieistotne tylko gdy wymagany węzeł/droga nie występuje na trasie;
w przeciwnym przypadku kontrola zatrzymuje eksport.

Poniższe sekcje są historycznymi raportami sprzed tej poprawki.

## Przygotowane pliki

- `src/world/roads/routing.ts`: A*/Dijkstra po długościach odcinków, profil furgonu, odczyt maksymalnych parametrów pojazdu oraz `maxspeed`, podstawowe `no_*`/`only_*` dla `via-node`, deterministyczna geometria, dystans, czas i identyfikator trasy; osobne API tras między węzłami lub 19 miastami demo.
- `src/world/roads/position.ts`: interpolacja współrzędnych i kierunku po dystansie albo czasie przejazdu po **tych samych** odcinkach z routingu.
- `src/world/roads/routing.test.ts`: testy na kontrolowanym małym grafie (również restrykcje, profil, pozycja).

## Co sprawdzono tutaj

- `tsc` dla produkcyjnych plików `routing.ts` i `position.ts` razem z istniejącym kontraktem grafu: **OK**, lokalna kopia modeli odpowiadała definicji 05A na GitHubie.
- 9 niezależnych scenariuszy w Node na małym kontrolowanym grafie: **9/9 OK** (A* i Dijkstra, jednokierunkowość, no/only/no_u_turn, konserwatywne via-way, tonaż, deterministyka, próbki pozycji, niedostępna trasa).
- **Nie** uruchomiono jeszcze `npm test`, Playwright ani typecheck całej aplikacji, ponieważ tutaj nie było repozytorium z zależnościami npm i danych grafu 40 MB. Test pliku `routing.test.ts` nie został wykonany przez Vitest.
- Nie wykonano testów prawdziwych tras Kraków–Tarnów itd., benchmarków pamięci / czasu ani pełnej weryfikacji OSM.


## Raport Codexa: dwie rzeczywiste trasy na 05A (przed optymalizacją)

Pomiar pojedynczego procesu Node.js na oryginalnej implementacji 05B:

| Trasa | Dystans | Czas jazdy | Czas obliczeń |
|---|---:|---:|---:|
| Kraków–Tarnów | 82,81 km | 52 min 17 s | 811 ms |
| Kraków–Zakopane | 103,81 km | 1 h 39 min 53 s | 1752 ms |

Poprawne przypięcia, kolejność krawędzi, geometria i długości. Wczytanie/dekompresja/JSON 4300 ms; utworzenie sieci 2060 ms i routera 693 ms. Peak RSS **1623 MiB**, końcowa sterta JS **926 MiB**. Diagnostyka: **215** `via-way` traktowanych konserwatywnie, **41** niewspieranych restrykcji. Te liczby nie są dowodem pełnej zgodności OSM.

## Wstępna optymalizacja wykonana poza Codexem

Po powyższym benchmarku zmieniono wyłącznie `routing.ts`: per-edge `Map<number, number>` dla kosztów i poprzedników zastąpiono gęstymi `Float64Array` i `Int32Array`; flagi przejezdności oraz sekundy/krawędź również przechowywane są w typed arrays. Nie zmieniono algorytmu, formatów sieci, API ani sposobu restrykcji.

Lokalnie sprawdzono `tsc` oraz 9 niezależnych scenariuszy na małym grafie — OK. Dodatkowy syntetyczny benchmark liniowy (100 tys. węzłów, 99 999 odcinków) z tą wersją dał około 311 ms wyznaczania pełnej trasy i RSS ~185 MiB **dla sztucznego grafu**, więc nie zastępuje pomiaru OSM. Nowa wersja **nie została jeszcze porównana na rzeczywistym grafie 05A ani sprawdzona przez Vitest**.

Najbliższa minimalna czynność zlecona Codexowi: tylko `npm run typecheck`, test `routing.test.ts` oraz te same dwie rzeczywiste trasy i porównanie czasu/pamięci z wcześniejszym raportem. Nie dodawać nowej funkcjonalności, nie robić merge.

## Znane ograniczenia i ryzyka

1. `via-way`: relacje są raportowane i obsługiwane konserwatywną blokadą wejścia w drogę pośrednią. Jest to **ostrzejsze** od precyzyjnych warunków OSM i może generować objazdy; wymaga dokładniejszego modelowania dla finalnego 05B.
2. Prędkości: tagi w formatach warunkowych i nietypowych nie są w pełni interpretowane, stosowane są jawne domyślne prędkości klas. Długość, nie czas, decyduje o wyborze trasy.
3. Graf regionalny 05A ma ~1,1 mln skierowanych krawędzi, więc `createNetwork` + A* może być kosztowne dla głównego wątku przeglądarki. Zanim podłączysz UI, zmierz i/lub użyj Web Workera. Docelowa struktura danych i wydajność będą wymagały dalszych prac.
4. Tagi dostępu kierunkowego są przefiltrowane przez generator 05A. W 05B obsługa niektórych dodatkowych ograniczeń pojazdu może wymagać rozszerzenia.
5. Zgodność licencji i źródeł pozostaje jak w `docs/ROAD_DATA.md`. Nie dokładać fikcyjnej geometrii lub połączeń.

## Plan dalszej pracy

1. Odtwórz projekt i odpal `npm ci`, `npm run typecheck`, `npm test`, `npm run build`.
2. Przejrzyj testy `routing.test.ts`; napraw wykryte problemy bez pomijania istniejących asercji.
3. Przetestuj A* na rzeczywistym grafie 05A: wymagane sześć par miast; czasy, dystanse, legalność restrykcji i deterministyka; diagnostyka relacji `via-way`.
4. Zrób pomiary pamięci i czasu oraz sprawdź, czy wczytywanie/routing nie blokuje UI. Rozważ Worker.
5. Dopiero po poprawkach i pełnych testach zaktualizuj `docs/HANDOFF.md` i `docs/ROADMAP.md` na `main`, oznacz 05B ukończony i zintegruj.

**Uwaga:** historyczne niezapisane pliki 05B z lokalnego Codexa nie zostały odzyskane. To niezależnie przygotowana implementacja, nie kopia oryginalnych szkiców.


## Poprawka 05B via-way - kontynuacja poza Codexem

Nowe commity na `feat/05b-routing-prep` modyfikują `routing.ts` i `routing.test.ts`. Konserwatywne zamknięcie wszystkich skrętów `from-way → first-via-way` zostało zastąpione stanowym rozpoznawaniem *pełnej* sekwencji `from → via-way(s) → to` z kontrolą wspólnych węzłów skrzyżowań.

- `no_*` zabrania ukończenia zakazanego manewru, nie wejścia na cały łącznik; dozwolone wcześniejsze zjazdy zachowano.
- `only_*` wymaga kontynuowania odpowiednią sekwencją przez kolejne via-way, jeśli restrykcja została rozpoczęta na jej właściwym węźle.
- Stan A*/Dijkstry rozróżnia dotarcie do *tej samej krawędzi* z inną historią restrykcji, bez alokowania wielkiej tablicy stanów dodatkowych dla całego grafu.
- Nieważne lub rozłączone relacje nadal korzystają z dawnej blokady konserwatywnej i są jawnie raportowane; `handledViaWayRestrictions` wyróżnia relacje rozpoznawane sekwencyjnie.
- Cztery dodatkowe testy w Vitest obejmują no/only, kilka via-way oraz porównanie A* z Dijkstrą.

**Weryfikacja lokalna w tym środowisku:** TypeScript kodu i testu z typami Vitest-stub przechodzi, 9 starszych syntetycznych scenariuszy + 5 niezależnych scenariuszy via-way w Node przechodzi. **Nie uruchomiono jeszcze prawdziwego Vitest ani OSM na tej wersji**. Wyniki z wcześniejszego benchmarku Kraków–Tarnów / Kraków–Zakopane dotyczą *poprzedniej* wersji routingu. Zmiany restrykcji mogą zmienić wyniki, co wymaga testu regresji.

**Najmniejsze kolejne zadanie Codexa:** na tej gałęzi wykonać `npm run typecheck`, `npx vitest run src/world/roads/routing.test.ts`; następnie *wyłącznie* Kraków–Tarnów i Kraków–Zakopane na rzeczywistym grafie 05A, z krótkim raportem tras, czasów, RSS, liczby `handledViaWayRestrictions`/`conservativeViaWayRestrictions`/`unsupportedRestrictions`. Bez napraw, commitów, merge, Playwright i zmiany danych OSM.

**Uwaga:** precyzyjne wymuszenie restrykcji wymaga jeszcze diagnostyki rzeczywistych relacji OSM (np. nietypowe punkty wspólne i drogi nieobecne po filtracji). Nie oznaczać 05B jako zakończonego przed tym sprawdzeniem.

