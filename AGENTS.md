# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: Etap 06 — nowy interfejs według zatwierdzonego obrazu i docs/PixelCargo_Etap_06_UI.md; baza e3b66f2e05287185a1a050dc87904e0fba72ee5d, gałąź feat/preview-gameplay-core. Dopuszczona przebudowa układu/CSS i prezentacji danych, bez zmiany ekonomii, mechaniki, schematu zapisów ani danych OSM. MAPA/BAZA niezależne od panelu menu, harmonogram stale widoczny. Nie modyfikować gałęzi feat/pixelcargo-art-assets ani nie scalać do main. Zachować istniejące grafiki; opcjonalne PNG podłącza src/preview/artAssets.ts. Po testach commit/push wyłącznie na feat/preview-gameplay-core, sprawdzić status Pages i zakończyć.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram jest tylko do odczytu, z rzeczywistych faz transportu. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
