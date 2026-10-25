# Aktualizacja — Etap 09 ukończony

Praca w osobnym `/workspace/pixelcargo-stage09`, baza `367d153ef5403ddcf92ddd4e4d30b5b8ff7f5bce`, docelowo wyłącznie `feat/preview-gameplay-core`. Kod implementuje: 75 audytowanych odcinków / 306 składanych kierunków / 18 miast, Oświęcim potwierdzony, Gorlice wyłączone, kredyt i odsetki o północy, zmęczenie i niepłatny sen, planowanie odpoczynku i tankowania, kompaktową oś z edycją przyszłych postojów. Stare 135 tras zachowane. Szczegóły, migracja i ograniczenia: docs/STAGE_09.md; raport: docs/reports/09-routes.json.

Potwierdzone: ponowny audyt 75 odcinków i 306 pełnych łańcuchów bez naruszeń; TypeScript OK; **123/123** testów jednostkowych; build i build:pages OK; pełny Playwright **43/43** (w tym oba rozmiary ekranu, przesuwanie przyszłego postoju, sen, paliwo, kredyt i dostawa); produkcyjny Playwright pod /piexelCARGO/ **1/1**. Zachowano wszystkie wcześniejsze testy, dostosowując liczbę ofert i oczekiwanie na rzeczywisty czas nowych tras. Brak zmian grafu źródłowego i starego katalogu 135 tras.

Punkt wznowienia: commit zawierający ten wpis na `feat/preview-gameplay-core`. Etap 09 ukończony w dopuszczonym zakresie; Gorlice i 11 odrzuconych odcinków celowo wyłączone. Nie dodano usługi dowozu paliwa ani punktów POI stacji; tankowanie jest deterministycznym punktem usługi na faktycznej geometrii, zgodnie z regułami 09. Starym zapisom nie dopisuje się fikcyjnego historycznego zmęczenia. Publikacja przez istniejący workflow Pages po push tej gałęzi; wynik deploy sprawdzić dla tego samego SHA. Po raporcie końcowym **czekać na nowe polecenie**, bez kolejnych etapów, zmian main ani naruszania starych szkiców.

---

# Aktualizacja — Etap 08

Wykonano osiem punktów: zatwierdzone 52 PNG i mapowanie wyglądu, zegar od utworzenia firmy, trwały samouczek, profilowy marker, 17 miast / 135 audytowanych kierunków (w tym powrót Zakopane → Kraków), przejazd pusty, wyjaśnienia blokad, oś TERAZ na 25% i najnowsza historia finansów na górze. Układ 07 i wcześniejsze zapisy zachowane. Oświęcim i Gorlice nie są uruchomione — brak wystarczającej kontroli tras. Nie dodano nowych modeli, odpoczynku ani planowanego tankowania. Szczegóły, audyt i punkt kontynuacji: docs/STAGE_08.md oraz docs/reports/08-routes.json. Baza d9610db409fd6405e21df1998a2caf10023a40ad. Po pozytywnych testach i commit/push wyłącznie na feat/preview-gameplay-core, sprawdzić Pages i czekać na polecenie.

---

# Aktualizacja — Etap 07: nawigacja i harmonogram

Duża mapa/baza + ikony albo szerokie zarządzanie 2/3; tabela zleceń bez przesuwania poziomego. Harmonogram 1 AUTO / 5 AUT / PEŁNY EKRAN, uchwyt wysokości, osobne trwałe preferencje UI, alerty i rzeczywista oś czasu. Mechanika, ekonomia, czas, zapisy i OSM bez zmian. Paczek grafik NIE integrowano; niedokończone zmiany poprzedniego zadania zostały w osobnym worktree, poza tą gałęzią. Baza 07ca6179a286ddd65ffa290b26d2bfd606781de6, gałąź feat/preview-gameplay-core. Szczegóły i punkt kontynuacji: docs/LAYOUT_07.md. Po testach, commit/push i sprawdzeniu Pages czekać na nowe polecenie.

---

# Aktualizacja — Etap 06, nowy interfejs

Jedna gra ma nową powłokę według referencji: pięć sekcji menu i osobny panel, niezależne tryby MAPA/BAZA, tabele zleceń/floty/finansów, przydział auta, hover OSM i stały harmonogram. Mechanika i dane bez zmian. Szczegóły i ograniczenia assetów/liczby paczek: docs/INTERFACE_06.md. Baza e3b66f2e05287185a1a050dc87904e0fba72ee5d, gałąź feat/preview-gameplay-core. Nie ingerowano w gałąź grafika. Punkt wznowienia: ukończony zakres interfejsu; po commit/push i sprawdzeniu Pages czekać na nowe polecenie. Nie rozpoczynać kolejnych etapów.

---

# Aktualizacja — rynek zleceń preview

Rozbudowano deterministyczny rynek dziesięciu towarów, trwałe oferty (5 dni), trzy rezerwacje, ręczne rozpoczęcie, terminy 3 dni i jednorazowe kary/wypłaty. Zachowano wspólny zegar, mapę, paliwo, pensje i stare zapisy; brak zmian CSS/grafik/OSM. Szczegóły i jawne ograniczenia puli/danych ludnościowych: docs/FREIGHT_MARKET.md. Baza 15e64015b1322fa96aafd45b06af4add7f30dfb0; gałąź feat/preview-gameplay-core. Po commit/push czekać na polecenie. Nie rozpoczynać dalszych etapów ani ingerować w feat/pixelcargo-art-assets.

---

# Roadmap PixelCargo 0.1

- [x] Integracja preview: jeden zegar, główna PolandMap z pojazdem OSM, nawigacja pięciu widoków i rzeczywisty harmonogram tylko do odczytu. Szczegóły docs/UNIFIED_GAME.md. Po zakończeniu czekać na polecenie; pełne etapy poniżej pozostają osobnym zakresem.

Osobna gałąź feat/preview-gameplay-core: stabilizacja zapisu i paliwa preview ukończona w zleconym zakresie; 79/79 unit i 2/2 celowane E2E. Szczegóły docs/PREVIEW_STABILIZATION.md. Nie zmienia to statusu pełnych etapów poniżej.
Punkty 01–03 pochodzą z dokumentu Fazy I. Nazwy 04–18 to robocze grupowanie oryginalnej specyfikacji, a nie automatyczna zgoda na kolejne zadania. Użytkownik zlecił Fazę II w zakresie 04A i następnie 04B; ukończono także 04C. Historyczne polecenia etapów nie upoważniają do dalszych prac.

- [x] 01 Fundament i architektura
- [x] 02A Silnik symulacji i zegar
- [x] 02B Zapis, odczyt i blokada kart
- [x] 03 Powłoka interfejsu pixel art
- [x] 04 Mapa Polski i dane geograficzne (04A–04C)
  - [x] 04A Podstawowa mapa: prawdziwe granice państwa i 16 województw, 19 miast demonstracyjnych Małopolski, źródła/licencje i warstwy
  - [x] 04B Interaktywna mapa: przeciąganie, zoom pod kursorem, limit 200 m/piksel CSS, wyszukiwarka demo, etykiety i skala odległości
  - [x] 04C Krajobraz Polski, pixel art i optymalizacja
    - [x] 04C-1 Kontrola wizualna i zrzuty przed zmianami
    - [x] 04C-2 Hydrografia
    - [x] 04C-3 Lasy i rzeźba terenu
    - [x] 04C-4 Oprawa, optymalizacja, testy i zrzuty końcowe
- [ ] 05 Sieć drogowa i wyznaczanie tras
  - [x] 05A Rzeczywisty graf Małopolski: OSM IDs, kierunki/dostęp, pełna geometria, granica OSM, 19 przypięć i sześć par, źródła/ODbL
  - [ ] 05B Najkrótsze trasy, dostęp i restrykcje skrętów
  - [ ] 05C Canvas dróg i planer demonstracyjny, powiększenie mapy
  - [ ] 05D Sieć krajowa, optymalizacja i pomiary
- [ ] 06 Start firmy i baza
- [ ] 07 Pojazd i kierowca
- [ ] 08 Ładunki i rynek ofert
- [ ] 09 Harmonogram
- [ ] 10 Przyjmowanie i realizacja zleceń
- [ ] 11 Pojemność i transport partii
- [ ] 12 Paliwo
- [ ] 13 Zmęczenie i odpoczynek
- [ ] 14 Awarie i serwis
- [ ] 15 Finanse, kredyt i wynagrodzenia
- [ ] 16 Alerty i historia
- [ ] 17 Efekty dźwiękowe
- [ ] 18 Integracja i walidacja pełnej wersji 0.1

Faza I jest ukończona. Z Fazy II ukończono 04A, 04B i 04C. Etap 05 został zlecony; realizować kolejno A–D. Nie rozpoczynać 06. 05A ukończony; 05B–05D pozostają do realizacji. Pozostałe nazwy etapów są roboczym grupowaniem specyfikacji.
