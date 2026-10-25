# Rynek zleceń preview

Baza 15e64015b1322fa96aafd45b06af4add7f30dfb0. Docelowa gałąź feat/preview-gameplay-core. Specyfikacja rozdziały 11–13 przeczytana; poniżej jawny zakres demonstracyjny i kompromisy.

## Działanie

Dziesięć suchych towarów: odzież, obuwie, książki, zabawki, elektronika, drobne AGD, meble w paczkach, papier biurowy, karma i konserwy. Każdy ma niezależny profil masy/objętości i mnożnik ceny. Całe partie paczek lub palet mają losową wielkość, bez przelicznika paleta=tona=m³. Brak paletyzacji jest opisany jako „nie dotyczy (paczki)”. Wszystkie trzy limity wybranego furgonu muszą być spełnione. Za duże ładunki są jawnie oznaczone i zablokowane; nie ma transportu dzielonego ani wspólnego załadunku kilku zleceń.

Generator jest deterministyczny (seed z nazwy/bazy, zapisany stan LCG i rosnący numer). Nie używa Math.random ani czasu rzeczywistego. Oferty, ceny, katalog kierunków bez geometrii, rezerwacje, terminy i flagi kar zapisują się w tym samym localStorage. Oferta ma stałą datę wygaśnięcia, nie odnawianą przy renderze. Po przyjęciu lub po pięciu dniach jej slot zajmuje nowa oferta. Przeskok czasu odtwarza kolejne wygaśnięcia według ich faktycznych dat; wyniki są niezależne od kroku symulacji. Wyłącznie kierunki z istniejącego routes.json; brak obliczeń grafu i fikcyjnych dojazdów.

Przyjęcie i rozpoczęcie są osobne. Maksymalnie trzy niezakończone rezerwacje, również podczas trwającego kursu. Termin biegnie trzy dni od przyjęcia, nie od rozpoczęcia. Gracz wybiera przycisk ROZPOCZNIJ KURS; kolejka nie uruchamia się automatycznie. Start wymaga wolnego auta, kierowcy, pojemności, paliwa i zatwierdzonego dojazdu pustego (albo faktycznego postoju w mieście nadania). Brak dojazdu jest opisany; mapa nie teleportuje pojazdu. Katalog nadal ma tylko wcześniej zatwierdzone kierunki, więc nie zapewnia powrotu z każdego miasta.

Po przekroczeniu terminu (pierwsza milisekunda po trzech dniach) zlecenie pozostaje aktywne i otrzymuje jedną karę 50% niedostarczonej wartości, z zaokrągleniem do grosza. Ponieważ obecna mechanika przewozi całe zamówienie jednym kursem, do końca rozładunku niedostarczone jest 100%, a po nim 0%. Nie udajemy dostaw częściowych. Ukończenie dokładnie w terminie nie powoduje kary. Kara jest oddzielnym zdarzeniem finansowym i nie zmniejsza ponownie końcowej wypłaty. Po dostawie pełna zapłata raz; zapisane completedOfferIds i completedAt blokują powtórne rozliczenie. Pełna historia operacji jest dostępna w UI.

Parametry: MARKET_CONFIG w src/preview/market.ts — pięć dni, trzy dni, limit, pula, cena bazowa, stawka/km i kara. Mnożniki towarów w GOODS. Cena zależy od rzeczywistego dystansu, rodzaju, wielkości i niewielkiego losowego rozrzutu; jest stała po wygenerowaniu. Nie zmieniono cen pojazdów, paliwa, pensji, odsetek ani ich mechaniki.

## Pula i ograniczenia wobec pełnej specyfikacji

To rynek zatwierdzonego podzbioru tras, nie rynek ogólnopolski. Początkowo i stale dziesięć ofert na każdy obsługiwany punkt nadania (obecnie trzy, łącznie 30). Ten limit jest świadomym kompromisem preview wobec pełnej puli floor(populacja/1000) z rozdziału 12. Obecny katalog miast nie zawiera populacji; nie dodano fikcyjnych danych ludnościowych. Robocze względne wagi popytu Kraków:Tarnów:Zakopane:Bochnia są skonfigurowane w generatorze; to przybliżenie proporcji wielkości miast, nie nowy zbiór statystyczny. Losowanie odbywa się tylko między istniejącymi odbiorcami danego nadawcy. Zwalnia slot po wygaśnięciu/przyjęciu i przydziela nowy, bez nieograniczonego narastania ofert. Dokładne kwoty odbioru zależne od populacji nie są zaimplementowane: niepełny skierowany katalog uniemożliwia pełne bilansowanie krajowe. Nie jest to równomierne losowanie wszystkich miast. W przyszłości wymaga jawnych danych ludności i większego zatwierdzonego katalogu, bez zgody na ich dodawanie w tym zadaniu.

Nie ma dzielenia zleceń, wielu ładunków naraz, anulowania ani edytowalnego planera. Ilustracje i CSS pozostają istniejące (bez nowych grafik towarów, ze względu na równoległą pracę grafika). UI pokazuje oferty dostępne oddzielnie od przyjętych; filtry nadania/wielkości/dopasowania do auta i sortowanie ceny/masy/wygaśnięcia. Lista ograniczona do 30 wyników, czyli całej obecnej puli.

## Zgodność i testy

Jeden dotychczasowy zegar, paliwo, pensje, mapę i harmonogram zachowano. Pole market jest opcjonalne: stare zapisy inicjalizują rynek bez zmiany firmy i czasu. Trwający stary transport staje się przyjętym zleceniem z terminem wyprowadzonym ze startedAt. Stare zakończone przewozy nie otrzymują nowych kar. RESTART FIRMY usuwa również rynek i rezerwacje.

Testy jednostkowe sprawdzają profile, trasy, determinizm, wygaśnięcia, trzy limity pojemności, rezerwacje podczas jazdy, ręczną kolejność, granicę trzech dni, karę/wypłatę raz i migrację aktywnego zapisu. Playwright sprawdza trzy rezerwacje, reload, wybór drugiego kursu, jazdę, spóźnienie oczekujących zleceń i pięciodniową wymianę ofert. Dotychczasowe scenariusze gry zachowano, dodając osobny krok rozpoczęcia po przyjęciu. Produkcyjny test Pages nadal sprawdza zasoby, firmę, zapis i prawdziwą trasę.

Końcowe kontrole: npm run typecheck OK; npm test 93/93 (12 plików); npm run build i build:pages OK; Playwright unified 33/33, freight 1/1, Pages 1/1 (łącznie 35). Pełna płatna dostawa, zapis w trasie, ruch auta, harmonogram i restart potwierdzone.
