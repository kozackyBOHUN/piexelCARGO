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
