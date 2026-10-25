# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: rozbudowa rynku zleceń na feat/preview-gameplay-core, baza 15e64015b1322fa96aafd45b06af4add7f30dfb0. Szczegóły docs/FREIGHT_MARKET.md. Dopuszczone: generator suchych towarów, trwałe oferty, rezerwacje maksymalnie trzech zleceń, ręczne rozpoczęcie kursu, terminy, jednorazowe kary i wypłaty, filtry. Nie zmieniać CSS, kolorów, grafik, budynków ani wyglądu pojazdów; grafik pracuje równolegle na feat/pixelcargo-art-assets. Nie zmieniać mapy, OSM ani pozostałej ekonomii. Po zaliczonych testach commit/push tylko do feat/preview-gameplay-core, bez merge do main; następnie czekać na polecenie.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram jest tylko do odczytu, z rzeczywistych faz transportu. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
