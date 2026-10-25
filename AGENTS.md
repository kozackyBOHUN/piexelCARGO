# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: Etap 10 — jednostki ładunkowe, rzeczywisty załadunek/rozładunek, dzielenie zleceń, łączenie zgodnych partii i widok ładowni. Baza cc8b20e51147e27f99119195ed065ce857950a2d. Zachować 306 relacji OSM, mechaniki 09, PNG, ekonomię i stare zapisy. Nie zgadywać historycznych ilości paczek; nie zmieniać cen zaakceptowanych zleceń. Przy ryzyku przebudowy ograniczyć łączenie do zgodnych punktów odbioru/dostawy, jawnie dokumentując brak planera wielopunktowego. Po wszystkich testach i obu buildach commit/push wyłącznie feat/preview-gameplay-core, bez merge do main; sprawdzić Pages i zakończyć.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram pokazuje rzeczywiste fazy; edytowalne są tylko przyszłe planowane postoje. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
