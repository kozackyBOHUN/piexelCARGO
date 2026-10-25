# Stan przekazania
Ostatni w pełni ukończony punkt: **02B**.

Działa 01 i 02A oraz trwały zapis w IndexedDB (pixelcargo-v1 / saves / current). SaveEnvelope schemat 1 zawiera saveId, savedAt i pełny GameState z rngState i commandSequence. src/persistence/schema.ts waliduje import (limit 2 MB, wersja, zakresy i struktura); przygotowany rejestr migracji jest pusty, bo wcześniejszych formatów nie ma. Obsługiwany stan Fazy I ma company=null i tylko zdarzenie startowe. Nie deklarujemy kompatybilności z przyszłymi formatami.

src/core/runtime.ts: jeden właściciel, centralny zegar, serializowane zapisy/importy, autosave co 10 s i przy ukryciu strony, zapis ręczny, eksport/import. Po odczycie zegar zaczyna od nowego performance.now; savedAt nigdy nie służy naliczaniu czasu. Web Locks (src/persistence/ownership.ts) blokuje drugą kartę; kolejka czeka na zamknięcie właściciela, potem wczytuje najnowszy zapis. Nieobsługiwane Web Locks lub błąd odczytu zatrzymują start zamiast ryzykować zapis równoległy. Brak backendu. Zamknięcie przeglądarki może stracić niezapisany odcinek między autosave; zapis przy pagehide jest best effort. Powrót odtwarza dokładnie ostatni trwały zapis.

Weryfikacja 02B: npm test — 27/27; npm run typecheck — OK; npm run build — OK; Chromium: pełny zestaw 6/6 (czas, zapis, eksport/import, brak offline, odrzucanie importu, blokada/przejęcie dwóch kart, ograniczona częstotliwość autosave) oraz 2/2 dodatkowe przypadki odmowy IndexedDB i braku Web Locks. Naprawiono błędy wnioskowania typów seeda/saveId i Promise API blokady. Brak znanych błędów wymaganych funkcji 02B. Ograniczenie: Web Locks wymaga nowoczesnej przeglądarki i localhost lub HTTPS.

Następny krok: **03** — polski responsywny interfejs pixel art, zakładki, statusy, placeholder mapy i oś harmonogramu. Zachować istniejący silnik i zapis. Cache npm: --cache /tmp/pixelcargo-npm-cache. Etapy 04–18 poza zakresem.
