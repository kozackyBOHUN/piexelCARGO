# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżące zlecenie: naprawa no_u_turn między różnymi ways i weryfikacja sześciu tras preview na feat/05b-routing-prep. Poprawka 3420948 gotowa; eksport preview zatrzymany z powodu niekompletnych relacji 16545970/16545971. Nie rozpoczynać 05C/05D, mechaniki gry ani nowych napraw bez kolejnego polecenia. Szczegóły w docs/PixelCargo_05B_PRACE_ROBOCZE.md. Poniższy zakres 05A–D opisuje historyczny plan, nie zgodę na kontynuację obecnego zadania.

Status: **04C ukończony**. Aktualne polecenie dopuszcza **05A → 05B → 05C → 05D**, zgodnie z docs/PixelCargo_Etap_05.md. Nie rozpoczynaj 06.

05A: rzeczywisty graf OSM Małopolski i przypięcie 19 istniejących miast. 05B: lokalny najkrótszy routing po długości, kierunki/dostęp/restrykcje skrętów, pełna geometria i API położenia po dystansie. 05C: Canvas dróg, demonstracyjny planer oraz opcjonalne powiększenie istniejącej mapy. 05D: ciągły graf wszystkich 16 województw, kompaktowe dane, indeks, Worker i rzeczywiste pomiary. Każdy ukończony podetap: testy, HANDOFF/ROADMAP, osobny commit oraz push bez force-push, jeśli historia zgodna.

Najpierw pozyskaj prawdziwe dane. Nie rysuj fikcyjnych połączeń, nie traktuj przecięć geometrii jako węzłów. Zachowaj OSM IDs, dostęp, kierunki, geometrię i długości. Udokumentuj niesprawdzane ograniczenia, pochodzenie i ODbL; przetworzona baza musi być dostępna zgodnie z licencją. Źródła i pomiary: docs/ROAD_DATA.md. Dane źródłowe PBF przechowuj poza repozytorium. Blokada pobrania nie oznacza ukończenia 05A. Przy blokadzie lub limicie zapisz dokładny punkt wznowienia; nie przechodź do następnego podetapu przed spełnieniem kryteriów poprzedniego.

Zachowaj Fazę I i 04A–04C, dane granic/miast/krajobrazu, wspólną projekcję i kamerę, zegar, IndexedDB, import/eksport, blokadę kart oraz schemat zapisu. Stan planera i kamery pozostaje w UI. Routing jest osobną usługą świata, nie fikcyjnym transportem w GameState. Nie uruchamiaj pojazdów, rynku, kierowców ani ekonomii; nie dodawaj pełnego katalogu miast. Zakres i źródłowa specyfikacja pozostają nadrzędnym punktem odniesienia.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
