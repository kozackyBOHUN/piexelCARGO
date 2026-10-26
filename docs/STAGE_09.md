# Etap 09 — Małopolska i planowane postoje

Baza: `367d153ef5403ddcf92ddd4e4d30b5b8ff7f5bce`. Zakres źródłowy w `docs/etap09/`. Zmiany wyłącznie na `feat/preview-gameplay-core`; wcześniejsze lokalne szkice pozostają w dawnych worktree.

## Sieć drogowa

Źródło: dostarczona paczka `data/sources/etap09.zip`, graf OSM `05A-v1-a0575a3f5bd99f19-98733c38` z `public/roads/demo/graph.json.gz`, SHA-256 `e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f`. © OpenStreetMap contributors, ODbL 1.0. Kod gry zachowuje dotychczasową licencję. Nie uruchamiano generatora OSM ani ponownego wyznaczania tras w pełnym grafie.

Audyt `node scripts/verify-routes09.mjs` najpierw sprawdza integralność paczki, następnie odtwarza każdą dostarczoną geometrię jako jednoznaczny łańcuch rzeczywistych kierunkowych krawędzi. Kontroluje dostęp, wymiary, warunki, źródłową geometrię, dystans/czas oraz restrykcje niezależnym audytorem z etapu 08.

- **75/86** kierunkowych odcinków dopuszczonych. 11 odrzuconych: niejednoznaczne dopasowanie geometrii, rzeczywiste zakazy skrętu (m.in. 3420948), warunkowe drogi i nierozstrzygnięte ograniczenia. Szczegóły każdego odrzucenia: `docs/reports/09-routes.json`.
- **18 miast, 306/306 relacji** wyznaczonych jako najkrótsze legalne łańcuchy dopuszczonych odcinków. Nie przechowujemy 306 osobnych geometrii.
- 43 stany sieci pamiętają wejściową krawędź oraz aktywne restrykcje via-way. Granica miasta nie zeruje historii manewru. Każda z 306 wynikowych pełnych tras została ponownie poddana niezależnemu audytowi 08, również na granicach odcinków; 0 naruszeń.
- Oświęcim: potwierdzony źródłowy node **599998162**, 38,7 m od starego. Zmieniono wyłącznie snap w pamięci audytu i nowej sieci. Graf źródłowy i geograficzne położenie miasta nie są zmieniane.
- Gorlice **wyłączone**. Brak potwierdzonych czterech kierunków z/do Tarnowa i Nowego Sącza. Nie dopisano dróg.
- Poprzednie **135** zatwierdzonych kierunków w `public/roads/preview/routes.json` pozostaje bez zmian, jako katalog awaryjny i obsługa zapisanych starych przewozów.

Runtime pobiera `roads/county/links.json` (~2,7 MB) i `network.json` (~28 KB). Dijkstra działa na małej, przygotowanej sieci stanów; geometria powstaje dopiero na żądanie przez sklejenie rzeczywistych punktów sąsiednich odcinków. Metadane ofert nie materializują geometrii. Pełny graf nigdy nie jest pobierany przez grę. Fallback przy niedostępności nowej sieci korzysta ze starego katalogu 135 tras.

## Mechaniki i zapis

`mechanics09.ts` zawiera jawne parametry, `simulation09.ts` deterministyczne przejścia, `planning09.ts` planowanie i prognozę ETA. Jedynym czasem pozostaje `GameRuntime.session.time` przez `PreviewSession`, 1 s rzeczywista = 1 min gry. Prognoza osi to czysta symulacja kopii, nie drugi zegar.

Kredyt: limit niespłaconego kapitału 20 000 zł; spłata 1000 zł / wybranej kwoty / całości i ponowne pobranie wolnego limitu w każdej fazie. Historia zapisuje przepływy, podsumowanie operacyjne wyklucza kapitał. Każda przekroczona północ nalicza raz 1% aktualnego kapitału, do grosza, bez kapitalizacji i bez pustego wpisu przy zerowym długu.

Kierowca: licznik wyłącznie faktycznej jazdy, bez załadunku, postoju czy snu. Do 12 h bez kary; -2 zadowolenia za pełną nadgodzinę po 12 h; przy 16 h dodatkowe -10 i 15 h obowiązkowego snu. Dobrowolny sen trwa 10 h. Zakończony pełny odpoczynek zeruje licznik jazdy, ale nie usuwa historii zadowolenia. Wynagrodzenie 25 zł za pełną płatną godzinę, sen wyłączony; ułamki płatnego czasu przenoszą się między okresami pracy.

Tankowanie: przyszły punkt 5–30 km po aktualnej geometrii, deterministyczny wybór; brak potwierdzonych POI stacji — jest to punkt usługi w grze na rzeczywistej drodze, zgodnie ze specyfikacją 09. Brak paliwa na dojazd albo mniej niż 5 km do celu blokuje plan. Postój 15 min, auto pozostaje w miejscu, zakup i koszt 7,50 zł/l rozliczane raz na końcu. Bak maks. 80 l. Brak środków na końcu oznacza nieudany zakup, bez paliwa i bez opłaty. Dotychczasowe tankowanie w mieście także wymaga 15 min postoju. Nie dodano płatnego dowozu paliwa; brak paliwa w trasie zatrzymuje pojazd i pokazuje wyjaśnienie.

Przyszłe postoje można przesuwać po osi lub formularzem i usuwać. Rozpoczęte/przeszłe pozostają zablokowane. Odpoczynek/tankowanie opóźnia rzeczywiste fazy, ETA i kolejne postoje. Kompaktowy wiersz zachowuje trzy presety, uchwyt wysokości, obserwowany samochód i trwałe preferencje. Paski energii/paliwa i status zastępują tabelę procentowego postępu. TERAZ pozostaje na 25% osi.

Nowe pola zapisu są opcjonalne (`driverState`, `stops`, `service`, `activityLog`). Stary zapis zachowuje firmę, saldo, wynagrodzenia, czas i bieżący przewóz. Ponieważ stary format nie rejestrował rzeczywistej jazdy ani snu, przy migracji nie wymyślamy przeszłego zmęczenia: licznik rozpoczyna się od zera, satysfakcja 100; już naliczone pensje pozostają. Nowe zapisy przechowują pełny stan postoju i fazy oraz historię wykonania. Klucz localStorage i IndexedDB bez zmian, bez postępu offline.

## Ograniczenia

To regionalne preview z jednym samochodem; nie dodano nowych modeli ani kierowców. Gorlice i 11 odrzuconych odcinków nie są aktywne. Brak płatnego ratowania pojazdu bez paliwa. Dotychczasowa kontrola paliwa przed rozpoczęciem całego kursu pozostaje zachowana. Audyt jest konserwatywnym dowodem zgodności ze wskazaną migawką lokalnego grafu, nie gwarancją aktualnej przejezdności rzeczywistych dróg. Nie poprawiano niekompletnych relacji OSM.

## Kontrola

Polecenia: `npm run typecheck`, `npm test`, `npm run build`, `npm run build:pages`, `npx playwright test --config playwright.stage09.config.ts`, `npx playwright test --config playwright.pages.config.ts` oraz offline `node scripts/verify-routes09.mjs`. Wyniki końcowe zapisane w HANDOFF.

Rozmiary nieskompresowane: links.json 2 785 338 bajtów, network.json 25 130 bajtów.
SHA-256 links: `b5aede7298510c228dd80f2386959c31f471da34c00fac624c0e79526ff57b08`;
network: `01fb1eadd71e77e7225c5241d77e1c5ba4aacd018453792538f9761cdaf159d7`.
