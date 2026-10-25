# Stabilizacja preview — feat/preview-gameplay-core

Baza: `1b361852066205a2c7139ec9f1a1ff7ae91e1b0e`. Zakres wyłącznie zapisu,
odczytu, kontynuowania przewozu i potwierdzenia poprawki paliwa. Nie zmieniono
tras/grafów OSM, routingu, stawek, cen, prędkości ani mechaniki zleceń.

## Wykryty i naprawiony problem

Zapis okresowy po dwóch sekundach powstawał, ale oba nowe testy Playwright
odtworzyły utratę firmy i aktywnego kursu po reload. Preview czytał localStorage
przed zakończeniem inicjalizacji GameRuntime/IndexedDB. Warunek saved.time <=
time odrzucał poprawny zapis jako „z przyszłości” względem startowego 06:00.
Różne częstotliwości obu zapisów powodowały również przesunięcie czasu.

Poprawka w PreviewApp.tsx:
- montaż aktywnego preview dopiero po uzyskaniu własności sesji i odczycie IndexedDB;
- zachowanie prawidłowego zapisu preview niezależnie od opóźnienia zapisu zegara;
- wznowienie od dokładnie zapisanego czasu preview i dalsze naliczanie według
  przyrostów wspólnego zegara; bez offline progress, zmian silnika i schematu IndexedDB;
- nagłówek i reset używają tego samego wznowionego czasu.

Okresowy zapis 1 s i flush przy pagehide/unmount były już w commicie wejściowym.
Nie zmieniano ich częstotliwości ani zasad płatności.

## Regresje i wynik

`npm run typecheck`: OK. `npm test`: **79/79** (7 preview, wszystkie stare testy
zachowane). `npm run build`: OK.

`npx playwright test --config playwright.preview.config.ts`: **2/2**.
Konfiguracja uruchamia tylko e2e/preview.spec.ts na osobnym porcie 5191, bez
ryzyka użycia serwera innego worktree. Nie uruchamiano pełnego Playwright.

1. Założenie firmy, zakup furgonu, zatrudnienie kierowcy, zapis po 2,1 s,
   odświeżenie: firma, baza, kredyt, furgon i kierowca zachowane; saldo
   zmniejsza się wyłącznie o prawidłowo naliczoną pensję.
2. Przyjęcie rzeczywistego kursu Kraków → Tarnów; przejście do jazdy, reload,
   zachowanie ID kursu, etapu, postępu, paliwa i przebiegu. Pełna dostawa
   przez przyspieszenie zegara wyłącznie w teście Playwright, ponowny reload:
   jedno ukończone zlecenie, jeden przychód, poprawne saldo i miasto docelowe.
   Brak błędów pageerror.

Test domeny na tej samej istniejącej trasie obejmuje kroki: cały przewóz naraz,
15000, 1000, 250 i 17003 ms gry, wraz z serializacją/odczytem w połowie jazdy.
Spalanie identyczne i całkowite: **9923 ml**; pozostałe paliwo **10077 ml**,
bez wartości ujemnych. Saldo i naliczone wynagrodzenie identyczne, przebieg
zgodny do 0,000001 m (tolerancja arytmetyki zmiennoprzecinkowej). Jedna wypłata.
Poprawka narastającego zużycia paliwa z commita wejściowego działa — nie była
potrzebna kolejna zmiana ekonomii lub parametrów spalania.

Preview nadaje się do normalnego testowego grania w obecnym zakresie.
To nie deklaracja ukończenia wszystkich etapów 0.1. Dalsze prace wyłącznie
po nowym poleceniu. Nie scalano do main.
