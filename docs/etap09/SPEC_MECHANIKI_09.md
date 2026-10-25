# PixelCargo etap 09 - reguły mechaniki dla Codexa

## 1. Kredyt - poziom księgowości 1
- Łączny **kapitał pozostający do spłaty** ma limit 20 000 zł. Nie limit sumy historycznych pożyczek.
- Dzień startu: 20 000 zł kredytu startowego, zgodnie z istniejącą grą. Dostępny dodatkowy limit = 20 000 - bieżący kapitał.
- Spłata działa **zawsze, również podczas jazdy, załadunku, odpoczynku i postoju**. Tak samo pobieranie kolejnej transzy w ramach limitu. Operacja nie zmienia przebiegu transportu ani jego czasu.
- Przycisk spłaty powinien pozwolić na kwotę 1 000 zł (dotychczasowy skrót), wpisanie innej dodatniej kwoty oraz SPŁAĆ CAŁOŚĆ. Ostatnia wpłata może być mniejsza niż 1000 zł. Walidacja: nie więcej niż saldo i dług.
- Przycisk WEŹ KREDYT pozwala na dodatnią kwotę do dostępnego limitu. Każda zmiana kapitału i salda jest atomowa; zapis/autosave; osobna pozycja historii (kapitał to nie przychód/koszt operacyjny).
- Odsetki **1% aktualnego niespłaconego kapitału** o każdej północy czasu gry. Księgować raz na granicy dnia, bez względu na stan kursu, refresh strony, interwał ticków czy przyspieszenie. Zaokrąglać do grosza.
- Odsetki są kosztem w saldzie, ale **nie zwiększają kapitału kredytu** (brak automatycznej kapitalizacji). Przy długu 0 zł odsetki 0 i brak pustego zapisu.
- Sprawdź kolejność granicznego zdarzenia: spłata wykonana przed północą zmienia podstawę najbliższych odsetek, wykonana po - dopiero następnych. Chronić przed podwójną opłatą.

## 2. Kierowca, czas pracy i sen
- Próg normalnego dnia: **12 godzin jazdy kierowcy** (czas faktycznego prowadzenia pojazdu, nie załadunku/rozładunku) od ukończenia ostatniego pełnego odpoczynku. Oczekiwanie bez pracy nie podnosi licznika; istniejącą politykę wynagrodzeń poza snem zachować.
- Do 12 h: brak spadku zadowolenia z nadgodzin, zielony pasek.
- 12-14 h: pomarańczowy, 14-16 h: czerwony. Po przekroczeniu 12h jazdy obniżaj zadowolenie stopniowo (projektowo: -2 pkt za każdą pełną nadgodzinę, nie częściej niż raz), ale wartość jako jawna stała/test.
- Przy osiągnięciu 16 h automatycznie zatrzymaj pojazd na aktualnej **rzeczywistej** pozycji istniejącej trasy, wstaw obowiązkowy odpoczynek 15 h, dodatkowa kara zadowolenia projektowo -10 pkt. Nie zatrzymuj gry.
- Normalny blok ODPOCZYNEK: 10 h, pełne odnowienie licznika dnia. Można zaplanować go wcześniej; nie wymaga punktów parkingowych OSM, przyjmujemy bezpieczny postój w grze.
- Sen **nie jest płatny**. Nie zmieniaj poza nim dotychczasowego wynagrodzenia 25 zł/h. Naliczaj pensję wyłącznie za płatne przedziały i rozcinaj skoki czasu na granicach początków/końców snu.
- Zadowolenie 0-100, stan trwały z migracją wcześniejszych zapisów; nie gub historii i nie naliczaj ponownie kary po reload.

## 3. Tankowanie jako blok osi
- Po prawej w wierszu auta przyciski ODPOCZYNEK oraz TANKOWANIE, używające już dołączonych ikon. Kliknij > wybierz przyszłe miejsce/czas na osi > zapisz blok. Nie dodawaj aktywnej czynności w przeszłości.
- Przy TANKOWANIE gracz wybiera DO PEŁNA albo liczbę litrów. Zatankowane litry nie przekraczają pojemności baku. Cena początkowo bieżąca cena w grze 7,50 zł/l (nie wymyślać nowych wojewódzkich cenników).
- Mechanika postoju: punkt 5-30 km **do przodu po faktycznej trasie OSM** od miejsca zlecenia, deterministycznie wybierany po istniejącej geometrii; 15 min tankowania; znacznik auta stoi; paliwo rośnie po zakończeniu / zatwierdzeniu transakcji raz.
- Jeśli na drodze do stacji brakuje paliwa: zablokuj wybór lub przełącz na przyszłą usługę płatnego dowozu paliwa po osobnym ustaleniu stawki. Nie generuj niewidzialnego paliwa ani teleportacji.
- Jeśli przed najbliższym celem drogi jest mniej niż 5 km, jasno zakomunikuj, że nie da się tam umieścić normalnego bloku stacji.
- Planowanie postoju zmienia ETA, kolejność faz, stan paliwa, zmęczenie i ryzyko terminu. Nie zmienia przebiegu drogi. Paliwo jest naliczane per odcinek, dokładnie raz.

## 4. Wiersz harmonogramu
- Niski, zwarty wiersz (docelowo ok. 60-72 px, dopasowywany do ekranu). Od LEWEJ do PRAWEJ: **AUTO | KIEROWCA | OŚ CZASU | ZMĘCZENIE [pasek] | PALIWO [pasek] | ODPOCZYNEK | TANKOWANIE**. Kontrolki i paski znajdują się zatem po prawej stronie osi.
- Na osi wyłącznie pełne kolorowe bloki/kwadraty czasu ze zwięzłą etykietą na początku każdej fazy: jazda z ładunkiem zielona, pusty przejazd pomarańczowy, załadunek niebieski, rozładunek fioletowy, postój/sen szary. **Bez procentów i wielkich tabel postępu**.
- Pionowa linia TERAZ stoi na 25% szerokości części osi, zadania płyną pod nią w lewo. Przeszłość z lewej, przyszłość z prawej. Zachowaj obsługę przewijania i powrotu TERAZ oraz trzy presety wysokości harmonogramu.
- Pasek pozostałej energii maleje płynnie od 100% do 0% w trakcie 16 h jazdy. Kolor jest zielony do 12 h jazdy, pomarańczowy od 12 do 14 h, czerwony od 14 do 16 h, potem obowiązkowe ZZZ. Tekstowa etykieta dostępności. Paliwo kolorowo maleje wraz z rzeczywistym zużyciem: zielone >25%, pomarańczowe 10-25%, czerwone <=10%; zapewnij opis tekstowy dla dostępności.
- Za szerokość kontrolną na 1366px responsywnie zmniejsz nazwy, nie zwężaj całej osi do mikropaska. Nie usuwaj ustawień użytkownika ani funkcji dla trybu 5 AUT.

## 5. Zapis i testowanie
- Jeden zegar; deterministyczne przejścia przez północ, 12 h jazdy, 16 h jazdy, końce snu i tankowania. Zachować starsze zapisy IndexedDB; migracja nowych pól, bez resetu firmy.
- Testy podziału czasu na różne długości ticka, save/reload, północy podczas jazdy, kapitału 0 i 20k, spłaty przy kursie, pełnej wypłaty bez naliczania snu, niskiego paliwa w trasie oraz poprawnych ETA.
- Interfejs nie może pokazywać zdarzeń, których silnik nie obsługuje.
