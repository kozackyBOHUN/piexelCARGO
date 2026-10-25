# PixelCargo - etap 09: Dane lokalne przygotowane przed zadaniem

**Zawartość**: 19 miast, 45 zaprojektowanych par połączeń sąsiednich; **86/90** kierunkowych przebiegów obliczonych na autentycznym kierunkowym grafie OSM, przy ostrożnych zamknięciach niewyjaśnionych restrykcji oraz dróg warunkowych istotnych dla furgonu; **18/19** miast w połączonej sieci kandydackiej (306/306 par), jedna propozycja naprawy Oświęcimia.

**Ważne: nie jest to jeszcze produkt po NIEZALEŻNYM audycie z etapu 08.** Codex ma przetestować 86 gotowych przebiegów `adjacency_routes_ready_candidates.json` istniejącym `scripts/routes08/audit.ts` przed ich aktywowaniem; odrzucone wykluczyć, nie „naprawiać” fikcyjną prostą drogą. Przeprowadzenie audytu to czynność bezpieczeństwa technicznego, a nie ponowne szukanie tras.

Gorlice nie mają w pakiecie dopuszczonego dwukierunkowego dojścia: brak 4 kierunków z/do Tarnowa i Nowego Sącza. Konserwatywny routing źródłowego grafu nie znajduje ich; nie deklarować 19/19 działających. Przyczyna wymaga niezależnej kontroli danych warunkowego ruchu/relacji i być może poprawionego snapu. Nie zakładać, że nie ma realnej drogi.

Przy Oświęcimiu wybrano **OSM node 599998162** na istniejącej drodze 38.7 m od starego `node 1744170406`; pierwotny snap w jednokierunkowym fragmencie uniemożliwiał dojazd. Dla nowego snapu wyznaczono dojazd i powrót po grafie w konserwatywnym profilu furgonu. `cities_19_with_snap_override.json` i `snap_override_proposal.json` zawierają poprawkę, bez teleportowania i bez łamania geometrii.

`adjacency_routes_ready_candidates.json` zawiera samodzielne 86 przebiegów (geometry [lon,lat], metry, sekundy, odrębny kierunek A>B) gotowych do walidacji/zaimportowania. `all_306_city_routes_index.json` i `complete_routes_matrix_18_cities.csv` są już policzonymi połączeniami ogólnymi, ale *składanymi z odcinków* i wymagającymi tego samego audytu (w tym zgodności skrętów na granicach odcinków). `COUNTY_ROUTER_FOR_CODEX.ts` jest gotową implementacją Dijkstry po 19 miastach, nie odtwarza żadnej geometrii z sufitu.

Nie kasuj istniejących 135 audytowanych tras w grze bez pozytywnego porównania, a aktualne Oświęcim/Gorlice pozostają wyłączone do audytu. Kod ekonomii/mechanik wyłącznie według `SPEC_MECHANIKI_09.md`.

Źródło OSM: malopolskie-261024.osm.pbf, graf `05A-v1-a0575a3f5bd99f19-98733c38`, SHA grafu e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f. © OpenStreetMap contributors, ODbL 1.0. Nie mieszaj licencji ODbL z niezależnym kodem gry.

Uruchom `python VERIFY_DATA.py` i istniejący audyt stage08 na rzeczywistym grafie w repo. Zachowaj brak merge do main.
