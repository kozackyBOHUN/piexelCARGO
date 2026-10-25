# Stan przekazania
Ostatni w pełni ukończony punkt: **01**.

Działa jeden projekt React + TypeScript + Vite. Kontrakty: src/domain/models.ts; konfiguracja: src/core/config.ts; stan początkowy: src/core/state.ts. Czas w milisekundach gry od poniedziałku 00:00 (start 06:00), pieniądze w groszach. Brak firmy i kredytu.

Weryfikacja 01: npm test — 1/1; npm run typecheck — OK; npm run build — OK; npm run test:e2e — 1/1 w systemowym Chromium; dev uruchomiony i HTTP sprawdzone. Naprawiono rozdzielenie zbiorów testów Vitest/Playwright. Cache npm w tym środowisku: --cache /tmp/pixelcargo-npm-cache (domyślny katalog domowy nie jest zapisywalny).

Brak znanych błędów punktu 01. Następny krok: **02A**, czysty silnik komend, RNG i zegar niezależny od Reacta. Nie zaczynać projektu ponownie. Zakres 04–18 zablokowany do osobnego polecenia użytkownika.
