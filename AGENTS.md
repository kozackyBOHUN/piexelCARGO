# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Obecny zakres: Faza II, **04B — interaktywna obsługa mapy Polski**: przeciąganie z ograniczeniem do obszaru kraju, zoom kółkiem pod kursorem i przyciskami, limit około 200 m/piksel CSS z korektą Web Mercator, reset Polska/demo, wyszukiwanie 19 miast z obsługą polskich znaków i klawiatury, etykiety zależne od zoomu oraz rzeczywista skala odległości. Rozwijaj PolandMap.tsx, projection.ts i labels.ts. Faza I i 04A muszą działać bez regresji. Stan kamery i wyboru miasta pozostaje w UI; nie zmieniaj zegara, IndexedDB ani schematu zapisu. Zachowaj istniejące dane i wspólną projekcję wszystkich warstw. Nie realizuj 04C, dróg, wyznaczania tras, nowych danych ogólnopolskich, transportów ani ekonomii bez osobnego polecenia.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
