# Prace 05B wykonane poza Codexem (gałąź robocza)

**Gałąź:** `feat/05b-routing-prep` utworzona na podstawie ukończonego 05A `694542c852f87d3b6d0bdd88c28480f1501abe43`.

**Status:** 05B **W TRAKCIE**, nieukończony. Nie scalać z `main` bez pełnej weryfikacji na rzeczywistym grafie Małopolski.

## Przygotowane pliki

- `src/world/roads/routing.ts`: A*/Dijkstra po długościach odcinków, profil furgonu, odczyt maksymalnych parametrów pojazdu oraz `maxspeed`, podstawowe `no_*`/`only_*` dla `via-node`, deterministyczna geometria, dystans, czas i identyfikator trasy; osobne API tras między węzłami lub 19 miastami demo.
- `src/world/roads/position.ts`: interpolacja współrzędnych i kierunku po dystansie albo czasie przejazdu po **tych samych** odcinkach z routingu.
- `src/world/roads/routing.test.ts`: testy na kontrolowanym małym grafie (również restrykcje, profil, pozycja).

## Co sprawdzono tutaj

- `tsc` dla produkcyjnych plików `routing.ts` i `position.ts` razem z istniejącym kontraktem grafu: **OK**, lokalna kopia modeli odpowiadała definicji 05A na GitHubie.
- 9 niezależnych scenariuszy w Node na małym kontrolowanym grafie: **9/9 OK** (A* i Dijkstra, jednokierunkowość, no/only/no_u_turn, konserwatywne via-way, tonaż, deterministyka, próbki pozycji, niedostępna trasa).
- **Nie** uruchomiono jeszcze `npm test`, Playwright ani typecheck całej aplikacji, ponieważ tutaj nie było repozytorium z zależnościami npm i danych grafu 40 MB. Test pliku `routing.test.ts` nie został wykonany przez Vitest.
- Nie wykonano testów prawdziwych tras Kraków–Tarnów itd., benchmarków pamięci / czasu ani pełnej weryfikacji OSM.

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
