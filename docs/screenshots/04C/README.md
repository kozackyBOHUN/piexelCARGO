# Kontrola wizualna mapy 04C

## Przed zmianami — 04C-1

Zrzuty faktycznej aplikacji w Chromium, commit bazowy 217be676ca434fd2a0d730db01f75a0930294f7a, 2026-10-25. JPEG quality 78, bez zmiany geometrii ani mechaniki mapy.

- [Polska, 1366×768](before-country-1366.jpg)
- [Polska, 1920×1080](before-country-1920.jpg)
- [Małopolska, 1920×1080](before-demo-1920.jpg)
- [Kraków, 1366×768](before-krakow-1366.jpg)

Ocena po obejrzeniu czterech obrazów: brak nachodzenia paneli, czytelne przyciski i etykiety, poprawnie wyróżniony wybór Krakowa. Mapa krajowa na laptopie jest niewielka; nie należy pokazywać w niej wszystkich szczegółów. Granice są obecnie mocniejsze niż planowany krajobraz. Brak rzek, lasów i rzeźby terenu — to punkt odniesienia, nie ukończone 04C. Po dodaniu warstw należy zachować jasne znaczniki i ciemny obrys tekstu, stonować granice wewnętrzne i ponownie obejrzeć widoki.

Weryfikacja punktu 04C-1: npm test 52/52, npm run typecheck OK, npm run build OK. Start aplikacji i cztery widoki faktycznie sprawdzone w Chromium.

## Po dodaniu wody — punkt 04C-2 (nie końcowe 04C)

- [Polska, 1366×768](water-country-1366.jpg)
- [Polska, 1920×1080](water-country-1920.jpg)
- [Małopolska, 1366×768](water-demo-1366.jpg)
- [Małopolska, 1920×1080](water-demo-1920.jpg)

Rzeczywiste widoki Chromium, JPEG quality 78. Obrazy krajowy 1920 i Małopolska 1366 obejrzano bezpośrednio: rzeki widoczne, jasne miasta i obrysy tekstu pozostają czytelne; dane wodne nie przejmują kliknięć. Pozostałe dwa kadry także obejrzano; zapisano je do porównania obu rozdzielczości. Brak lasów i rzeźby terenu jest ograniczeniem bieżącego podetapu. Kontrola końcowa kompletnego krajobrazu i osobne widoki gór wymagają dokończenia 04C-3/04C-4.

Pomiar funkcji rysującej wodę: 50 próbek przeciągania dla każdego rozmiaru; mediana 0,2 ms, P95 0,3 ms (1366) i 0,4 ms (1920). To pomiar tej warstwy w bieżącym headless Chromium, nie gwarancja FPS całej aplikacji na fizycznym laptopie.

- [Kraków z hydrografią, produkcyjny Chromium 1366×768](water-krakow-1366.jpg) — także obejrzany, wybrane miasto pozostaje czytelne.

## Finalne 04C — produkcyjny Chromium

Wszystkie poniższe osiem obrazów faktycznie zapisano z buildu produkcyjnego i obejrzano. JPEG quality 82 (około 110–180 kB na plik). To nie są generowane makiety.

| Widok | 1366×768 | 1920×1080 |
| --- | --- | --- |
| Polska w całości | [final-country-1366.jpg](final-country-1366.jpg) | [final-country-1920.jpg](final-country-1920.jpg) |
| Małopolska | [final-demo-1366.jpg](final-demo-1366.jpg) | [final-demo-1920.jpg](final-demo-1920.jpg) |
| Kraków i okolice | [final-krakow-1366.jpg](final-krakow-1366.jpg) | [final-krakow-1920.jpg](final-krakow-1920.jpg) |
| Południe — Tatry i Podhale, 200 m/px | [final-south-1366.jpg](final-south-1366.jpg) | [final-south-1920.jpg](final-south-1920.jpg) |

Ocena wizualna: rzeki w stonowanym błękicie są widoczne na grafitowo-zielonym terenie. Duże kompleksy drzewiaste pozostają przy oddaleniu, drobne plamki są ograniczane, a przybliżenie ujawnia więcej rzeczywistych szczegółów. Granice województw są subtelniejsze niż w punkcie startowym. Jasne miasta i obrys tekstów nie giną na leśnym tle. Kraków i Zakopane zachowują wyraźne podświetlenie. Rzeźba Tatr ma rzeczywiste pasma wysokości, bez ikon umieszczanych losowo; na maksymalnym zoomie celowo widać pikselową siatkę około 0,5 km zamiast udawać dane 10 m. Niziny nie są zasłonięte fikcyjnymi wzgórzami. Nie stwierdzono rozjechania warstw podczas zoomu ani nachodzenia paneli w obu rozmiarach.

Ograniczenie: krajowy kadr 1366 jest z konieczności niewielki, więc szczegóły należy oglądać po przybliżeniu. Powyższa ocena nie oznacza geodezyjnej dokładności lasów, rzek lub szczytów.

Odtworzenie: `npm run build`, uruchom Vite preview na 4173, a następnie `node scripts/capture-map.mjs`. Opcja `--south-only` odtwarza same dwa kadry południowe, bez zastępowania pierwotnego pomiaru.

[Pomiary obu przebiegów](performance.json): jeden Canvas, 124–133 elementy SVG; P95 wykonania funkcji rysującej 0,5–0,9 ms, mediana rAF 16,7 ms. Zachowano też powtórkę z pojedynczą klatką 100 ms — nie deklarujemy gwarantowanego FPS na dowolnym laptopie.

Testy końcowe: **64/64 logiki, 27/27 E2E**, typecheck i build OK, produkcyjny Chromium bez błędów konsoli/runtime podczas przejścia czterech scenariuszy. Baseline 52/23 nie usunięty i nadal przechodzi.
