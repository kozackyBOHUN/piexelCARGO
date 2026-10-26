# Etap 06 — interfejs jednej gry

Baza e3b66f2e05287185a1a050dc87904e0fba72ee5d. Wymagania: PixelCargo_Etap_06_UI.md i obraz zatwierdzony w rozmowie. Praca w osobnym worktree; wcześniejsze szkice i gałąź grafika nietknięte.

## Układ i obsługa

Górny pasek: logo typograficzne, firma, rzeczywiste saldo i kredyt, dzień/godzina z tego samego PreviewSession, przełącznik MAPA/BAZA, zapis i ustawienia. Bez zmyślonej daty kalendarzowej. Pięć sekcji menu z podmenu; po lewej osobno przewijany panel, około 36% szerokości razem z nawigacją. Po prawej mapa lub baza i stale widoczny harmonogram. Tabele przewijają się we własnych kontenerach. Przy 1366×768 i 1920×1080 całość mieści się w oknie. Mniejsze ekrany układają panele pionowo.

Tryb świata i wybór funkcji są niezależne, zapamiętane w URL (mode, panel). Kliknięcie budynku wybiera ten sam panel co menu, bez przełączania trybu. Mapa pozostaje zamontowana w trybie BAZA, więc nie traci kamery. Żaden widok nie tworzy zegara ani nie nalicza własnej symulacji. / oraz /?preview=1 korzystają z tego samego zapisu; /?dev=1 zachowuje diagnostykę.

Biuro: rzeczywiste podsumowanie, poziomy czterech budynków i limity 0.1. Rozbudowa oraz warsztat/hotel/stacja/magazyn jawnie niedostępne, bez cen. Parking: tabela prawdziwego pojazdu, dotychczasowe pięć ofert używanych i zakup. Dealer niedostępny. Kadry: kierowca i zatrudnienie, czas od zatrudnienia i wypłacona pensja; brak fikcyjnej energii/odpoczynku/szkoleń.

Spedycja: oddzielne tabele w realizacji/przyjętych/dostępnych/zakończonych. Filtry województwa (obecnie wyłącznie Małopolskie), miast, rodzaju i wielkości oraz sortowanie. Promień +50/100/200 km jest odległością wielkiego koła między rzeczywistymi współrzędnymi miast, nie dystansem drogowym. Najechanie/fokus oferty rysuje pełną zatwierdzoną geometrię OSM we wspólnej projekcji mapy; opuszczenie wiersza usuwa podświetlenie. Kolumna ilości pokazuje zapisane palety; dla paczek liczba sztuk nie była zapisana w poprzednim modelu i jest jawnie nieznana (nie dopisano wymyślonych wartości).

PRZYDZIEL AUTO otwiera wybór jednego rzeczywiście posiadanego pojazdu. ROZPOCZNIJ KURS korzysta z istniejącego startOrder: pojemność, paliwo, kierowca, pojedynczy aktywny przewóz i zatwierdzony dojazd. Bez teleportacji, automatycznej kolejki i zmiany limitu trzech zleceń.

Finanse: okres 7/30 dni lub całość, rzeczywiste sumy i dzienny wykres przychodów/kosztów/zysku, tabela transakcji, kredyt i statystyki. Kredyt i spłata kapitału nie wchodzą do wyniku działalności; historia nadal zawiera te przepływy. Puste dane oznaczają pusty wykres. Dla przejrzystości słupek zysku przedstawia wartość bezwzględną (opisane w legendzie), a znak wyniku jest w podsumowaniu. Przebieg to rzeczywisty licznik, wraz z przebiegiem przy zakupie; stan techniczny jest oznaczony jako stan przy zakupie, nie symulowana awaryjność.

Harmonogram jest przewijaną tabelą z jednym prawdziwym autem: model, kierowca, lokalizacja/trasa, faza, postęp, przewidywany koniec i status. Filtr aktywny/postój i wyszukiwarka modelu. Brak fikcyjnych pustych pojazdów. Kontener tabeli nie zależy od liczby wierszy i może przewijać większy przyszły katalog; mechaniki wielu aut nie dodano. Szczegóły zachowują rzeczywisty plan czterech faz i oczekiwanie po dostawie.

## Grafika i ograniczenia

Grafit/granat, niebieskie aktywne pozycje, pomarańczowe logo, zielone kwoty i czerwone ostrzeżenia. Nie zmieniono rzeczywistej geografii, granic, krajobrazu, OSM ani silnika. Zastosowano istniejące PixelBuilding/VehiclePixel/portret i ikony, bez zastępowania gotowych grafik nowymi SVG. Pusty rejestr ART_ASSETS umożliwia podłączenie zatwierdzonych PNG relatywnie do Vite BASE_URL; brak automatycznych żądań do nieistniejących plików. Docelowe logo/ilustracja przeglądu i PNG grafika nie zostały dostarczone na tę gałąź, więc nie twierdzimy, że grafika jest identyczna z referencją. Przegląd firmy używa neutralnego panelu informacyjnego z istniejącą ikoną zamiast nowej wymyślonej ilustracji.

To kompletny funkcjonalny zakres interfejsu 06 z opisanymi ograniczeniami danych i assetów, nie wdrożenie pełnej mechaniki 0.1. Nadal obowiązują ograniczenia rynku z FREIGHT_MARKET.md (30 ofert, bez transportów dzielonych i pełnych danych ludnościowych). Nie zmieniono parametrów ekonomii, paliwa, kar, pensji ani zapisu.

## Weryfikacja i wznowienie

Jednostkowe testy rynku, paliwa, kar, wypłat i migracji zachowane. Dodano testy rzeczywistego promienia i finansów. Istniejące testy UI dostosowano do nowej nawigacji, nie usuwając przypadków; dodano pełną rozgrywkę w obu rozdzielczościach. Testy obejmują tabelę, hover OSM, wybór auta, zmianę pozycji, przełączanie MAPA/BAZA bez zmiany czasu, budynek→panel, reload w trasie, końcową wypłatę raz, historię, zapis i restart. Produkcyjny test Pages nadal sprawdza /piexelCARGO/, zasoby i licencje.

Polecenia: npm run typecheck; npm test; npm run build; npm run build:pages; npx playwright test --config playwright.interface06.config.ts; npx playwright test --config playwright.pages.config.ts.

Po publikacji czekać na nowe polecenie. Nie przechodzić do dalszych etapów ani scalać do main. Status zdalnego Pages potwierdzać dla konkretnego SHA, nie na podstawie samego lokalnego builda.

Weryfikacja: TypeScript OK; npm test 95/95 (13 plików); standardowy build i build:pages OK; Playwright interface06 36/36 (wszystkie dotychczasowe przypadki plus nowa pełna rozgrywka w obu rozdzielczościach), produkcyjny Pages 1/1. Po korekcie instrukcji samouczka i odsunięciu etykiety Biura powtórzono jednostkowe/build oraz 9 scenariuszy gry i Pages. Zrzuty rzeczywistego interfejsu: docs/screenshots/06/.

W jednym powtórnym przebiegu dotychczasowy test geography.test.ts:103 (850×200) przekroczył 5-sekundowy limit. Ponowienie całego npm test zakończyło się 95/95 bez zmiany kodu testu, limitu ani danych geograficznych.
