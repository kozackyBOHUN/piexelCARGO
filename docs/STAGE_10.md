# Etap 10 — jednostki, partie i ładownia

Baza `cc8b20e51147e27f99119195ed065ce857950a2d`, osobny worktree `pixelcargo-stage10`. Docelowa gałąź wyłącznie `feat/preview-gameplay-core`. Specyfikacja źródłowa rozdziały 11–13 oraz polecenie właściciela z etapu 10. Bez zmian PNG, grafów i katalogów OSM, parametrów pięciu modeli, stawek, cen przyjętych zleceń i mechanik 09.

## Jednostki i dokładność

Dziesięć istniejących towarów zachowuje profile masy, objętości oraz algorytm cen. Nowe oferty zapisują `units.kind` (paczka/karton/europaleta) i dodatnią całkowitą `units.count`. Paletyzowane mają jedną europaletę na jednostkę; paczki i kartony nie zajmują miejsc paletowych. Nie ma przelicznika paleta = tona = m³. Liczba paczek/kartonów jest deterministycznie wyprowadzana z istniejącego losowania (20 paczek albo 12 kartonów na dotychczasową partię profilu); nie zużywa kolejnych liczb generatora i nie zmienia cen ani łącznych parametrów towaru.

`portion(offer, offset, count)` wylicza masę i objętość kolejnych całych jednostek. Obliczenia w całych gramach i litrach (0,001 m³); dane dotychczasowego generatora mają dokładność najwyżej 0,01 m³, więc nie tracą precyzji. Różnice dzielenia są przypisane deterministycznie do numerów jednostek, przez różnicę skumulowanych zaokrągleń w dół. Suma dowolnego poprawnego podziału jest dokładnie sumą całego towaru. Pojedyncze jednostki mogą różnić się o 1 g / 1 l. Pieniądze nadal w całych groszach.

## Rezerwacja i magazyn samochodu

Przyjęte zlecenie ma `cargoProgress.picked` i `delivered`. Na pokładzie jest `picked - delivered`, pozostało do odebrania `count - picked`. Przydział auta zapisuje `active.batch`: identyfikatory zleceń, źródłowe towary, zakresy numerów (`offset`, `count`). To rezerwacja, a nie załadowany towar. Rezerwacji nie można uruchomić drugi raz podczas aktywnego przejazdu/postoju. Wybrane jednostki nie mogą być ponownie odebrane po dostarczeniu.

Samochód dojeżdża pusty po zatwierdzonej trasie do nadawcy. Dopiero koniec 15-minutowego załadunku w mieście odbioru zwiększa `picked` i umieszcza partie na pokładzie. Podczas jazdy i 15-minutowego rozładunku nadal są w ładowni. Dopiero koniec rozładunku w mieście docelowym zwiększa `delivered` i opróżnia ładownię. Samo kliknięcie, postęp czasu poza tymi granicami i reload nie dodają ani nie usuwają towaru.

Wszystkie partie jednocześnie zajmują sumę kg, m³ i miejsc paletowych. Trzy limity sprawdzane łącznie i niezależnie, według faktycznych `van.specs` z giełdy (850–1500 kg, 9–15 m³, 3–4 europalety). Zachowano dawny fallback dla historycznego furgonu bez specs. Podgląd pokazuje przekroczenia każdego limitu, a silnik odrzuca niepoprawny plan atomowo.

PARKING / MOJE SAMOCHODY → ŁADOWNIA pokazuje zatwierdzony PNG posiadanego modelu, trzy paski z konkretnymi wartościami użyte/maksymalne/wolne i listę rzeczywistych partii: towar, ilość, numer zlecenia, miasto rozładunku. Paski zielone, pomarańczowe od 85% wykorzystania; podgląd rozważanej partii ma czerwony pasek przy przekroczeniu danego limitu. Widok przyjętych zleceń pokazuje osobno total, pozostało do odebrania, rezerwację, odebrane, na pokładzie i dostarczone. Filtr „mieści się” dotyczy całego zlecenia w jednym pustym furgonie; podgląd przydziału sumuje faktycznie wybrane partie.

## Dzielenie i łączenie

Duże zlecenie można przyjąć w dotychczasowym limicie trzech niezakończonych. W przydziale gracz wybiera całkowitą liczbę jednostek; domyślnie maksymalną mieszczącą się partię. Po częściowej dostawie zlecenie pozostaje aktywne. Kolejny kurs automatycznie korzysta z prawdziwego powrotu pustego do nadawcy i zatwierdzonej drogi dostawy. Gracz wybiera kolejność. Może też przestawić samochód istniejącym przejazdem pustym. Brak trasy lub paliwa blokuje wyjazd z wyjaśnieniem.

Łączenie jest rzeczywiste, lecz w tym etapie ograniczone do zleceń ze **wspólnym nadawcą i odbiorcą**. Przydział pokazuje wszystkie takie przyjęte zlecenia, ilość każdego wybiera gracz (0 = pomiń). Partie jadą jednym autem, z jednym wspólnym dojazdem, załadunkiem, przejazdem i rozładunkiem. Masę/objętość/palety sumujemy, a paliwo i czas liczymy raz. Limitów nie sprawdzamy osobno dla każdego zlecenia. Inne miasta wymagają osobnych kursów — silnik odrzuca mieszanie różnych punktów, a UI wyjaśnia brak planera wielopunktowego. To świadome ograniczenie zgodne z poleceniem właściciela, pozwalające zachować sprawdzony silnik faz i legalność 306 połączeń OSM. Nie udajemy obsługi doładunku w pośrednim mieście, zmiany trasy w czasie jazdy ani ręcznego przestawiania kolejności przystanków.

Spalanie zachowuje istniejące parametry ekonomii: stawka pusta w dojeździe z pustą ładownią, stawka z ładunkiem w fazie przewozu niezerowej partii. Bez nowego przelicznika spalania liniowo od kg i bez mnożenia zużycia przez liczbę zleceń. Suma przewożonych towarów odpowiada parametrom `active.offer` planu, a źródłowe ceny pozostają w przyjętych zleceniach. Zmęczenie, sen, tankowanie i ETA korzystają z tego samego aktywnego kursu i jednego zegara.

## Rozliczenie

Jednorazowa pełna wypłata dopiero po dostarczeniu wszystkich jednostek konkretnego zlecenia. Częściowy rozładunek ma wpis w historii, z kwotą 0. Końcowe rozliczenie każdego towaru w mieszanym aucie jest niezależne. `completedOfferIds` i `completedAt` pozostają zabezpieczeniami wypłaty; niezakończone części nie zwalniają miejsca w limicie 3.

Po terminie (dotychczasowe 3 dni, granica deadline+1 ms) kara = round(wartość zlecenia × 50% × niedostarczone jednostki / wszystkie jednostki). Jednostki tego samego towaru mają równą część wartości zlecenia. Część będąca w samochodzie również jest niedostarczona. Kara jest jednorazowa, nie rośnie ponownie po kolejnych kursach lub reload. Całkowita wypłata i przyjęta cena nie są arbitralnie zmieniane; kara jest osobnym wpisem historii.

## Migracja i ochrona zapisu

Nowe pola są opcjonalne. Klucz localStorage `pixelcargo-0.1-preview-v1`, IndexedDB, jeden zegar i brak postępu offline pozostają bez zmian. `migrateCargo` wprowadza liczniki na podstawie potwierdzonego bieżącego stanu, bez rekonstrukcji nieznanej historii.

- Stare zlecenie paletyzowane: znana liczba całych palet; rozkład masy i objętości zachowuje zapisane sumy.
- Stara oferta niepaletyzowana bez liczby paczek: jedna **niepodzielna partia historyczna**, wyraźnie opisana „liczba paczek nieznana”. Nie twierdzimy, że to jedna paczka. Nie można wiarygodnie podzielić takiej partii na mniejsze paczki. Jeżeli całość się nie mieści, UI pokazuje rzeczywistą blokadę. Nowe generowane oferty mają już pełne jednostki.
- Dawne zakończone zlecenia są w całości dostarczone na podstawie istniejącego completedAt/ID. Bieżący stary kurs w fazie loaded/unloading potwierdza obecność jego całego ładunku. Przed końcem załadunku nie dopisujemy zapasu na pokładzie.
- Nowe zapisy przechowują partie, wybrane zakresy i liczniki. Zapis podczas załadunku, jazdy, snu czy tankowania nie zmienia liczby towarów. Stary aktywny kurs kończy się dotychczasową ścieżką i ceną, następne używają partii.

## Testy i kontynuacja

Nowe jednostkowe testy obejmują wszystkie pięć modeli, dokładne limity i każde osobne przekroczenie, arytmetykę jednostek, mieszane towary, trzy kursy, karę za resztę, fizyczny załadunek, paliwo i różne kroki czasu, save/reload oraz bezpieczną migrację. Nowe Playwright w 1366×768 i 1920×1080 przechodzą trzy przewozy po rzeczywistych OSM, mieszany ładunek, blokadę nadmiaru palet, widok PNG i pasków, reload w trasie i pojedynczą wypłatę.

Kontrole końcowe i punkt wznowienia w HANDOFF/ROADMAP. Nie rozpoczynać kolejnego etapu. Brak planera wielopunktowego pozostaje jawnym ograniczeniem.
