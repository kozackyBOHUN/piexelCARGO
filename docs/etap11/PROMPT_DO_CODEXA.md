# PIXELCARGO - ETAP 11: OSTATECZNA NAPRAWA TRAS MAŁOPOLSKI

Repo: `kozackyBOHUN/piexelCARGO`
Gałąź: `feat/preview-gameplay-core`
Punkt wyjścia: `92ff5c46eaa334f6ad6f7ec6ab03bb1bafe32d25`

**Załączam ZIP `PixelCargo_Malopolska_ROUTING_NAPRAWA_11.zip`.**

W pierwszej kolejności przeczytaj `README.md`, `docs/GORLICE_PRECYZYJNA_DIAGNOZA.md`, `docs/ODBIOR_342_TRAS.md`, `manifest.json`. Załączone programy i OSM geometrie to część zadania; nie zaczynaj od generowania całej Małopolski od nowa.

**PROBLEM:** etap 09 zastąpił lepsze, audytowane drogi z etapu 08 dłuższymi łańcuchami 75 odcinków powiatowych. Kraków → Wieliczka wzrosło z 14,1 do 102,6 km, Kraków → Myślenice z 30,3 do 88,7 km, Kraków → Zakopane ze 103,6 do 146,0 km. Gracz nie akceptuje fikcyjnych objazdów.

## A. Naprawa już działających 18 miast

- Użyj dostarczonego `scripts/build_preferred_catalog.mjs`, który czyta aktualne 135 certyfikatów etapu 08 i 306 certyfikatów etapu 09 BEZ ponownej generacji. Odtwarza pełne polilinie i wybiera krótszą certyfikowaną trasę dla każdego kierunku. Wymaga zgodności SHA grafu i certyfikatów; nie używa odrzuconych kandydatów.
- Zweryfikuj 306/306 i wszystkie 135 regresji. Integruj nowy wybrany katalog w runtime jako główne źródło - wcześniejszy katalog 08 nie może pozostawać tylko awaryjnym fallbackiem przy HTTP 404.
- Nie nadpisuj starych zapisanych tras podczas jazdy. Utrzymaj stare raporty/źródła bez zmiany. Najpierw uruchom wersję demonstracyjną i testy.

## B. Dołączenie Gorlic i docelowo całej Małopolski

- W ZIP są 35 dawnych przebiegów do/z Gorlic, z których cztery połączenia (Tarnów i Nowy Sącz w obu kierunkach) mają nowy wstępny diagnostyczny wynik rekonstrukcji oryginalnych segmentów OSM. W raporcie jest dokładna problematyczna droga `way 25092944` z tagiem `maxgvweightrating:hgv:conditional`. To *nie* jest ogólny zakaz dla każdego furgonu. Nie ignoruj jednak warunkowych tagów w ciemno: sprawdź ich zastosowanie do profilu pojazdu.
- Uruchom niezależny pełny audyt dostępu, restrykcji skrętów i via-way na czterech kandydatach, znajdź bezpieczne alternatywy tam, gdzie audyt odmówi, i zbuduj pełne 36 kierunków z/do Gorlic. Nie legalizuj żadnych tras samym faktem posiadania geometrii. Jeśli nie da się potwierdzić wjazdu/wyjazdu - raportuj „nieukończone” i nie udawaj 19/19.
- **Maksymalnie odciążamy routing**: masz gotowe 324 wcześniej policzone geometrie OSM, 75 audytowanych odcinków 09, 135 certyfikatów 08 i 4 wskazane kluczowe kandydatury. Nie pobieraj z internetu PBF, jeśli lokalny zamrożony graf wystarcza.

## C. Prawdziwe najkrótsze drogi

- Sprawdź OSM shortest path dla KAŻDEGO z 342 kierunków na całym rzeczywistym grafie, nie tylko Dijkstrę wśród miast powiatowych. Uwzględniaj autostrady, ekspresówki i obwodnice, które nie wymagają wjeżdżania do centrów sąsiadujących powiatów. Preferuj oryginalną skierowaną geometrię i profil furgonu.
- Jeśli Twój wariant wypadnie o ponad 5% dłużej od niezależnie audytowanego optimum drogowego, zbadaj dlaczego i napraw; nigdy nie wprowadzaj sztucznych odcinków ani ukrytego nagłego przeskoku samochodu.
- Warunkiem „ukończone” jest **19 miast × 18 pozostałych = 342/342 w obu kierunkach**, niezależny certyfikat źródłowych krawędzi i skrętów na KAŻDEJ trasie oraz zero regresji względem 135 legalnych tras etapu 08.

## D. Kontrola publikacji

- Odpowiednio zmodyfikuj runtime, aby faktycznie korzystał z nowego katalogu, a stary nie wracał z cache. Sprawdź minimum 12 tras z `qa/priority_route_baselines.json`, komplet 135 old-vs-new i wszystkich 342, dalej tankowanie, sen, pensje, paliwo, harmonogram, zapis aktywnego kursu, brak dublowania wypłaty.
- TypeScript, testy jednostkowe, Playwright 1366×768 i 1920×1080, build, Pages online; raport `docs/reports/11-route-acceptance.json` z SHA i certyfikatami 342 tras.
- Zapisz kod, testy i dokumentację. Commit/push tylko na `feat/preview-gameplay-core`, bez merge do `main`.
- Raport końcowy: liczba legalnie zatwierdzonych relacji /342, liczba miast, najdłuższy nieusprawiedliwiony objazd vs OSM, status Gorlic, 135 regresji, wyniki testów, hash commita, dokładnie sprawdzone wdrożenie Pages.
- Nie zmieniaj mechaniki ładunków, kredytu ani grafik. Po pracy zatrzymaj się.

**Nie deklaruj ukończenia pełnej Małopolski, dopóki 342 kierunki nie przejdą rzeczywistego audytu.**
