# PixelCargo 0.1 — FAZA II / ETAP 05
## Rzeczywista sieć drogowa Polski i wyznaczanie tras transportowych

Jesteś programistą rozwijającym istniejącą grę przeglądarkową PixelCargo.

**Repozytorium:** `kozackyBOHUN/piexelCARGO`

**Ostatni ukończony etap:** 04C

**Commit bazowy:** `0700e01692f3feb70ed42ec855779894cfeccdb1`

**Zadanie:** zrealizuj cały etap 05 w czterech kolejnych podetapach: 05A, 05B, 05C i 05D.

Nie twórz nowej aplikacji. Kontynuuj istniejące repozytorium, wykorzystując mapę, projekcję, silnik i dokumentację przygotowane w poprzednich etapach.

## 1. Przygotowanie i zasady główne

Najpierw:

1. Sprawdź `git status`, historię commitów i zgodność z `origin/main`.
2. Przeczytaj `AGENTS.md`, `docs/HANDOFF.md`, `docs/ROADMAP.md` i `docs/MAP_DATA.md`.
3. Przeczytaj oryginalną specyfikację `docs/SPEC_0_1_ORIGINAL.txt`, szczególnie sekcje 3–7 i 19.
4. Zapoznaj się z `src/world/`, `src/ui/PolandMap.tsx`, `src/ui/LandscapeCanvas.tsx` i istniejącą projekcją EPSG:3857.
5. Zaktualizuj `AGENTS.md`, dopuszczając realizację etapu 05.
6. Zapisz niniejszy zakres w `docs/PixelCargo_Etap_05.md`.

**Najważniejszy wymóg:** samochód w przyszłych etapach ma poruszać się po prawdziwej sieci drogowej. Trasa wyznaczona przez algorytm musi być tą samą trasą, którą później wykorzystamy do animacji samochodu, wyliczenia kilometrów, czasu przejazdu oraz zużycia paliwa.

Nie wolno zastępować prawdziwych dróg prostymi liniami między miastami.

W etapie 05 tworzymy infrastrukturę tras, ale **nie uruchamiamy jeszcze symulacji pojazdów, ekonomii ani zleceń**.

## 2. Dane drogowe — OpenStreetMap

Preferowanym źródłem danych jest OpenStreetMap, np. poprzez ekstrakty Geofabrik:

https://download.geofabrik.de/europe/poland.html

Dane źródłowe powinny zawierać rzeczywistą geometrię, połączenia oraz informacje o kierunkach ruchu i ograniczeniach.

Wykorzystaj pliki `.osm.pbf` lub inne odpowiednie, wiarygodne dane umożliwiające budowanie grafu dróg.

Wymagania:

- Bez płatnego API i kluczy.
- Dane drogowe przygotowywane lokalnie na etapie budowania gry.
- W trakcie zwykłej rozgrywki nie pobieramy tras z Google Maps, Mapbox, OSRM ani innych serwerów.
- Działa to w przeglądarce, bez obowiązkowego backendu.
- Zapisz źródła, datę danych, licencję ODbL, wymagane oznaczenia OpenStreetMap oraz sposób odtworzenia grafu.
- Zweryfikuj obowiązki dotyczące rozpowszechniania przetworzonej bazy OSM i zapewnij odpowiedni dostęp do informacji licencyjnych.
- Użyj przypiętej migawki danych lub zweryfikowanej sumy kontrolnej, żeby proces był powtarzalny.

Nie commituj do repozytorium wielogigabajtowych plików źródłowych.

W repozytorium powinny znaleźć się zoptymalizowane zasoby potrzebne grze oraz narzędzia ich regeneracji.

Jeśli pobranie danych jest zablokowane, zapisz konkretny błąd. Nie generuj fikcyjnych dróg.

## 3. PUNKT 05A — rzeczywista sieć drogowa Małopolski

Najpierw przygotuj graf drogowy dla obecnego obszaru demonstracyjnego, gdzie mamy 19 miast.

### Wymagane dane

Uwzględnij rzeczywiste:

- autostrady i drogi ekspresowe;
- drogi krajowe;
- drogi wojewódzkie;
- istotne drogi powiatowe i lokalne niezbędne do połączenia miast;
- łącznice i węzły drogowe;
- mosty, tunele i przejazdy wymagające prawidłowej topologii.

Dane szczegółowych ulic mogą być potrzebne do wyznaczania trasy, ale nie muszą być wszystkie widoczne na mapie gry.

### Graf drogowy

Przygotuj model zawierający:

- stabilne identyfikatory węzłów;
- rzeczywiste współrzędne;
- połączenia skierowane;
- rzeczywistą długość odcinka;
- klasę drogi;
- dostępność dla samochodu;
- informację o kierunku ruchu;
- dostępne ograniczenia prędkości i dostępu;
- geometrię drogi potrzebną do wyświetlenia przejazdu.

Połączenia twórz na podstawie prawdziwej topologii OSM, a nie samego przecięcia linii na ekranie.

Drogi przebiegające nad sobą na estakadach lub w tunelach nie mogą być automatycznie łączone.

Uwzględnij oznaczenia `oneway`, `access`, `vehicle`, `motor_vehicle` i inne istotne dla ruchu drogowego.

Nie dopuszczaj do przejazdu samochodem po ścieżkach pieszych, rowerowych ani drogach wyłączonych z normalnego ruchu.

Przygotuj również miejsce na ograniczenia masy, wysokości i szerokości pojazdu.

### Zakres testowy

Sprawdź rzeczywiste połączenia między miastami:

- Kraków — Tarnów;
- Kraków — Zakopane;
- Kraków — Nowy Sącz;
- Kraków — Oświęcim;
- Tarnów — Nowy Sącz;
- Nowy Targ — Zakopane.

Połączenia powinny wykorzystywać istniejące drogi. Nie twórz sztucznych skrótów.

### Kryteria ukończenia 05A

- Istnieje prawdziwy graf drogowy obszaru demo.
- Miasta są przypięte do dostępnej sieci drogowej.
- Można sprawdzić, czy dwa węzły są połączone.
- Zachowano kierunki ruchu.
- Dane mają udokumentowane pochodzenie.
- Generator i testy działają.

Nie zaczynaj rysowania fikcyjnych tras na mapie.

Po zakończeniu uruchom testy, zaktualizuj HANDOFF i wykonaj osobny commit.

## 4. PUNKT 05B — algorytm wyznaczania tras

Zaimplementuj lokalny silnik routingu.

### Podstawowy algorytm

Użyj A* lub innego odpowiedniego algorytmu najkrótszej ścieżki, np. Dijkstry jako wariantu referencyjnego w testach.

Zgodnie ze specyfikacją głównym kryterium wyboru ma być **najkrótsza dostępna trasa drogowa według rzeczywistej długości**.

Nie zastępuj tego kryterium automatycznie trasą najszybszą.

Algorytm musi:

1. Przyjąć miasto początkowe i docelowe.
2. Znaleźć dostępne połączenia z siecią.
3. Wyznaczyć najkrótszą dozwoloną trasę.
4. Uwzględnić drogi jednokierunkowe.
5. Uwzględnić ograniczenia dostępu dla pojazdu.
6. Obsłużyć rzeczywiste ograniczenia skrętów OSM, przynajmniej podstawowe `no_*` i `only_*`, tam gdzie występują w danych; ograniczenia niewspierane dokumentować, nie ignorować po cichu.
7. Zwrócić pełny przebieg trasy po odcinkach drogowych.
8. Wyliczyć łączną liczbę kilometrów.
9. Oszacować czas jazdy.
10. Zgłosić brak dostępnej trasy, jeśli nie istnieje połączenie.

Nie twórz fikcyjnego odcinka drogowego, jeśli miasto nie znajduje się dokładnie na węźle. Zastosuj rzeczywiste przypięcie do najbliższej odpowiedniej drogi i jawnie oddziel ewentualne wizualne dojście od przejezdnej części trasy.

### Obliczanie czasu przejazdu

Czas powinien wynikać z długości odcinków i prędkości.

Przygotuj profile prędkości dla klas dróg, wykorzystując dostępne oznaczenia ograniczeń prędkości.

Jeśli dane prędkości są niekompletne, zastosuj jawnie opisane, konfigurowalne wartości zastępcze. Nie prezentuj ich jako rzeczywistych pomiarów.

Przygotuj mechanizm przyjmowania profilu pojazdu.

Na razie wystarczy profil demonstracyjny zwykłego furgonu, bez tworzenia aktywnego samochodu ani jego ekonomii.

### Wynik wyznaczenia trasy

API powinno zwracać co najmniej:

- identyfikator trasy;
- identyfikatory źródła i celu;
- uporządkowaną listę węzłów i odcinków;
- pełną geometrię trasy;
- długość w metrach;
- szacowany czas jazdy;
- informację o zastosowanym profilu pojazdu;
- wersję danych drogowych;
- komunikat błędu, jeżeli trasa nie istnieje.

Geometria musi nadawać się do przyszłej animacji samochodu po odcinkach, bez ponownego wyznaczania niezależnej trasy.

### Ważne

Nie dodawaj do `GameState` fikcyjnych przejazdów.

Nie zmieniaj schematu zapisów gry bez realnej potrzeby.

Routing jest na razie niezależną usługą świata gry, z której skorzystamy przy zleceniach i harmonogramie.

### Testy 05B

Dodaj testy:

- poprawnej długości;
- odcinków jednokierunkowych;
- zakazów skrętu;
- braku połączenia;
- identycznego wyniku przy identycznych danych;
- prawidłowej kolejności węzłów;
- zgodności geometrii z długością trasy;
- rozsądnych czasów przejazdu;
- zgodności A* z algorytmem referencyjnym na kontrolowanych grafach;
- braku przejazdu poza granicami Polski.

Nie wpisuj ręcznie oczekiwanego wyniku tylko po to, aby test przeszedł. Porównaj wybrane przebiegi z rzeczywistą siecią drogową.

Po zakończeniu uruchom testy, zaktualizuj HANDOFF i wykonaj osobny commit.

## 5. PUNKT 05C — wizualizacja dróg i tras na mapie

Rozbuduj istniejący widok `PolandMap.tsx`.

Nie buduj drugiej mapy.

### Warstwa drogowa

Dodaj graficzną warstwę rzeczywistych dróg.

Styl:

- grafitowa mapa PixelCargo;
- autostrady i ekspresówki wyróżnione;
- drogi krajowe nieco mniej wyraziste;
- wojewódzkie i lokalne subtelniejsze;
- czytelne miasta i granice;
- bez szczegółowych ulic miejskich w zwykłym widoku gry.

Poziom szczegółowości musi zależeć od zoomu.

Przy dalekim widoku pokazuj tylko najważniejsze szlaki. Przy przybliżeniu kolejne klasy dróg.

**Uwaga:** ograniczenie liczby widocznych dróg nie może ograniczać rzeczywistego grafu routingu.

Drogi powinny być rysowane nad krajobrazem, lasami i wodą, ale pod znacznikami miast, etykietami oraz podświetlonymi trasami.

Wykorzystaj Canvas lub inne wydajne rozwiązanie pasujące do obecnej architektury. Nie wprowadzaj niepotrzebnie tysięcy elementów React/SVG.

### Panel demonstracyjnego planowania trasy

Dodaj prosty moduł „Wyznacz trasę”.

Powinien pozwalać:

1. Wybrać miasto początkowe.
2. Wybrać miasto docelowe.
3. Kliknąć „Wyznacz trasę”.
4. Zobaczyć przebieg na mapie.
5. Zobaczyć dystans w kilometrach.
6. Zobaczyć szacowany czas przejazdu.
7. Wyczyścić podgląd trasy.

Na razie lista miast w UI obejmuje istniejące 19 miast demonstracyjnych.

Ten moduł ma być funkcjonalnym narzędziem testowym mapy, a nie fikcyjnym rynkiem zleceń.

Wybór trasy nie tworzy zlecenia, nie kosztuje pieniędzy i nie rozpoczyna ruchu pojazdu.

### Podświetlanie trasy

Wyznaczona trasa musi dokładnie pokrywać się z przebiegiem rzeczywistych dróg.

Nie łącz kolejnych miast prostymi liniami.

Wyświetl kierunek od miasta początkowego do docelowego.

Wyróżnij oba miasta.

Dodaj przycisk dopasowania widoku do trasy, z zachowaniem istniejących ograniczeń mapy.

### Powiększenie obszaru mapy

Po kontroli etapu 04C stwierdzono, że krajowy widok mapy jest niewielki na laptopie.

Dodaj opcjonalny przycisk **„Powiększ mapę”**.

Preferowane zachowanie:

- mapa otrzymuje więcej miejsca w oknie;
- harmonogram może zostać zwinięty na czas oglądania mapy;
- użytkownik może przywrócić zwykły układ;
- nie znika możliwość obsługi pozostałych paneli;
- zegar gry działa nieprzerwanie;
- wszystkie warstwy i znaczniki pozostają poprawnie ustawione po zmianie rozmiaru.

Nie przebudowuj całego interfejsu, jeżeli wystarczy niewielka zmiana istniejącego układu.

### Testy 05C

Sprawdź:

- drogę faktycznie pokrywającą się z wyznaczoną trasą;
- zoom i przesuwanie;
- zachowanie warstw przy zmianie kadru;
- czytelność przy 1366×768 i 1920×1080;
- powiększony i zwykły widok mapy;
- brak regresji wyboru miast i wyszukiwarki;
- brak fikcyjnego uruchamiania pojazdów;
- utrzymanie działania zegara i zapisów.

Przygotuj zrzuty ekranów pokazujące drogi i kilka wyznaczonych tras.

Po zakończeniu uruchom testy, zaktualizuj HANDOFF i wykonaj osobny commit.

## 6. PUNKT 05D — sieć drogowa całej Polski

Rozszerz routing z Małopolski na cały kraj.

Wymagania:

- Rzeczywiste drogi wszystkich 16 województw.
- Ciągłe połączenia między województwami.
- Poprawne łączenie dróg przy granicach regionów.
- Obsługa dróg ekspresowych i autostrad.
- Mosty i tunele zgodne z rzeczywistą topologią.
- Prawidłowe kierunki ruchu.
- Brak korzystania z dróg zagranicznych przy planowaniu tras krajowych.
- Brak sztucznego łączenia odległych dróg w celu uzyskania spójnego grafu.

Możesz wykorzystać jeden ekstrakt krajowy OSM albo poprawnie połączone ekstrakty wojewódzkie.

Przy scalaniu musisz zachować oryginalne identyfikatory OSM, węzły współdzielone na granicach oraz rzeczywiste połączenia.

Jeżeli jakaś lokalna droga jest niedostępna lub urwana w źródle, oznacz ten problem. Nie naprawiaj go fikcyjnym odcinkiem.

### Rozmiar danych i optymalizacja

Dane całej Polski mogą być duże.

Zaprojektuj efektywny sposób przechowywania i ładowania grafu:

- kompaktowy format;
- indeks przestrzenny;
- możliwość ładowania odpowiednich części danych;
- oddzielenie geometrii wizualnej od grafu routingu;
- kontrola zużycia pamięci;
- brak blokowania interfejsu podczas długich obliczeń;
- cache wyników tam, gdzie ma to sens.

Rozważ Web Worker dla ciężkiego wyznaczania tras.

Nie wprowadzaj nowego backendu tylko dlatego, że jest wygodniejszy.

Zwykła gra ma nadal działać lokalnie w przeglądarce.

Zmierz faktyczny rozmiar danych, czas ich wczytywania i czas wyszukiwania tras. Podaj wyniki, zamiast deklarować wydajność bez pomiaru.

### Testy tras ogólnopolskich

Przetestuj m.in.:

- Warszawa — Kraków;
- Warszawa — Gdańsk;
- Wrocław — Poznań;
- Kraków — Rzeszów;
- Białystok — Lublin;
- Szczecin — Gdańsk;
- Lublin — Sokołów Podlaski.

W tych testach możesz wykorzystywać rzeczywiste współrzędne miast z wiarygodnego źródła jako punkty testowe routingu.

Nie oznacza to automatycznie dodania tych miast do katalogu gry.

Pełny katalog miast powiatowych, ich ludności oraz limitów zleceń wymaga osobnego etapu. Nie twórz na tym etapie fikcyjnych danych demograficznych.

### Kryteria ukończenia 05D

- Dostępny jest działający graf drogowy całej Polski.
- Istnieje routing pomiędzy odległymi regionami.
- Drogi nie urywają się sztucznie na granicach województw.
- Wybierane trasy pozostają na terenie Polski.
- Podgląd trasy korzysta z tych samych danych co algorytm.
- Wczytywanie i obliczenia są odpowiednio zoptymalizowane.
- Wszystkie dane i ich źródła są udokumentowane.

## 7. Wspólna architektura przyszłych transportów

Przygotuj interfejsy pozwalające przyszłej symulacji:

- pobrać wyznaczoną trasę;
- poznać jej pełną długość;
- uzyskać kolejne odcinki drogowe;
- poznać długości i czasy poszczególnych odcinków;
- ustalić położenie na trasie na podstawie przejechanego dystansu;
- uzyskać współrzędne i orientację przyszłego samochodu.

Nie implementuj obecnie ruchu samochodu.

Przyszły moduł symulacji musi korzystać z tych danych, a nie z własnego niezależnego algorytmu.

Trasa ma być deterministyczna dla tej samej wersji sieci i profilu pojazdu.

## 8. Zachowanie istniejącego PixelCargo

Nie naruszaj działających mechanizmów:

- centralnego zegara, 1 sekunda rzeczywista = 1 minuta gry;
- startu w poniedziałek o 06:00;
- zapisu IndexedDB;
- importu i eksportu;
- autosave;
- blokady równoległych kart;
- deterministycznego RNG;
- obecnego układu siedmiu zakładek;
- danych mapy, miast, lasów, jezior, rzek i gór;
- przeciągania mapy i zoomu;
- skali odległości;
- obecnego stylu pixel art.

Nie dodawaj pauzy ani przyspieszania do normalnej gry.

Nie uruchamiaj ekonomii i nie zapisuj demonstracyjnego planowania trasy jako rzeczywistego transportu.

## 9. Dokumentacja

Utwórz:

`docs/ROAD_DATA.md`

Powinien zawierać:

- źródła OSM;
- informacje o licencji;
- datę i wersję ekstraktu;
- sumy kontrolne;
- reguły filtrowania dróg;
- reguły dostępu i kierunków ruchu;
- sposób tworzenia grafu;
- znane ograniczenia, zwłaszcza danych i restrykcji;
- instrukcję regeneracji;
- informacje o danych kraju i regionu demo;
- statystyki liczby węzłów i krawędzi;
- rozmiar danych i pomiary wydajności.

Zaktualizuj także istniejącą stronę „Źródła i licencje”.

## 10. Testy końcowe

Po każdym podetapie przeprowadzaj testy adekwatne do aktualnego zakresu.

Po zakończeniu całego etapu 05 obowiązkowo wykonaj:

`npm test`

`npm run typecheck`

`npm run build`

`npm run test:e2e`

Ponadto sprawdź wersję produkcyjną w Chromium.

Punkt startowy zawierał **64 testy logiki i 27 przeglądarkowych**. Nie usuwaj wcześniejszych testów w celu uzyskania zielonego wyniku.

Dodaj nowe testy grafu, routingu, zgodności geometrii i widoku mapy.

Weryfikacja musi obejmować przypadki błędne, brakujące dane, trasy niemożliwe oraz ograniczenia ruchu.

Zapisz zrzuty rzeczywistej aplikacji w:

`docs/screenshots/05/`

Przygotuj przynajmniej widok sieci w Małopolsce, trasę Kraków–Tarnów, trasę Kraków–Zakopane i przykład trasy ogólnopolskiej.

## 11. Praca z limitem Codexa

To duży etap. Nie próbuj wykonywać wszystkiego w jednym nieprzerwanym przebiegu bez zapisywania postępu.

Wykonuj dokładnie:

**05A → testy → HANDOFF → commit**

**05B → testy → HANDOFF → commit**

**05C → testy → HANDOFF → commit**

**05D → testy → HANDOFF → commit**

Po każdym ukończonym podetapie wyślij commit na GitHub, pod warunkiem że zdalna historia jest zgodna i nie występuje konflikt. Nie używaj force-push.

Nie oznaczaj etapu jako ukończonego, dopóki jego rzeczywiste kryteria nie przejdą.

Jeżeli zbliżasz się do limitu, zatrzymaj się na bezpiecznym punkcie kontrolnym.

Przed zakończeniem aktualnej sesji uzupełnij `docs/HANDOFF.md`:

- ostatni ukończony podetap;
- obecny commit;
- wykonane funkcje;
- wyniki testów;
- niedokończone zadania;
- ewentualne blokady;
- instrukcję wznowienia.

Następna sesja powinna kontynuować istniejącą pracę, a nie powtarzać ukończone etapy.

Jeśli pełna sieć Polski okaże się niemożliwa do przygotowania w dostępnym środowisku, zachowaj działające ukończone podetapy, udokumentuj ograniczenie i nie deklaruj zakończenia 05D.

## 12. Raport końcowy

Po zakończeniu etapu 05 podaj:

1. Status 05A, 05B, 05C i 05D.
2. Wyniki wszystkich testów.
3. Liczbę węzłów i odcinków drogowych.
4. Źródła i daty danych.
5. Przykładowe trasy z rzeczywistymi kilometrami i szacowanym czasem.
6. Wyniki pomiarów wydajności.
7. Rozmiary danych.
8. Linki lub ścieżki zrzutów ekranu.
9. Hash ostatniego commita.
10. Potwierdzenie synchronizacji `main` z GitHubem.
11. Ewentualne ograniczenia oraz dokładny stan pozostałych zadań.

Zaktualizuj README, ROADMAP i HANDOFF.

**Nie rozpoczynaj etapu 06 bez mojego następnego polecenia.**

## CEL KOŃCOWY

Chcę mieć rzeczywistą sieć dróg Polski, po której w przyszłości będą jeździły samochody PixelCargo.

Gracz wybierze dwa miasta, a gra wyznaczy prawdziwy przebieg najkrótszej dozwolonej trasy, pokaże go na mapie oraz poda kilometry i czas przejazdu.

Późniejsza symulacja będzie wykorzystywała dokładnie ten sam przebieg drogi.

Nie akceptuję tras w linii prostej, fikcyjnych połączeń ani jedynie graficznej imitacji systemu transportowego.

Priorytety: **prawdziwa geografia, poprawny routing, wydajność i zgodność z istniejącym PixelCargo 0.1.**