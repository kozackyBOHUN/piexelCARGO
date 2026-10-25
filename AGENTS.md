# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: Etap 09 — docs/etap09/README_DLA_CODEXA.md i SPEC_MECHANIKI_09.md, baza 367d153ef5403ddcf92ddd4e4d30b5b8ff7f5bce. Audyt przygotowanych odcinków Małopolski, legalne składanie z zachowaniem restrykcji na granicach, kredyt, zmęczenie i niepłatny sen, planowane tankowanie i odpoczynek, kompaktowy harmonogram. Nie generować od nowa tras, nie usuwać poprzednich 135 zatwierdzonych kierunków. Gorlice bez potwierdzenia pozostają wyłączone. Zachować grafikę, ekonomię poza jawnymi zmianami 09, zapisy i jeden zegar. Graf OSM i audyt wyłącznie offline. Po pełnych testach commit/push tylko feat/preview-gameplay-core, bez merge do main; potwierdzić Pages i zakończyć.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram pokazuje rzeczywiste fazy; edytowalne są tylko przyszłe planowane postoje. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
