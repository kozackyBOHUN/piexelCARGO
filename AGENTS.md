# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Obecny zakres: Faza II, **04C — krajobraz Polski, pixel art i optymalizacja mapy**. Pracuj kolejno: 04C-1 kontrola wizualna i zrzuty przed zmianami; 04C-2 prawdziwe rzeki/jeziora; 04C-3 prawdziwe lasy i rzeźba z danych wysokościowych; 04C-4 oprawa, LOD/culling/cache, testy i końcowe zrzuty. Każdy podetap kończ działającym kodem, testami i commitem. Źródło i pełne wymagania: docs/PixelCargo_Etap_04C.md. Zrzuty reprezentatywne zapisuj w docs/screenshots/04C/. Dokumentuj rzeczywisty zakres danych, licencje, wersje i regenerację. Nie wymyślaj geometrii, lasów ani wysokości. Wszystkie warstwy mają wspólną projekcję i kamerę, bez kosztownej przebudowy na każdy ruch.

Zachowaj Fazę I oraz 04A/04B, istniejące dane geograficzne, zegar, IndexedDB, import/eksport, blokadę kart i schemat zapisu. Stan mapy pozostaje w UI. Nie realizuj etapu 05, dróg, routingu, symulacji pojazdów, ekonomii, rynku, kierowców ani pełnego katalogu miast bez osobnego polecenia.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
