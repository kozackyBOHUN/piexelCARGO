# PIXELCARGO 0.1 - ETAP 08: GRAFIKA I 8 POPRAWEK GRY

Repozytorium: kozackyBOHUN/piexelCARGO

Gałąź: feat/preview-gameplay-core

Punkt wyjścia: d9610db409fd6405e21df1998a2caf10023a40ad

Załączam jeden ZIP z zatwierdzonymi grafikami i roboczymi danymi tras.

Najpierw przeczytaj README_DLA_CODEXA.md, manifest.json i appearance_mapping.json. Sprawdź aktualny stan gałęzi przed rozpoczęciem pracy.

CEL: Ulepszyć działającą grę, zachowując dotychczasowy układ menu MAPA / BAZA oraz wszystkie sprawne mechaniki.

## 1. NOWE GRAFIKI

Podłącz zatwierdzone PNG:

- Samochody do giełdy i floty.
- Towary do rynku zleceń.
- Cztery budynki do izometrycznej bazy.
- Portrety do Kadr.
- 27 ikon do menu, przycisków i alertów.

W ZIP znajduje się dokładne przypisanie pięciu zatwierdzonych grafik samochodów do obecnych pięciu ofert giełdy. Zastosuj je wyłącznie wizualnie.

Nie zmieniaj cen, modeli, ładowności ani mechaniki.

Zadbaj o skalowanie bez rozmycia pikseli. Przetestuj brakujące grafiki, nazwy i ścieżki.

Nie używaj wcześniejszych odrzuconych assetów. Nie zmieniaj zatwierdzonego układu ekranu.

## 2. ZEGAR STARTU FIRMY

Obecnie czas gry płynie już podczas zakładania firmy.

Zmień to:

- Przed założeniem firmy czas stoi.
- Gracz spokojnie wpisuje nazwę i wybiera bazę.
- Zegar startuje dopiero po kliknięciu ZAŁÓŻ FIRMĘ.
- Nowa firma zaczyna od dnia 1, godz. 06:00.
- Zachowaj prędkość 1 sekunda rzeczywista = 1 minuta gry.
- Stare zapisy muszą działać bez resetowania ich czasu.

W całej grze pozostaje jeden wspólny zegar.

## 3. SAMOUCZEK DLA NOWEGO GRACZA

Nowy gracz ma być prowadzony krok po kroku.

Po utworzeniu firmy automatycznie uruchom samouczek:

KROK 1 - KUP SAMOCHÓD
Podświetl PARKING, następnie GIEŁDA UŻYWANYCH i przycisk zakupu.

KROK 2 - ZATRUDNIJ KIEROWCĘ
Podświetl KADRY, REKRUTACJA i ZATRUDNIJ.

KROK 3 - PRZYJMIJ ZLECENIE
Podświetl SPEDYCJA, SZUKAJ ZLECEŃ oraz odpowiedni przycisk PRZYJMIJ.

KROK 4 - PRZYDZIEL AUTO
Podświetl przyjęte zlecenie i przycisk PRZYDZIEL AUTO.

KROK 5 - ROZPOCZNIJ TRANSPORT
Podświetl ROZPOCZNIJ KURS.

KROK 6 - OBSERWUJ MAPĘ
Pokaż samochód w ruchu i działający harmonogram.

Zasady:
- Podświetlanie ma być wyraźne, ale nie zasłaniać przycisków.
- Krótkie instrukcje w języku polskim.
- Przechodzenie do następnego etapu dopiero po rzeczywistym wykonaniu czynności.
- Możliwość pominięcia samouczka.
- Po odświeżeniu samouczek nie zaczyna się bez potrzeby od początku.
- Samouczek nie może zatrzymywać ani psuć transportu.
- Bez fikcyjnych czynności demonstracyjnych.

## 4. IKONY SAMOCHODÓW NA MAPIE

Zamiast jednego uniwersalnego znacznika chcę małą pixelartową sylwetkę samochodu WIDZIANEGO Z PROFILU.

Przygotuj rozróżnienie kategorii:

- Furgon / bus.
- Ciężarówka.
- Ciągnik siodłowy z naczepą.

Każda sylwetka musi wyglądać inaczej.

W wersji 0.1 faktycznie działa tylko furgon. Pozostałe kategorie przygotuj na przyszłość, bez odblokowywania nowych pojazdów.

Samochód:
- Pozostaje widoczny na mapie przy przybliżaniu i przesuwaniu.
- Porusza się po rzeczywistej trasie.
- Nie teleportuje się.
- Można go kliknąć, żeby otworzyć szczegóły.
- Nie może wyglądać jak zwykła kropka lub pinezka.

Jeżeli gotowy pakiet nie zawiera małych ikon profilowych, przygotuj czytelne pikselowe sylwetki do znaczników. Nie rozciągaj dużej grafiki ukośnego samochodu, udając widok z profilu.

## 5. PEŁNIEJSZA SIATKA TRAS I ZLECEŃ W MAŁOPOLSCE

KRYTYCZNY PROBLEM: po dojechaniu np. do Zakopanego gracz nie ma zlecenia powrotnego i nie może dalej sensownie prowadzić firmy.

Napraw to.

Priorytet:
- Kraków.
- Tarnów.
- Zakopane.
- Bochnia.

Zapewnij działające połączenia wyjazdowe i powrotne, w szczególności Zakopane → Kraków.

Następnie rozszerz obszar o kolejne miasta Małopolski z załączonego zestawu 19 miast.

W ZIP znajduje się roboczy katalog tras i raport ograniczeń. UWAGA: to są kandydaci, a nie całkowicie zweryfikowana sieć! Niezależnie sprawdź topologię, geometrię i ograniczenia drogowe przed dopuszczeniem trasy do gry.

Wymagania:
- Zlecenia mogą zaczynać się i kończyć w każdym faktycznie uruchomionym mieście.
- Po dostawie powinny być dostępne dalsze oferty z miasta docelowego lub najbliższych obsługiwanych miast.
- Nie ograniczaj zleceń wyłącznie do Krakowa.
- Rynek musi odnawiać oferty.
- Trasy muszą prowadzić po rzeczywistych drogach OSM.
- Bez teleportacji i fikcyjnych linii prostych.
- Jeżeli chwilowo nie ma odpowiedniego zlecenia, zapewnij możliwość ręcznego przejazdu na pusto do innego dostępnego miasta, po prawdziwej trasie i za koszt paliwa, bez wynagrodzenia.

Nie dodawaj niezweryfikowanych połączeń jako działających.

Raport końcowy musi wyraźnie podawać liczbę miast i kierunków, które rzeczywiście uruchomiono, oraz pozostające ograniczenia.

## 6. DLACZEGO NIE MOGĘ PRZYDZIELIĆ AUTA?

Teraz gracz widzi nieaktywny przycisk, ale nie wie dlaczego.

Popraw to we wszystkich przyjętych zleceniach.

Przy niedostępnym przydziale pokaż dokładną przyczynę, np.:

- Brak samochodu.
- Brak zatrudnionego kierowcy.
- Samochód jest aktualnie w trasie.
- Ładunek przekracza ładowność.
- Brakuje pojemności w m³ lub miejsc paletowych.
- Za mało paliwa.
- Brak zatwierdzonej trasy do miejsca załadunku.

Przycisk nie może być po prostu szary bez wyjaśnienia.

W miarę możliwości dodaj krótką informację, co gracz powinien zrobić, żeby usunąć blokadę.

Komunikaty muszą wynikać z faktycznej mechaniki, a nie z domysłów interfejsu.

## 7. PRZEBUDOWA OSI CZASU SAMOCHODÓW

Obecna oś czasu nie działa tak, jak chcę.

Nowa zasada:

**TERAZ znajduje się stale w odległości 25% szerokości osi od lewej strony.**

- Lewo: wykonana przeszłość.
- Prawo: zaplanowana przyszłość.
- Znacznik TERAZ pozostaje w jednym miejscu.
- To bloki czynności płynnie przesuwają się pod znacznikiem wraz z upływem czasu.
- Ruch ma być płynny, bez przeskakiwania co godzinę lub między kratkami.
- Godziny i daty przesuwają się razem z osią.
- Zadania zachowują rzeczywiste długości i proporcje czasowe.
- Gracz może przewijać oś, żeby obejrzeć wcześniejsze lub przyszłe wydarzenia, i wrócić przyciskiem TERAZ.

Zachowaj kolory:
- Zielony - transport z ładunkiem.
- Pomarańczowy - przejazd pusty.
- Odrębne czytelne kolory - załadunek i rozładunek.
- Szary - oczekiwanie i postój.

Oś musi działać w widokach 1 AUTO, 5 AUT i PEŁNY EKRAN.

Przygotuj strukturę pod wiele pojazdów, ale w 0.1 nadal istnieje maksymalnie jeden samochód.

Nie implementuj w tym zadaniu mechaniki odpoczynku i planowanego tankowania. Będzie to osobny etap, w którym kierowca podczas snu nie otrzymuje pensji.

## 8. HISTORIA FINANSOWA

Odwróć kolejność zdarzeń.

Najnowsze operacje zawsze na samej górze, najstarsze na dole.

Gdy kilka zdarzeń ma identyczny czas, zachowaj ich poprawną kolejność wykonania.

Nie zmieniaj kwot ani zasad rozliczeń.

## 9. TESTY I OCHRONA GRY

Zachowaj działające:
- Menu MAPA / BAZA.
- Szerokie tabele.
- Trzy rozmiary harmonogramu.
- Zakup samochodu.
- Zatrudnianie kierowcy.
- Rynek i przyjmowanie zleceń.
- Kary, wypłaty, paliwo, pensje i kredyt.
- Zapis, odczyt i restart firmy.

Przetestuj szczególnie:

1. Czas przed założeniem firmy stoi.
2. Po utworzeniu firmy zegar rusza od właściwej godziny.
3. Samouczek prowadzi przez pełną pierwszą dostawę.
4. Zapis i odświeżenie nie cofają postępu.
5. Znaczniki aut są czytelne na mapie.
6. Dostawa do Zakopanego i możliwość dalszego kursu.
7. Komunikaty o przyczynach zablokowanego przydziału.
8. Oś czasu płynie płynnie, przy stałej pozycji TERAZ.
9. Historia finansowa pokazuje nowe wpisy na górze.
10. Grafiki ładują się poprawnie, bez błędnych nazw i brakujących plików.

Sprawdź rozdzielczości 1366×768 i 1920×1080.

Uruchom TypeScript, testy jednostkowe, Playwright oraz oba buildy.

Jeżeli zadanie wymaga wielu commitów, możesz podzielić je na logiczne części. Nie publikuj niedziałającej wersji.

Commit i push wyłącznie na feat/preview-gameplay-core. Nie rób merge do main i nie zmieniaj gałęzi grafika.

## 10. RAPORT KOŃCOWY

Odpowiedz krótko:

1. Które z 8 punktów wykonano.
2. Co nie zostało ukończone.
3. Ile miast i połączeń OSM rzeczywiście działa.
4. Wyniki testów.
5. Hash ostatniego commita.
6. Czy GitHub Pages opublikował nową wersję.

Zatrzymaj pracę po zakończeniu.
