# PixelCargo 0.1 — FAZA II / ETAP 04C
## Krajobraz Polski, oprawa pixel art i optymalizacja mapy

Kontynuuj rozwój gry PixelCargo w istniejącym repozytorium:

`kozackyBOHUN/piexelCARGO`

Ostatni ukończony etap: **04B**.

Commit bazowy: `217be676ca434fd2a0d730db01f75a0930294f7a`.

**Nie twórz nowej aplikacji. Nie usuwaj istniejących funkcji. Rozwijaj aktualny kod.**

## 1. Przygotowanie

Przed rozpoczęciem:

1. Sprawdź aktualną gałąź Git i stan repozytorium.
2. Przeczytaj `AGENTS.md`, `docs/HANDOFF.md`, `docs/ROADMAP.md`, `docs/MAP_DATA.md`.
3. Przeczytaj sekcje 3, 4, 5 i 19 oryginalnej specyfikacji PixelCargo 0.1.
4. Sprawdź istniejące komponenty mapy, projekcję geograficzną i system warstw.
5. Zaktualizuj `AGENTS.md` do aktualnego zakresu 04C.

Nie modyfikuj oryginalnej specyfikacji gry.

## 2. Punkt 04C-1 — kontrola wizualna obecnej mapy

Przed zmianami graficznymi uruchom aktualną aplikację i wykonaj zrzuty ekranu:

- Cała Polska — rozdzielczość 1366 × 768.
- Cała Polska — rozdzielczość 1920 × 1080.
- Przybliżenie województwa małopolskiego.
- Przybliżenie okolic Krakowa.

Oceń czytelność paneli, mapy, etykiet i przycisków.

Zapisz reprezentatywne zrzuty w dokumentacji projektu, aby można je było obejrzeć również po zakończeniu sesji Codexa.

Nie deklaruj pozytywnej oceny wizualnej bez faktycznego sprawdzenia aplikacji w przeglądarce.

Nie zmieniaj jeszcze mechaniki mapy.

## 3. Punkt 04C-2 — rzeczywiste rzeki i zbiorniki wodne

Dodaj warstwę hydrograficzną Polski.

Wymagania:

- Rzeczywisty przebieg głównych rzek Polski, m.in. Wisły, Odry, Warty, Bugu, Narwi, Sanu, Dunajca i Pilicy.
- Istotne dopływy i mniejsze rzeki tam, gdzie pozwalają dostępne dane.
- Rzeczywiste jeziora i większe zbiorniki wodne.
- Prawidłowe rozmieszczenie geograficzne.
- Stopniowe ujawnianie szczegółów przy przybliżaniu.

Nie rysuj fikcyjnych rzek i jezior.

Wykorzystaj wiarygodne dane geograficzne. Preferuj lokalne, przygotowane wcześniej zasoby, bez konieczności pobierania danych podczas rozgrywki.

Dane mają być uproszczone na potrzeby gry, jednak bez istotnego zniekształcania przebiegu najważniejszych rzek.

### Wygląd

- Woda w odcieniach przygaszonego błękitu i granatu.
- Estetyka starych gier strategicznych.
- Możliwie pikselowy charakter krawędzi.
- Bez realistycznych tekstur fotograficznych.
- Główne rzeki wyraźniejsze od małych cieków.
- Przy widoku całej Polski mapa nie może być przeładowana szczegółami.

Warstwa wody nie może utrudniać wybierania miast.

## 4. Punkt 04C-3 — lasy i ukształtowanie terenu

### Lasy

Dodaj rzeczywiste obszary leśne Polski.

Wymagania:

- Rozmieszczenie zgodne z danymi geograficznymi.
- Większe kompleksy leśne widoczne przy oddaleniu.
- Mniejsze powierzchnie pojawiające się przy odpowiednim zoomie.
- Czytelny styl pixel art.
- Przygaszona zieleń zgodna z grafitową kolorystyką gry.

Lasy mogą mieć subtelną pikselową fakturę, ale ich położenie musi wynikać z prawdziwych danych.

Nie zastępuj rzeczywistych lasów losowo generowanymi zielonymi plamami.

### Góry i ukształtowanie terenu

Dodaj wizualne odwzorowanie rzeczywistej rzeźby Polski.

Szczególnie ważne są:

- Tatry;
- Beskidy;
- Bieszczady;
- Sudety;
- obszary wyżynne południowej Polski.

Wykorzystaj odpowiednie dane wysokościowe lub opracowane na ich podstawie warstwy.

Nie rozmieszczaj symboli gór losowo.

Preferowany styl: subtelne cieniowanie lub stopniowanie kolorów wysokości, inspirowane pixelartową mapą strategiczną.

Góry powinny być rozpoznawalne, ale nie dominować nad miastami i przyszłymi drogami.

Niziny muszą pozostać czytelne.

## 5. Punkt 04C-4 — ostateczny wygląd mapy

Dopracuj oprawę mapy PixelCargo.

### Kierunek artystyczny

Gra ma wyglądać jak współczesna interpretacja klasycznej gry strategicznej w pixel art.

Kolorystyka:

- grafitowe tło i panele;
- stonowane zielone tereny;
- ciemniejsze kompleksy leśne;
- przygaszone błękitne rzeki;
- subtelnie wyróżnione góry;
- jasne znaczniki miast;
- czytelne granice województw.

Nie korzystaj z fotografii, emoji jako docelowych grafik ani przypadkowo mieszanych stylów.

### Warstwy

Zachowaj logiczną kolejność rysowania:

1. Podstawowy teren.
2. Rzeźba terenu.
3. Lasy.
4. Jeziora i rzeki.
5. Granice województw i państwa.
6. Miasta.
7. Etykiety i podświetlenia.

Przygotuj miejsca na przyszłe warstwy dróg, tras i pojazdów, ale nie implementuj tych funkcji w 04C.

Wszystkie warstwy muszą korzystać z istniejącej wspólnej projekcji geograficznej i jednej kamery.

## 6. Bardzo ważne — wydajność

Obecna mapa zawiera tylko 19 miast demonstracyjnych. Docelowo będzie obsługiwała wszystkie miasta powiatowe oraz wiele pojazdów i tras.

Nie projektuj nowego systemu w sposób, który będzie wymagał później przebudowania całej mapy.

Zastosuj odpowiednie rozwiązania:

- uproszczenie geometrii przy małym zoomie;
- ograniczenie renderowania obiektów niewidocznych w kadrze;
- szczegóły zależne od powiększenia;
- cache danych i geometrii tam, gdzie daje to korzyści;
- unikanie kosztownego ponownego przeliczania wszystkich warstw przy każdym przesunięciu;
- oddzielenie danych świata od komponentów interfejsu.

Zwróć szczególną uwagę na liczbę obiektów SVG oraz koszt aktualizacji Reacta podczas przesuwania i przybliżania mapy.

Jeżeli pełne dane lasów lub ukształtowania terenu okażą się zbyt duże, przygotuj zoptymalizowany zestaw danych lokalnych i udokumentuj jego rzeczywisty zakres. Nie deklaruj pełnego pokrycia, jeśli go nie osiągnięto.

Gra musi działać płynnie na typowym laptopie i komputerze.

Nie implementuj teraz całej przyszłej optymalizacji dla tysięcy pojazdów — zadbaj jedynie o architekturę i wydajność aktualnych warstw.

## 7. Dane geograficzne i licencje

Każdy nowy zbiór danych musi mieć udokumentowane:

- nazwę źródła;
- adres pobrania;
- wersję lub datę pozyskania;
- licencję i wymagane oznaczenia;
- sposób przetworzenia;
- instrukcję odtworzenia danych.

Rozszerz `docs/MAP_DATA.md`.

Zapisz przygotowane dane lokalnie. Normalne uruchomienie gry nie może wymagać płatnego API ani zewnętrznych usług mapowych.

Nie modyfikuj istniejących danych 04A bez uzasadnionej konieczności.

Jeśli źródło jest niedostępne albo jego licencja jest nieodpowiednia, zgłoś ograniczenie i wybierz legalną alternatywę. Nie wymyślaj geometrii.

## 8. Zachowanie funkcji 04A i 04B

Wszystkie istniejące funkcje muszą działać po dodaniu krajobrazu:

- przeciąganie mapy;
- zoom pod kursorem;
- przyciski powiększenia;
- widok całej Polski;
- widok demonstracyjny;
- wyszukiwarka miast;
- obsługa polskich znaków;
- etykiety zależne od zoomu;
- wybór i podświetlanie miast;
- dynamiczna skala odległości;
- limit przybliżenia około 200 m/piksel CSS.

Nie zmieniaj istniejącego zegara gry, mechanizmu zapisu IndexedDB, importu/eksportu ani blokady równoległych kart.

Stan widoku mapy pozostaje odseparowany od silnika symulacji.

Nie wprowadzaj regresji w ukończonej Fazie I.

## 9. Kontrola wyglądu po ukończeniu

Po dodaniu wszystkich warstw ponownie uruchom grę w przeglądarce.

Przygotuj zrzuty ekranu:

- Polski w całości;
- Małopolski;
- Krakowa i okolic;
- południowej Polski z widocznymi górami.

W rozdzielczościach 1366 × 768 i 1920 × 1080 dla podstawowych widoków.

Zapisz reprezentatywne finalne zrzuty w repozytorium, w katalogu `docs/screenshots/04C/`, używając rozsądnej kompresji i bez dodawania zbędnych dużych plików.

W raporcie końcowym wskaż dokładne ścieżki do obrazów.

Sprawdź wizualnie:

- czy mapa jest czytelna;
- czy rzeki i lasy są dobrze widoczne;
- czy granice województw nie dominują nad krajobrazem;
- czy miasta nie giną wśród elementów terenu;
- czy przybliżanie nie powoduje brzydkich artefaktów;
- czy całość zachowuje estetykę pixel art.

## 10. Testy

Po każdym ukończonym podetapie uruchom odpowiednie testy.

Przed zakończeniem całego 04C wykonaj:

`npm test`

`npm run typecheck`

`npm run build`

`npm run test:e2e`

Dodaj testy nowych warstw, danych i zachowania mapy przy zoomie.

Sprawdź, czy istniejące 52 testy logiki i 23 testy przeglądarkowe nadal przechodzą.

Sprawdź również produkcyjną wersję aplikacji w Chromium.

Nie usuwaj istniejących testów po to, żeby uzyskać pozytywny wynik.

Nie deklaruj testu jako zaliczonego, jeśli go nie wykonałeś.

## 11. Kontrola zakresu

W etapie 04C NIE IMPLEMENTUJ:

- rzeczywistego routingu;
- symulacji pojazdów;
- rynku zleceń;
- ekonomii;
- systemu kierowców;
- transportów;
- pełnego katalogu miast powiatowych;
- multiplayera;
- nowych funkcji zarządzania firmą.

Rzeczywista sieć drogowa i wyznaczanie tras należą do kolejnego etapu 05.

Nie dodawaj dekoracyjnych, fikcyjnych dróg, które mogłyby sugerować działający system transportowy.

## 12. Zasady pracy i zabezpieczenie przed limitem

Pracuj kolejno:

- 04C-1 — kontrola wizualna i przygotowanie.
- 04C-2 — hydrografia.
- 04C-3 — lasy i góry.
- 04C-4 — oprawa, optymalizacja i testy.

Każdy podetap powinien kończyć się działającym kodem i punktem kontrolnym w Git.

Jeżeli zbliżasz się do limitu sesji, zatrzymaj się po ostatnim bezpiecznie ukończonym punkcie kontrolnym.

Zaktualizuj `docs/HANDOFF.md`, opisując:

- co ukończono;
- jakie pliki zmieniono;
- które testy przeszły;
- co pozostało;
- dokładne polecenie wznowienia.

Nie rozpoczynaj projektu od nowa w kolejnej sesji.

## 13. Zakończenie etapu

Po ukończeniu całego 04C:

1. Wykonaj pełny zestaw testów.
2. Zaktualizuj README.
3. Zaktualizuj `docs/MAP_DATA.md`.
4. Zaktualizuj `docs/HANDOFF.md`.
5. Oznacz 04C jako ukończony w `docs/ROADMAP.md`.
6. Wykonaj commit lub serię commitów podetapów.
7. Wyślij ukończone zmiany na GitHub przez `git push origin main`, jeżeli nie występuje konflikt.
8. Nie używaj force-push.

W raporcie końcowym podaj:

- zrealizowane podetapy;
- źródła wykorzystanych danych;
- wyniki testów;
- informacje o wydajności;
- ścieżki do zrzutów ekranu;
- ostatni hash commita;
- potwierdzenie synchronizacji z GitHubem;
- ewentualne ograniczenia.

**Nie rozpoczynaj etapu 05 bez kolejnego polecenia.**

Celem jest ukończenie graficznej i geograficznej podstawy mapy Polski, gotowej do późniejszego dodawania prawdziwych dróg, miast, tras i pojazdów.