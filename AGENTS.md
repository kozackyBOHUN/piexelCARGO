# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Bieżący zakres: Etap 11 — ostateczna naprawa wyboru tras Małopolski według docs/etap11/PROMPT_DO_CODEXA.md. Baza 92ff5c46eaa334f6ad6f7ec6ab03bb1bafe32d25. Wykorzystać paczkę i autorytatywne certyfikaty 08/09; nie pogarszać 135 dawnych tras. Wymagane 342 niezależne audyty i porównanie pełnego grafu, 19 miast z Gorlicami. Przy brakach raportować nieukończone z dokładną listą blokad. Nie zmieniać ładunków, ekonomii, mechanik, PNG ani aktywnych zapisanych geometrii. Nie pobierać PBF jeśli istniejący snapshot wystarcza. Po testach commit/push tylko feat/preview-gameplay-core bez merge do main, sprawdzić faktyczne Pages i zatrzymać się.

Zachowaj dotychczasowe zapisy i RESTART FIRMY, mapę i jej wspólną projekcję/kamerę, IndexedDB, import/eksport i blokadę kart. Stan firmy pozostaje kompatybilny z pixelcargo-0.1-preview-v1. / i /?preview=1 to ta sama gra; /?dev=1 to historyczna diagnostyka. Harmonogram pokazuje rzeczywiste fazy; edytowalne są tylko przyszłe planowane postoje. Historyczna roadmapa nie stanowi upoważnienia do kolejnych prac.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
