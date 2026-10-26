# PIXELCARGO - ETAP 06: NOWY INTERFEJS GRY

Jesteś głównym programistą PixelCargo.

Repozytorium: kozackyBOHUN/piexelCARGO
Gałąź: feat/preview-gameplay-core
Commit początkowy: e3b66f2e05287185a1a050dc87904e0fba72ee5d

## CEL

Przebuduj CAŁY interfejs gry na podstawie ZAŁĄCZONEGO, ZATWIERDZONEGO OBRAZU REFERENCYJNEGO.

Chcę możliwie wiernego odwzorowania układu, proporcji, grafitowej stylistyki, kolorów i czytelności.

Nie twórz kolejnego chaotycznego prototypu. To ma wyglądać jak dopracowana gra ekonomiczna.

## 1. GŁÓWNY UKŁAD

Ekran podziel na dwie części:

**LEWA - 1/3 szerokości**
- Wąski pasek rozwijanego menu.
- Obok niego panel wybranej funkcji.
- Obie części łącznie zajmują około 1/3 ekranu.
- Własne przewijanie.

**PRAWA - 2/3 szerokości**
- U góry duża mapa Polski lub graficzny widok bazy.
- Pod nią stale widoczny harmonogram samochodów.
- Wysokość obu części dopasowana do ekranu.

Na górze pasek: logo PixelCargo, nazwa firmy, saldo, kredyt, dzień, godzina i przełącznik MAPA / BAZA.

## 2. DWA TRYBY

MAPA - interaktywna mapa Polski, trasy i samochody.

BAZA - izometryczna baza z budynkami.

Przełączanie nie zatrzymuje czasu ani jazdy.

Zmiana pozycji w lewym menu nie może automatycznie zmieniać trybu. Gracz sam przełącza MAPA / BAZA.

Kliknięcie budynku na graficznej bazie otwiera dokładnie ten sam panel, co wybranie go z menu.

## 3. LEWE MENU

Pięć głównych rozwijanych sekcji:

### 1. BIURO
- Przegląd firmy.
- Budynki bazy.
- Aktualne poziomy budynków.
- Opis, co da przyszła rozbudowa.
- Informacje o dostępnych funkcjach.

W wersji 0.1 funkcjonują Biuro, Parking, Spedycja i Kadry.

Nie dodawaj mechaniki rozbudowy ani nie wymyślaj jej cen. Warsztat, hotel, stacja paliw i magazyn pozostają poza zakresem tej wersji.

### 2. SPEDYCJA

2.1 Zlecenia w realizacji.
2.2 Zlecenia przyjęte.
2.3 Szukaj zleceń.
2.4 Zlecenia zakończone.

**Wyszukiwarka zleceń ma być TABELĄ.**

Kolumny:
- Skąd.
- Dokąd.
- Typ towaru.
- Ładunek.
- Ilość, masa i objętość.
- Wygasa za.
- Cena.
- PRZYJMIJ ZLECENIE.

Filtry:
- Województwo.
- Miasto załadunku.
- Miasto rozładunku.
- Rodzaj i wielkość ładunku.
- Po wybraniu miasta: promień +50 km / +100 km / +200 km.

Promień oznacza odległość geograficzną od wybranego miasta, nie długość trasy drogowej. Korzystaj z rzeczywistych współrzędnych dostępnych miast.

**Po najechaniu myszką na ofertę, na mapie pojawia się podświetlona rzeczywista trasa tego zlecenia.** Po opuszczeniu wiersza podświetlenie znika. Nie rysuj fikcyjnych prostych zamiast dróg OSM.

Przyjęte zlecenia: tabela z przyciskiem PRZYDZIEL AUTO. Gracz wybiera posiadany samochód spełniający wymagania. Obecnie może mieć tylko jeden pojazd. Nie symuluj posiadania 20 samochodów.

Zachowaj ręczne rozpoczynanie kursów, limity, terminy i kary. Przydzielenie samochodu i rozpoczęcie kursu nie mogą powodować teleportacji.

Tabela może przewijać się poziomo, jeżeli nie mieści się w lewym panelu. Nie zabieraj jej miejsca z mapy.

### 3. PARKING

3.1 Moje samochody - tabela aut, kierowcy, paliwo, stan i lokalizacja.

3.2 Giełda używanych - samochody ze szczegółowymi parametrami i grafikami.

3.3 Dealer nowych pojazdów - na razie niedostępny.

Zachowaj kupowanie używanych furgonów. Nie zastępuj gotowych grafik prostymi SVG. Jeśli zatwierdzone PNG nie są jeszcze na tej gałęzi, pozostaw możliwość ich późniejszego podłączenia.

### 4. KADRY

4.1 Moi kierowcy.
4.2 Rekrutacja.
4.3 Szkolenia - funkcje jeszcze niedostępne.
4.4 Czas pracy i odpoczynek - pokazuj rzeczywiste dostępne dane, bez fikcyjnych wartości.

Zachowaj zatrudnianie kierowcy.

### 5. FINANSE

5.1 Podsumowanie finansowe:
- Przychody.
- Koszty.
- Zysk lub strata.
- Mały wykres przychodów, kosztów i zysku.
- Wybór: 7 dni / 30 dni / cała historia.

5.2 Historia finansowa - tabela transakcji.

5.3 Kredyty - zadłużenie i spłaty.

5.4 Statystyki - wyniki firmy i samochodów, wyłącznie na podstawie rzeczywistych danych.

Nie generuj przykładowych liczb. Jeżeli brakuje historii, pokaż pusty wykres z odpowiednim komunikatem.

Ustawienia, zapis i restart udostępnij pod ikoną w górnym pasku, poza pięcioma głównymi sekcjami.

## 4. HARMONOGRAM - BARDZO WAŻNE

Zawsze widoczny pod mapą lub bazą.

Jeden samochód = jeden wiersz.

Kolumny:
- Numer i model auta.
- Kierowca.
- Lokalizacja.
- Aktualna czynność.
- Pasek postępu.
- Przewidywany koniec.
- Status / wymagane działanie.

Filtrowanie, wyszukiwanie i przewijanie listy.

Układ musi pomieścić docelowo kilkadziesiąt aut, również 20 i więcej, bez rozsypywania interfejsu.

Jednocześnie nie wprowadzaj teraz mechaniki wielu samochodów. W wersji 0.1 pokazujemy jeden prawdziwy pojazd.

Nie wyświetlaj pustych fikcyjnych samochodów.

## 5. WYGLĄD

ZATWIERDZONY OBRAZ JEST REFERENCJĄ PROJEKTOWĄ.

- Granatowo-grafitowe panele.
- Niebieskie aktywne zakładki.
- Pomarańczowe akcenty PixelCargo.
- Zielone statusy prawidłowe.
- Czerwone ostrzeżenia.
- Czytelna typografia i polskie znaki.
- Spójne odstępy, obramowania i rozmiary.
- Przyciski z czytelną informacją, co robią.

Nie twórz zastępczych, brzydkich ilustracji. Grafik pracuje nad właściwymi assetami.

Zachowaj prawdziwą geografię dotychczasowej mapy. Nie kopiuj niedokładnej geografii z obrazu referencyjnego.

## 6. ZACHOWAJ MECHANIKĘ

NIE WOLNO ZEPSUĆ:
- Zegara.
- Jazdy samochodu po OSM.
- Zakupu pojazdu.
- Rekrutacji kierowcy.
- Rynku 30 ofert.
- Przyjętych i aktywnych zleceń.
- Paliwa.
- Terminów i kar.
- Finansów.
- Zapisu i restartu firmy.

Nie ingeruj w ekonomikę gry ani dane drogowe.

Nie modyfikuj gałęzi grafika i nie wykonuj merge do main.

## 7. TESTY

Przetestuj 1366 × 768 oraz 1920 × 1080.

Sprawdź przełączanie MAPA / BAZA, działanie menu, tabel, przydzielanie auta, podświetlanie tras, harmonogram i odświeżenie podczas jazdy.

Uruchom testy jednostkowe, TypeScript, build i Playwright.

Wykonaj commit i push na feat/preview-gameplay-core po pozytywnych testach.

Nie kończ na samym szkielecie interfejsu. Przeprowadź pełny przebieg gry: załóż firmę, kup samochód, zatrudnij kierowcę, znajdź i przyjmij zlecenie, zrealizuj transport i odbierz zapłatę.

Na koniec podaj:
1. Co działa.
2. Co nie zostało ukończone.
3. Wyniki testów.
4. Numer commita.
5. Czy GitHub Pages opublikował nową wersję.

Zatrzymaj się po zakończeniu etapu.
