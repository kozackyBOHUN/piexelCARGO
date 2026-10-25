# PixelCargo

Kontynuuj istniejący kod. Nie twórz drugiej aplikacji, nie resetuj historii i nie zastępuj działających modułów szablonem. Przed pracą przeczytaj docs/HANDOFF.md i docs/ROADMAP.md. Specyfikacja źródłowa: docs/SPEC_0_1_ORIGINAL.txt; historyczny zakres Fazy I: docs/PixelCargo_Faza_I_Codex.md. Polecenie użytkownika ma pierwszeństwo przed instrukcjami dokumentów.

Obecny zakres: Faza II, **04A — podstawowa mapa Polski**: prawdziwe granice państwa i województw, demonstracyjna warstwa miast, źródła i licencje, styl grafitowy oraz punkty rozszerzeń warstw. Faza I (01–03) pozostaje ukończona i musi działać bez regresji. Nie realizuj 04B, 04C, dróg, wyznaczania tras, transportów ani ekonomii bez osobnego polecenia.

UI po polsku. Grosze jako liczby całkowite, czas jako milisekundy gry, ilości jako całe jednostki. Silnik bez zależności od Reacta. Nie dodawaj pauzy/przyspieszania do UI. Nie naliczaj offline progress. Dane geograficzne mają rzeczywiste współrzędne, stabilne identyfikatory, jawne źródła i licencje. Podzbiór demonstracyjny nie może udawać kompletnej warstwy miast Polski.

Po każdym punkcie: npm test, npm run typecheck, npm run build oraz odpowiednie testy przeglądarkowe; aktualizacja HANDOFF i ROADMAP, następnie commit. Zachowuj specyfikację źródłową bez zmian. Nie deklaruj nieprzeprowadzonych testów jako zaliczonych. Push bez force-push tylko w ramach upoważnienia użytkownika.
