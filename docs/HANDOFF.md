# Stan przekazania
Ostatni w pełni ukończony punkt: **02A**.

Działa fundament 01 i czysty silnik czasu (src/core/engine.ts), centralny GameSession i SessionClock (src/core/session.ts). Zegar startuje w poniedziałek o 06:00, 1 sekunda realna = 1 minuta gry. Monotoniczne próbki performance.now nadrabiają tło tej samej sesji; duplikaty i cofnięcia są ignorowane, ułamki zachowywane. Numer sekwencji komendy jest częścią stanu i chroni przed powtórzeniem naliczenia. Mulberry32 ma jawne ziarno i stan; brak losowania zależnego od renderu. Kwoty: grosze, czas: milisekundy gry. Firma nadal null, brak kredytu.

Weryfikacja 02A: npm test — 7/7 (start, przelicznik, doba/tydzień, throttling, duplikaty, restart zegara, RNG); npm run typecheck — OK; npm run build — OK; npm run test:e2e — 2/2 w systemowym Chromium (start i rzeczywisty postęp zegara). Brak znanych błędów. Cache npm w środowisku: --cache /tmp/pixelcargo-npm-cache.

Następny krok: **02B** — IndexedDB, walidacja wersji/importu, brak postępu offline, autosave i wyłączna blokada sesji między kartami. Kontynuować istniejące moduły. Etapy 04–18 wymagają osobnego polecenia.
