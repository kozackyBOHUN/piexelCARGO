# Etap 08 — grafika i osiem poprawek

Baza d9610db409fd6405e21df1998a2caf10023a40ad, gałąź feat/preview-gameplay-core. Wymagania: PixelCargo_Etap_08.md. Wyłącznie najnowsza zatwierdzona paczka; nie przeniesiono wcześniejszych szkiców integracji ani odrzuconych obrazów. Układ MAPA/BAZA i szerokiego zarządzania z etapu 07 zachowany.

## 1. Zatwierdzona grafika

public/art/ zawiera dokładnie 52 oryginalne PNG i dostarczone manifest.json/appearance_mapping.json. SHA-256 i rozmiary każdego pliku są testowane, bez przeskalowywania plików źródłowych. Rejestr artAssets mapuje oferty 1/2/3/4/5 odpowiednio na zatwierdzone pliki van-used-6/7/8/14/15. ID, nazwy, ceny, pojemność i parametry modeli nie zmieniły się. Nie utworzono fikcyjnych dubli 1–5 ani ofert dodatkowych modeli.

PNG są na giełdzie i we flocie, dziesięć ikon w tabelach ładunków, cztery osobne warstwy w izometrycznej bazie, driver-01 w Kadrach. Pozostałe pięć portretów to biblioteka, nie nowi zatrudnieni kierowcy. Ikony menu/przycisków/statusów korzystają z paczki UI; ikony snu/zmęczenia pozostają rezerwą, ponieważ tych mechanik nie ma. Stany ostrzeżeń wynikają z danych. Skalowanie CSS image-rendering:pixelated i object-fit:contain; ścieżki relatywne do Vite BASE_URL. Starszy pojazd bez identyfikowalnych specs nie otrzymuje zmyślonego modelu. Oryginalna instrukcja źródłowa: README_ART_08.md.

## 2. Jeden zegar od założenia firmy

GameRuntime zachowuje pojedynczy SessionClock i istniejący ticker. PreviewSession blokuje tylko naliczanie symulacji przed utworzeniem firmy. Nowa gra i restart ustawiają dzień 1 / 06:00; kliknięcie ZAŁÓŻ FIRMĘ włącza istniejący zegar z nowym punktem monotonicznym, bez doliczania czasu formularza. Po starcie nadal 60×, menu nie pauzuje. Przed akcją i zapisem firmy (w tym pagehide) próbkujemy ten sam zegar monotoniczny, dzięki czemu częściowy ostatni tick nie ginie przy odświeżeniu i nie jest naliczany drugi raz. Autosave może działać przed startem, ale nie przesuwa czasu. Stara firma wczytuje dokładnie własny zapisany czas — nie resetuje go do 06:00. Techniczny ?dev=1 pozostaje oddzielną diagnostyką, z dotychczasowymi testami zegara. Schemat IndexedDB, klucz zapisu firmy i brak offline progress bez zmian.

## 3. Samouczek

Nowa firma zapisuje opcjonalne pole tutorial. Kroki wynikają z faktycznych danych: pojazd, zatrudniony kierowca, przyjęte zlecenie, otwarty przydział, rozpoczęty przewóz i mapa. Podświetlane są odpowiednie ikony, podzakładki i przyciski, bez zasłaniania interakcji. Dla pierwszej oferty domyślnie wybierane jest miasto aktualnego auta i filtr pasującego ładunku. Gracz może zmienić filtry.

Pomiń samouczek jest trwałe. Stare firmy bez pola tutorial nie otrzymują ponownie instrukcji. Odświeżenie nie cofa zakupu/rekrutacji/rezerwacji. Sam przydział jest stanem okna: jeśli nie rozpoczęto kursu, po reload można ponownie wskazać auto (krok 4), nie powtarzając wcześniejszych czynności. Mapa otwiera się automatycznie tylko przy pierwszym rozpoczęciu obserwacji; zapisane mapShown zapobiega ponownemu przełączaniu widoków po reload. Instrukcja nie zatrzymuje transportu. Ręczny pusty przejazd nie udaje zrealizowania kroków dostawy.

## 4. Profilowe markery

VehicleSilhouette zawiera trzy różne pikselowe profile: bus/furgon, ciężarówka, ciągnik z naczepą. Aktywny jest wyłącznie furgon. Nie rozciąga się ukośnego PNG giełdy do profilu. Symbol ma stały rozmiar ekranu, klikany obszar i dotychczasową projekcję/kamerę; położenie nadal wynika z geometrii OSM i czasu fazy. Szczegóły pojazdu, zoom i przesuwanie pozostają działające.

## 5. Zweryfikowane trasy i kontynuacja gry

Rzeczywiście uruchomiono **17 miast i 135 kierunków**. Cztery priorytetowe miasta mają oba kierunki do/z Krakowa, w tym Zakopane → Kraków (104082,8938 m, geometria źródłowa). Nie uruchomiono Oświęcimia (brak potwierdzonych wjazdów w danych) i Gorlic (brak dwukierunkowej składowej po odrzuceniu dróg z nieocenionymi warunkami). Warstwa geograficzna nadal pokazuje 19 prawdziwych miast; nie jest to deklaracja 19 aktywnych punktów zleceń.

Każdy dopuszczony kierunek został zrekonstruowany punkt po punkcie z rzeczywistych skierowanych krawędzi grafu. Sprawdzono jednoznaczność, kierunek, spójność węzłów, dokładną polilinię, snapy miast, sumy metrów i sekund, dostęp, wymiary i restrykcje via-node/via-way osobnym audytorem. Każda droga z tagiem :conditional została konserwatywnie wyłączona z dopuszczania (193 drogi w źródle). Pojedyncza relacja z taxi:conditional ma zwykły no_left_turn obowiązujący furgon; wyjątek taxi nie jest używany.

Niepełne 16545970/16545971 i pozostałe nieobsługiwane relacje nie zostały uzupełnione ani zignorowane. Alternatywę Zakopane → Kraków znaleziono po konserwatywnym zamknięciu wszystkich wskazanych dróg nieobsługiwanych/konserwatywnych relacji, a potem zbadano oddzielnym audytem. Następnie zachowano tylko silnie połączoną składową Krakowa, z możliwością wyjazdu i powrotu, bez jednokierunkowych pułapek.

To weryfikacja względem konkretnego lokalnego snapshotu OSM, nie gwarancja aktualnych remontów i przepisów w czasie rzeczywistym. Graf i jego źródłowy hash nie zmieniły się. Nie pobierano nowego PBF i nie generowano fikcyjnych dróg. Audyt i routing są wyłącznie offline, bez importu routera do gry. Przeglądarka pobiera minifikowany katalog tras (~7,3 MB), nie graf. Pełna geometria bez prostych zamienników, zaokrąglania czy upraszczania.

Raport: reports/08-routes.json (135 unikalnych pozytywnych wyników, hash grafu/katalogu, profil, diagnostyka i odrzucenia). Źródło i licencja pozostają OSM / ODbL-1.0, z istniejącym manifestem public/roads/demo/manifest.json i udostępnionym grafem. Źródłowy kod routingu/audytora pochodzi z wcześniej sprawdzonej gałęzi 05B, commit 3519738; kopia w scripts/routes08 służy tylko odtwarzaniu kontroli.

Odtworzenie: z dostarczonego ZIP-a wypakować wewnętrzny PixelCargo_Malopolska_19_miast_trasy.zip, jego routes.json zapisać jako /tmp/stage08-candidates.json, manifest.json jako /tmp/stage08-route-manifest.json; następnie node --max-old-space-size=3072 scripts/verify-routes08.mjs. Skrypt sprawdza SHA-256 grafu i odmawia dopuszczenia niewyjaśnionych ścieżek. Nie wymaga generatora OSM. Wynik zależy również od dotychczasowego katalogu wcześniej dopuszczonych tras, który jest ponownie audytowany; przy dokładnym odtwarzaniu należy wskazać ten sam katalog wejściowy.

Każde uruchomione miasto ma stałą pulę dziesięciu odnawianych ofert (170 łącznie). Stare oferty/zlecenia zachowują ceny i terminy; katalog metadanych rozszerza się raz, bez re-seedowania istniejącego rynku. Priorytetowe zatwierdzone kierunki w danym mieście mają rezerwowane małe oferty, a pozostałe sloty korzystają z ważonego generatora. Wagi popytu to parametry robocze, nie dopisane statystyki ludności. Wzory stawek i kosztów pozostały te same. Przejazd pusty w Parking / Moje samochody ma rzeczywistą drogę, czas i spalanie puste; nie ładuje towaru, nie wypłaca pieniędzy i nie zalicza zlecenia. Brak trasy/paliwa blokuje wyjazd.

## 6. Dlaczego auto nie może ruszyć

Jeden dispatchReadiness jest używany przez domenę i UI: auto, kierowca, zajętość, trzy niezależne limity ładunku, trasa dojazdu/dostawy i dokładne zapotrzebowanie na paliwo. Przy niedostępnym przydziale widoczna jest przyczyna i krótka wskazówka. UI nie wymyśla powodów ani nie aktywuje przycisku dla kursu, który silnik odrzuciłby z tych samych przyczyn.

## 7. Płynna oś

W automatycznym śledzeniu TERAZ jest stale na 25%. Okno obejmuje 4 godziny gry, z 1 godziną przeszłości i 3 przyszłości. Pozycje bloków, dat i linii siatki wynikają z aktualnego czasu symulacji, a przejścia CSS interpolują kolejne ticki; brak nowego zegara lub skoków co godzinę. Skala jest taka sama dla czynności; jazda zielona, pusta pomarańczowa, załadunek niebieski, rozładunek fioletowy, postój szary. Zero czasu pozostaje zerem w danych i opisie.

Oś działa w 1 AUTO, 5 AUT i PEŁNY EKRAN. Można ją przesuwać przeciąganiem lub strzałkami/horyzontalnym kółkiem; TERAZ wraca do śledzenia. Podczas celowego przeglądania przesuniętego okna stały punkt odniesienia jest opisany PODGLĄD, żeby nie nazywać przeglądanego historycznego czasu bieżącą godziną. Sam zegar gry cały czas działa.

Opcjonalne completedPlans zapisuje kompaktowe rzeczywiste czasy zakończonych faz, bez duplikowania geometrii. Pozwala wrócić do przeszłych kursów także po kolejnym przewozie/pustym przejeździe. Starszy zapis zachowuje tylko znaną historię lastTransport — nie odtwarzamy zmyślonych wcześniejszych faz. Kierowca, pieniądze i paliwo nie są naliczane przez oś. Plan pozostaje tylko do odczytu; brak odpoczynku i przeciągania tankowania.

## 8. Finanse

Historia jest prezentowana od najnowszego czasu; przy równym czasie najpóźniej wykonana operacja jest pierwsza. Sortowanie nie mutuje zapisanego rejestru, kwot ani zasad rozliczeń. Kredyt i spłaty nadal są przepływami, nie przychodem operacyjnym.

## Weryfikacja i dalszy punkt

Zachowano stare testy i dodano testy PNG/hash/mapowania, bramek zegara, gotowości przydziału, pustego przejazdu, historii planów, migracji rynku, samouczka, sortowania transakcji i nowej składowej tras. Playwright w obu rozdzielczościach wykonuje od formularza i pełnych sześciu kroków do dostawy w Zakopanem, odświeżenia, dostępnego powrotu, tankowania i powrotu pustego bez wypłaty. Sprawdza również wszystkie PNG i ruch pod TERAZ; test produkcyjny sprawdza 52 ścieżki pod /piexelCARGO/.

Po commit/push tylko na feat/preview-gameplay-core potwierdzić Pages dla konkretnego SHA i zakończyć. Nie uruchamiać następnego etapu ani integrować starszych, odrzuconych paczek.

Końcowe kontrole: TypeScript OK; npm test 105/105 (16 plików); oba buildy OK; Playwright stage08 41/41 plus produkcyjny Pages 1/1 (łącznie 42 scenariusze). Dwa rozmiary okna, wszystkie PNG, pełny samouczek/dostawa do Zakopanego/powrót pusty, zapis częściowego ticka i wcześniejsze regresje zaliczone. SHA-256 katalogu tras zgadza się z raportem. Zrzuty: docs/screenshots/08/.

Kontrola publikacji wykazała Cache-Control: max-age=600 dla routes.json na Pages. Fetch katalogu używa cache:no-cache, aby rewalidować ETag przy starcie i nie uruchamiać starszej siatki z cache przeglądarki. Nie zmienia to samych tras ani zapisu.

Domknięcie publikacji: cache katalogu jest rewalidowany, na mapie widnieje bezpośredni podpis © OpenStreetMap contributors. Ponowne TypeScript/build/build:pages oraz Playwright 41/41 i Pages 1/1 zaliczone; testy jednostkowe nadal 105/105.
