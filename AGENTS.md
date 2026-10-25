# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: Etap 07 — organizacja nawigacji i harmonogramu na bazie 07ca6179a286ddd65ffa290b26d2bfd606781de6. Duża MAPA/BAZA z paskiem ikon, zarządzanie około 2/3 szerokości, tabela zleceń bez przesuwania poziomego przy 1366×768, harmonogram 1 AUTO / 5 AUT / PEŁNY EKRAN i zmiana wysokości przez uchwyt. Preferencje UI są osobne od zapisu gry. Nie zmieniać mechaniki, ekonomii, czasu, tras ani rynku. NIE integrować paczek PNG (niezatwierdzone); zmiany z poprzedniego zadania pozostają w osobnym worktree pixelcargo-art-integration i nie trafiają na gałąź. Nie ruszać gałęzi grafika ani main. Po testach commit/push wyłącznie na feat/preview-gameplay-core, sprawdzić Pages i zakończyć.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram jest tylko do odczytu, z rzeczywistych faz transportu. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
