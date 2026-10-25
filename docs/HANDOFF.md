# Stan przekazania PixelCargo

Ostatni w pełni ukończony punkt: **03 — cała Faza I (01 → 02A → 02B → 03)**.
Nie rozpoczęto Fazy II. Następny punkt: **04 — mapa Polski**, wyłącznie po osobnym poleceniu użytkownika. Nie tworzyć projektu ponownie; rozwijać obecne moduły.

## Co działa

- Jeden projekt TypeScript + React + Vite w istniejącym repozytorium. Dokument źródłowy docs/SPEC_0_1_ORIGINAL.txt skopiowany bez zmiany bajtów, potwierdzone `cmp` z załącznikiem. Zakres zadania zachowany w docs/PixelCargo_Faza_I_Codex.md.
- Centralny GameSession, czysta funkcja updateWorld, monotoniczny SessionClock. Start poniedziałek 06:00; jedna sekunda rzeczywista = minuta gry. Numerowane komendy chronią przed powtórnym naliczeniem. Ułamki czasu nie giną. Tło otwartej sesji jest nadrabiane niezależnie od częstości timera.
- RNG Mulberry32 z jawnym stanem i kontrolowanym ziarnem. Stan RNG zachowywany w zapisie. Obecny zegar nie zużywa losowości.
- IndexedDB, ręczny zapis, autosave co 10 sekund i przy ukryciu strony, eksport JSON i import do 2 MB z walidacją. Operacje zapisu/importu są serializowane. Import zastępuje stan dopiero po trwałym zapisie. Błąd zapisu jest widoczny, nie udaje sukcesu.
- SaveEnvelope schemat 1 zawiera saveId, savedAt, GameState z rngState i commandSequence. Rejestr migracji przygotowany, bez zmyślonych migracji. Schemat 1 akceptuje tylko techniczny stan Fazy I (company=null i zdarzenie startowe), bez obietnic obsługi przyszłych formatów.
- Brak offline progress: zapisany czas nie zależy od rzeczywistej daty savedAt. Nowa sesja ustala nową bazę performance.now.
- Web Locks przyznaje wyłączną własność całej lokalnej sesji. Druga karta czeka bez ticków i zapisów. Zamknięcie właściciela zwalnia blokadę; następna karta wczytuje najnowszy zapis. Brak Web Locks lub błąd odczytu blokuje start zamiast ryzykować nadpisanie.
- Polski interfejs retro z lokalnym CSS/SVG i systemowymi fontami obsługującymi polskie znaki. Górny pasek: status firmy, brak danych finansowych, centralny zegar, miejsce na alerty i status zapisu. Siedem przełączanych zakładek, obsługa myszą i klawiaturą (strzałki/Home/End), realna historia zdarzeń, działające Ustawienia.
- Uczciwy placeholder mapy „Mapa Polski — etap 04”, pusta oś „Harmonogram — etap 09” z godzinami z centralnego stanu, bez fikcyjnych kursów. Kontener wierszy ma przygotowany limit trzech widocznych wierszy i przewijanie. Układ 1/3–2/3; przy 1366×768 mapa i harmonogram mieszczą się w oknie, dłuższy panel przewija się wewnętrznie. Mniejsze ekrany mają układ pionowy.

## Weryfikacja punktów kontrolnych

| Punkt | Vitest | Typecheck / build | Chromium | Commit |
| --- | --- | --- | --- | --- |
| 01 | 1/1 | OK / OK | 1/1 | 430aeab |
| 02A | 7/7 | OK / OK | 2/2 | 93b2e1f |
| 02B | 27/27 | OK / OK | 6/6 + 2/2 przypadki błędów | 9020a19 |
| 03 | 27/27 | OK / OK | 13/13 + 1/1 ponowna kontrola statusu błędu | osobny commit etapu 03 w historii Git |

Końcowe komendy: `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`. Testy E2E obejmują rzeczywiste działanie zegara, zapis/odczyt, eksport/import i RNG, stare savedAt bez offline progress, uszkodzony import, dwie karty i przejęcie blokady, częstotliwość autosave, odmowę IndexedDB i brak Web Locks, nieudany zapis bez zastąpienia żywego stanu, wszystkie zakładki i klawiaturę. Brak krytycznych błędów konsoli w teście przełączania paneli. Układ sprawdzony testami i wizualnie na zrzutach 1366×768 i 1920×1080; dodatkowo test 390×844. Zrzuty robocze w /tmp/pixelcargo-1366.png i /tmp/pixelcargo-1920.png nie są wymaganymi plikami aplikacji.

Ponownie wykonano `npm ci --cache /tmp/pixelcargo-npm-cache --no-audit --no-fund`, następnie testy, typecheck i build — wszystkie poprawne. Dev Vite uruchomiony; HTTP GET sprawdzone. Typecheck obejmuje również konfigurację narzędzi i E2E.

## Ważne pliki / API

- src/domain/models.ts — minimalne kontrakty Company, Vehicle, Driver, Job, CargoUnit, Route, TimelineAction, LedgerEntry, GameState, GameCommand, DomainEvent i SaveEnvelope. Pieniądze: grosze; czas: całkowite milisekundy gry od poniedziałku 00:00; ilości: całe jednostki. LedgerEntry.eventId jest punktem rozszerzenia przyszłych idempotentnych rozliczeń.
- src/core/config.ts — jednostki i interwały; state.ts — czysty stan początkowy; engine.ts — updateWorld, nextRandom, formatGameTime.
- src/core/session.ts — centralny magazyn GameSession i zegar SessionClock; runtime.ts — właściciel sesji, odczyt, timer i kolejka zapisu. UI tylko odczytuje stan i wysyła akcje do runtime.
- src/persistence/schema.ts — parseSave / validateSave / makeSave; database.ts — SaveDatabase; ownership.ts — SaveOwnership. Baza pixelcargo-v1, magazyn saves, klucz current.
- src/ui/App.tsx — powłoka i zakładki; SaveControls.tsx — akcje plików i feedback; Timeline.tsx — oś czasu; PixelIcon.tsx i styles.css — lokalny styl.
- src/**/*.test.ts — testy logiki; e2e/*.spec.ts — testy faktycznej aplikacji w Playwright.

## Uruchomienie i środowisko

W /workspace/piexelCARGO: `npm ci`, potem `npm run dev`. W tym środowisku cache npm należy kierować do /tmp/pixelcargo-npm-cache (domyślny katalog domowy nie jest zapisywalny). Node 22.12+ lub 20.19+; zweryfikowano na Node 24.19.0. Systemowy Chromium dostępny w /usr/bin/chromium. Poza tą maszyną: `npx playwright install chromium` albo CHROMIUM_PATH. Szczegóły obsługi w README.md.

Zapisano w szkicu konfiguracji chmurowej kompletne pola install_script i start_skill. Skrypt instalacji przetestowany w bieżącej instancji, instrukcje startu zawierają istniejący checkout, restart Vite i kontrolę gotowości. Zapis szkicu nie publikuje środowiska. Użytkownik może przejrzeć i zapisać zmiany w ustawieniach, a następnie opublikować środowisko. Nie zweryfikowano przywracania w nowym zadaniu. Commity są lokalne; nie wykonano push.

## Ograniczenia / zakres odłożony

Brak znanych nierozwiązanych błędów wymaganych funkcji Fazy I. Web Locks i IndexedDB wymagają nowoczesnej przeglądarki oraz HTTPS lub localhost. Eksport jest kopią bezpieczeństwa; usunięcie danych witryny usuwa lokalny zapis. Zapis przy zamykaniu strony jest best effort — nagła awaria może utracić niezapisany odcinek między autosave. Powrót odtwarza ostatni trwały zapis, nie czas faktycznego zamknięcia karty.

Nie ma firmy, kredytu, aktywnego pojazdu, kierowcy, rynku, transportów, ekonomii, geografii, dróg, paliwa ani awarii. Nie są symulowane ani sugerowane jako gotowe. Kolejny krok wymaga nowego polecenia dotyczącego Fazy II; zacząć od bieżącego kodu i ustalenia wiarygodnych danych dla etapu 04.
