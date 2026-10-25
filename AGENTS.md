# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: połączenie istniejącej mapy, firmy, floty, rynku i harmonogramu w jedną grę na feat/preview-gameplay-core. Jeden czas GameRuntime.session.time; PreviewSession synchronizuje istniejący zapis firmy bez postępu offline. Szczegóły: docs/UNIFIED_GAME.md. Nie zmieniać ekonomii, giełdy, tras ani danych OSM. Nie rozpoczynać kolejnych etapów. Po testach, commit i push tylko na wskazaną gałąź, bez merge do main; następnie czekać na polecenie.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram jest tylko do odczytu, z rzeczywistych faz transportu. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
