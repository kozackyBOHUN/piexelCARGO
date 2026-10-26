# Routing 11 — obecna publikacja

Gałąź: feat/preview-gameplay-core. Aktualna gra pobiera wyłącznie roads/preferred/manifest.json i wersjonowany katalog 342 tras, sprawdzając SHA-256; bez fallbacku do powiatowych objazdów. Pełna kontrola produkcji: `npm run build:pages` i `npx playwright test --config playwright.pages.config.ts`. Kontrola faktycznych publicznych Pages, 19 miast i starego aktywnego kursu: `npx playwright test --config playwright.routing11-live.config.ts`. Weryfikować dokładny SHA commita i katalogu po sukcesie workflow, nie sam adres URL.

Adres gry: https://kozackybohun.github.io/piexelCARGO/?preview=1. Szczegóły: docs/STAGE_11.md. Poniżej historyczny opis pierwszego uruchomienia Pages; dawne blokady proxy nie określają bieżącego statusu publikacji.

---

# Publiczne preview przez GitHub Pages

Gałąź publikowana: **feat/preview-gameplay-core**. Bez merge do main.
Bazą przygotowania jest a233b302b597ac46d178b399f42d199956850157.

Adres po udanym wdrożeniu:
**https://kozackybohun.github.io/piexelCARGO/?preview=1**

To adres docelowy, nie potwierdzenie aktywnej publikacji. Lokalne testy produkcji
przeszły (79/79 unit, build z typecheck, 1/1 produkcyjny test Pages). W tej sesji nie ma funkcji publicznego podglądu Codexa; localhost oraz
adresy 172.x serwera nie są linkami do gry dla użytkownika Windows.
Dostęp do GitHub API / docelowej domeny był odrzucany przez proxy środowiska
(`CONNECT tunnel failed, response 403`, gh API: `Forbidden`). Nie omijano uprawnień.

## Jednorazowe włączenie — właściciel repozytorium

1. Otwórz https://github.com/kozackyBOHUN/piexelCARGO/settings/pages
   (repozytorium → **Settings → Pages**).
2. W **Build and deployment → Source** wybierz **GitHub Actions**.
   Nie wybieraj „Deploy from a branch”: na gałęzi jest kod źródłowy, nie dist.
3. Otwórz https://github.com/kozackyBOHUN/piexelCARGO/actions
   i workflow **Deploy playable preview to GitHub Pages**.
4. Otwórz najnowsze uruchomienie z gałęzi **feat/preview-gameplay-core**.
   Jeśli pierwsze uruchomienie nie przeszło przed włączeniem Pages,
   kliknij u góry **Re-run jobs → Re-run all jobs**.
5. Poczekaj, aż zadania **build** i **deploy** będą zielone. Wtedy otwórz adres
   z początku dokumentu lub link środowiska **github-pages** w podsumowaniu deploy.

Jeżeli GitHub zgłosi, że ta gałąź nie może wdrażać do środowiska:
**Settings → Environments → github-pages → Deployment branches and tags**.
Właściciel powinien dopuścić dokładnie **feat/preview-gameplay-core**
(np. **Selected branches and tags → Add deployment branch or tag rule → Branch**,
wpisać nazwę gałęzi). Potem ponowić nieudane zadania. Jeśli środowisko wymaga
zatwierdzenia, właściciel używa **Review deployments → Approve and deploy**.
Workflow nie usuwa ani nie obchodzi ograniczeń środowiska.

Jeśli zakładka Pages jest niedostępna lub polityka organizacji blokuje Actions,
wymagane jest odpowiednie uprawnienie właściciela/administratora lub plan GitHub
obsługujący Pages dla tego repozytorium. Nie potrzeba żadnego klucza gry ani Node.js
na komputerze gracza. Nie udostępniać nikomu tokenów w czacie.

## Co publikuje workflow

`.github/workflows/preview-pages.yml` reaguje na push do wskazanej gałęzi.
Ma też workflow_dispatch, lecz do pierwszego uruchomienia wystarczy push;
ponowienie istniejącego uruchomienia działa bez dodawania workflow do main.
Konfiguracja sprawdza gałąź przed budowaniem. Build: Node 22, npm ci,
**npm run build:pages**, upload dist i oficjalne actions/deploy-pages.
Workflow nie włącza Pages automatycznie (configure-pages bez enablement).

Build Pages ustawia Vite base **/piexelCARGO/**. Zwykłe npm run dev/build pozostają
przy bazie /. Poprawione są wyłącznie ścieżki publikacji: trasy preview, link
GRAJ, powrót do panelu i strona źródeł/licencji. HTML Vite ustawia poprawne
ścieżki JS/CSS/favicony; katalog public zawiera routes.json i pozostałe zasoby.
Nie zmieniono mechaniki, parametrów gry, routingu ani danych OSM.

Od etapu 09 gra ładuje `/piexelCARGO/roads/county/links.json` i `network.json` (~2,7 MB i ~28 KB), nie cały graf. Dawne `/piexelCARGO/roads/preview/routes.json` pozostaje katalogiem awaryjnym.
Pełna baza nadal jest dostępna jako istniejący zasób i przez stronę licencji.

## Zapis w przeglądarce Windows

GitHub Pages działa po HTTPS. localStorage i IndexedDB pozostają lokalne w
przeglądarce gracza; konto GitHub nie jest potrzebne do grania na publicznej stronie.
Klucze i formaty zapisu nie zostały zmienione. Otwieraj ten sam adres i profil
przeglądarki; czyszczenie danych witryny usuwa zapis. Stan z innego originu,
np. wcześniejszego serwera lokalnego, nie przenosi się automatycznie na github.io.

## Kontrola lokalna produkcji

```sh
npm ci
npm run build:pages
npx playwright test --config playwright.pages.config.ts
```

Test korzysta z systemowego Chromium (lub CHROMIUM_PATH jak poprzednie testy),
serwuje faktyczne dist na osobnym porcie 4193 i pod prawdziwą ścieżką repozytorium.
Potwierdzono **1/1**: JS/CSS, dane tras, firma/furgon/kierowca, zapis po 2 sekundach,
reload, przyjęcie kursu i geometria OSM; nawigacja do oryginalnej mapy, rastry,
linki do źródeł/licencji i brak 404/runtime errors. To dowód lokalnego buildu,
nie dowód dostępności publicznego URL przed zielonym wdrożeniem GitHub Actions.
