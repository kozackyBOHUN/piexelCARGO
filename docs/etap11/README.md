# PixelCargo 11 - NAPRAWA ROUTINGU MAŁOPOLSKI

**Cel: powtarzalna naprawa objazdów bez zastępowania dróg prostymi liniami.**

Repo: `kozackyBOHUN/piexelCARGO`, gałąź `feat/preview-gameplay-core`, źródłowy commit `92ff5c46eaa334f6ad6f7ec6ab03bb1bafe32d25`.

## Co naprawdę zawiera paczka

- **19 miast powiatowych**, unikalnych siedzib, 45 **ponumerowanych par** połączeń planistycznych (nr 01-45), stan obydwu kierunków.
- **134 pełne geometrie OSM** odnalezione w archiwalnym pakiecie spośród **135 historycznie zatwierdzonych w etapie 08**. Brakująca 135. trasa ma końcówkę ID `464cc1df`: jest w autorytatywnym `public/roads/preview/routes.json` w repozytorium; NIE odtwarzamy jej na ślepo.
- **75 pełnych geometrii kierunkowych odcinków** zgodnych z zaakceptowanymi ID z audytu 09 i **11 odrzuconych** zachowanych wyłącznie do diagnozy.
- **324 stare pełne geometrie kandydackich przejazdów miasto → miasto** z etapu 05B. ŻADNE z nich nie są zatwierdzone samym faktem umieszczenia w tej tabeli.
- **35 kandydatów do/z Gorlic**, w tym cztery szczególnie obiecujące odcinki w obie strony do Tarnowa i Nowego Sącza.
- **Nową analizę tych czterech tras** wykonaną na lokalnym grafie OSM: geometria i kierunkowe segmenty pasują do źródła, brak wykrytych prostych naruszeń via-node, żadna z czterech nie dotyka via-way; na Tarnów → Gorlice jest tag `maxgvweightrating:hgv:conditional` na way `25092944`. To nie zastępuje pełnego audytu access + turn restrictions.
- **Gotowy program Node.js** `scripts/build_preferred_catalog.mjs`, który bez żadnego ponownego routingu potrafi zebrać **135 autorytatywnie zatwierdzonych w etapie 08 tras oraz 306 audytowanych w etapie 09**. Wylicza dla każdej pary krótszą trasę, kontroluje ciągłość polilinii, długości i certyfikaty, a **blokuje pełną publikację przy braku choć jednej z 342 relacji**.
- Listę regresji `qa/priority_route_baselines.json`, listę testów i polecenie dla Codexa.

## Dlaczego jest problem?

`src/preview/countyRouter.ts` uruchamia Dijkstrę po **wybranych 75 odcinkach**. Brak krótkiej krawędzi Kraków → Wieliczka, mimo że osobny **wcześniej audytowany** przebieg 14,1 km istnieje w etapie 08. W efekcie po 09 gra wymusza objazd przez Wadowice (102,6 km). Przykłady: Kraków → Zakopane 146,0 km zamiast 103,6 km, Kraków → Myślenice 88,7 zamiast 30,3 km.

To nie jest błąd współrzędnych sprite'a. Trzeba uzupełnić WYBÓR drogi oraz samą sieć.

## Dwa progi wykonania

**KROK A - bez regresji 18 miast (w pełni samodzielny):**

1. Checkout dokładnie wskazanego źródła. Użyj repozytoryjnych `docs/reports/08-routes.json`, `docs/reports/09-routes.json`, `public/roads/preview/routes.json`, `public/roads/county/links.json` i rzeczywistego `public/roads/demo/graph.json.gz`.
2. Wypakuj skrypt z tej paczki do roboczej lokalizacji (np. `/tmp/route-recovery11/build_preferred_catalog.mjs`), uruchom `node /tmp/route-recovery11/build_preferred_catalog.mjs --project . --allow-18-regression-fix`. Skrypt NIE dotyka plików produkcyjnych - zapisuje wyjście do `tmp/route-recovery11/` w repo.
3. Dla 135 wcześniej sprawdzonych par użyj minimum z 08 i 09 (lub nowego audytowanego wariantu). Dla pozostałych 171 spośród 306 - bezpieczny wariant z 09. **Obowiązkowo dokładne 306/306** i **ani jednej trasy dłuższej niż zatwierdzona w 08**.
4. Zmień runtime tak, aby korzystał z tego wybranego katalogu: NIE pozostawiaj 08 jedynie jako fallbacku uruchamianego w razie HTTP 404. Wdrażaj z aktualizacją cache oraz testami produkcyjnymi.

**KROK B - pełne 19 miast, FINAL 342/342:**

1. Niezależnie skontroluj wskazane cztery wejścia do/z Gorlic, następnie zapewnij **wszystkie 36 par z Gorlicami**. Sprawdzaj każdy łańcuch skrętów i OSM access na całej trasie, również po sklejeniu kilku odcinków. Część tagów `*:hgv:conditional` może nie dotyczyć profilu furgonu 3,5 t; rozstrzygnij to prawidłową logiką prawną danego taga, NIE globalnym ignorowaniem `:conditional`.
2. W pierwszej kolejności wykorzystaj pełne źródłowe geometrie z tej paczki i 45 odcinków. Jeśli brakuje legalnego wariantu, uruchom istniejący router 05B na lokalnym grafie. Nie wolno stworzyć sztucznej drogi, odwrócić geometrii bez kontroli ani dopuścić nieznanych warunków.
3. Wyznacz niezależnie kandydackie najkrótsze OSM trasy dla **wszystkich 342 kierunków**, nie tylko 45 połączeń powiatowych. Poprawnie obsłuż obwodnice i węzły autostradowe omijające centra miast. Porównaj drogę wybraną przez katalog ze zweryfikowanym optimum po rzeczywistym grafie. Jeżeli odstęp >5% - analizuj i wybierz legalną krótszą drogę; dopuszczaj tylko po pełnym audycie. W razie rozbieżności profilu/warunków: raportuj wyjątek zamiast „zaliczyć test” fikcyjnymi metrami.
4. Wydaj `docs/reports/11-route-acceptance.json` z **342 szczegółowymi wynikami**, długością, ETA, ID krawędzi, skrętami, hashami danych i porównaniem 08/09. Brak choć jednego kompletnego certyfikatu = **FULL NOT COMPLETE**.
5. Przetestuj na GitHub Pages, że uruchomiona produkcyjna gra korzysta z nowego katalogu (test wymuszonego odświeżenia, bez starego cache), nie starej sieci 09. Pełna dostawa i powrót z każdego z 19 miast.

## Ważne granice uczciwości

- Niniejsza paczka jest **gotowym wkładem danych i skryptów naprawczych**, ale **NIE jest jeszcze certyfikatem, że 19/19 działa optymalnie**. Gorlice wymagają niezależnego dopuszczenia.
- Połączenie dwóch legalnych odcinków wymaga odrębnej kontroli zakazu skrętu **na ich styku**. Nie składać w ciemno geometrii po samym mieście.
- Dane OSM opisują migawkę 2026-10-24, nie roboty drogowe i aktualne prawo w czasie rzeczywistym.
- Nazwy 45 odcinków są **schematem planistycznym**, nie gwarancją globalnie najkrótszej trasy z miasta A do B.

## Start

`python3 qa/verify_bundle.py` - lokalna integralność ZIP, nie audyt OSM.

`node scripts/build_preferred_catalog.mjs --project /path/to/repo --allow-18-regression-fix` - naprawa regresji 18 miast z autorytatywnych audytów repozytorium.

`node scripts/build_preferred_catalog.mjs --project /path/to/repo --strict19 --audited11 /path/to/nowe_prawdziwie_zweryfikowane_trasy.json` - bramka finałowa 342/342, jeśli niezależny audyt nowo znalezionych tras się powiedzie.

© OpenStreetMap contributors, ODbL 1.0. https://www.openstreetmap.org/copyright
