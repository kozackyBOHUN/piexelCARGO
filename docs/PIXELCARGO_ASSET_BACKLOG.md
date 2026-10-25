# PixelCargo - PRODUKCYJNA LISTA GRAFIK (art backlog)

Wersja: 0.1 i następne. Ten dokument **zatwierdza listę do zaplanowania, nie zmianę mechaniki gry**. W pierwszej wersji 0.1 maksymalnie jeden posiadany furgon, choć giełda może pokazywać wiele różnych modeli.

## Pojazdy - 15 odmian furgonów

| ID | Nazwa robocza | Wygląd i różnica sylwetki | Segment | Status |
|---|---|---|---|---|
| van-used-01 | Vektor F90 | duży wysoki kremowobiały; mocna rdza i wgniotki | stary budżetowy | gotowe PNG van-used-1.png |
| van-used-02 | Żubr Dostawczy | niebieski klasyczny wysoki; otarcia i korozja | tani używany | gotowe PNG van-used-2.png |
| van-used-03 | Nord Cargo | kompaktowy niebieski furgon; średni stan | segment średni | gotowe PNG van-used-3.png |
| van-used-04 | Atlas D-210 | srebrno-biały przedłużony furgon; dobry stan | segment wyższy | gotowe PNG van-used-4.png |
| van-used-05 | Vektor ProMax | nowoczesny ciemny grafitowy; krótki przeszklony | prawie nowy | gotowe PNG van-used-5.png |
| van-used-06 | Mały Goniec | biały mały dwumiejscowy z wysoką częścią ładunkową | bardzo tani | do wykonania |
| van-used-07 | Żubr Classic | bordowy, prostokątny dostawczak starej generacji | tani zużyty | do wykonania |
| van-used-08 | Nord Cargo L2 | zielony, średni rozstaw osi, dach normalny | średni stan | do wykonania |
| van-used-09 | Atlas City | pomarańczowy miejski furgonik; małe nadwozie | zadbany kompakt | do wykonania |
| van-used-10 | Vektor L2H2 | żółty, dach podwyższony, 2 osie | używany | do wykonania |
| van-used-11 | Żubr Long | biały bardzo długi, niski dach; boczne drzwi | używany | do wykonania |
| van-used-12 | Nord Maxi | ciemnoniebieski długi, wysoki dach, drzwi przesuwne | zadbany | do wykonania |
| van-used-13 | Atlas Express | czerwony, podłużny nowocześniejszy furgon | dobry stan | do wykonania |
| van-used-14 | Vektor XL | grafitowy długi dostawczak wysokopojemny | drogi | do wykonania |
| van-used-15 | Żubr Premier | srebrny nowej generacji, detalowane reflektory i grill | prawie nowy | do wykonania |

**Priorytet:** pierwsza piątka jest już przygotowana przez grafika w paczce 01; potrzebna jeszcze integracja i odbiór. Kolejny większy batch to **van-used-06 do van-used-15**. Te dodatkowe modele powiększają bibliotekę graficzną, nie zwiększają automatycznie liczby samochodów posiadanych w 0.1.

Każde auto: osobne PNG 320×160, RGBA, naprawdę przezroczyste, bez tekstu i tła, jednakowe koła/perspektywa/skala, rozpoznawalne nadwozie. Rzeczywiste marki mogą służyć jako odniesienie kształtu, ale fikcyjne nazwy i bez logotypów producentów. **Nie dodawać elektryków ani aut chłodniczych do 0.1 bez zatwierdzenia ich mechaniki.**

## Ładunki - 20 rodzajów

| ID | Rodzaj | Ikona przedstawia | Etap gry | Charakter towaru |
|---|---|---|---|---|
| cargo-01 | Odzież | kartony z koszulkami i wieszaki | 0.1 | lekki/objętościowy |
| cargo-02 | Obuwie | pudełka butów spięte taśmą | 0.1 | lekki/średni |
| cargo-03 | Książki | stosy książek w kartonach | 0.1 | ciężki |
| cargo-04 | Zabawki | kartony z pluszakami i klockami | 0.1 | lekki |
| cargo-05 | Elektronika | kartony z monitorem/laptopem | 0.1 | delikatny |
| cargo-06 | Małe AGD | mikser/odkurzacz w pudełku | 0.1 | średni |
| cargo-07 | Meble w paczkach | płaskie długie paczki meblowe | 0.1 | objętościowy |
| cargo-08 | Papier biurowy | ryzy papieru w kartonach na palecie | 0.1 | ciężki |
| cargo-09 | Karma dla zwierząt | worki suchej karmy na palecie | 0.1 | średni/ciężki |
| cargo-10 | Konserwy | zgrzewki puszek w kartonach | 0.1 | ciężki |
| cargo-11 | Kosmetyki | kartony kosmetyków | później | lekki |
| cargo-12 | Artykuły sportowe | torby/piłki/akcesoria | później | objętościowy |
| cargo-13 | Akcesoria zoologiczne | legowiska i transportery | później | objętościowy |
| cargo-14 | Części samochodowe | filtry/klocki hamulcowe | później | średni |
| cargo-15 | Narzędzia | walizki z narzędziami | później | ciężki |
| cargo-16 | Armatura | krany i złączki w pudełkach | później | średni |
| cargo-17 | Oprawy oświetleniowe | lampy w zabezpieczonych pudłach | później | delikatny |
| cargo-18 | Szkło i porcelana | pudła z oznaczeniem ostrożności | później | delikatny |
| cargo-19 | Akcesoria kuchenne | garnki/patelnie w kartonach | później | średni |
| cargo-20 | Tekstylia domowe | pościel, koce, poduszki | później | lekki/objętościowy |

**Priorytet 0.1:** cargo-01 do cargo-10, zgodnie z `docs/SPEC_0_1_ORIGINAL.txt`. Pozostałe 10 grafik można wykonać w tej samej paczce, ale uruchomienie ich mechaniki dopiero po decyzji o rozszerzeniu listy zleceń.

Ikony ładunków: **64×64 PNG RGBA**, ostre piksele, obiekt w centrum, bez tekstu, bez ramek, na przezroczystym tle; od razu czytelne w karcie giełdy zleceń. Rozróżnić rodzaj towaru kształtem, nie tylko kolorem. W razie potrzeby większa ikonka może być skalowana bez wygładzania.

## Następne większe zlecenie grafikowi

**Jedno zlecenie, dwa równoległe zestawy:** 10 dodatkowych furgonów (06–15) + 20 unikalnych ikon ładunków (01–20) + 2 wspólne plansze poglądowe + plik manifest.json (id, filename, dimensions, category) + ZIP z gotową strukturą `public/art/...`. Całość ok. **30 sprite'ów**. Grafik pracuje na `feat/pixelcargo-art-assets` lub przekazuje paczkę ZIP, bez edycji gry. **Nie zlecać tworzenia przed akceptacją tej listy.**

## Kontrola jakości i współpraca

- Jeden spójny styl referencyjny, bez makiet interfejsu i bez prostych SVG.
- Nie przeprojektowywać zadań Codexa ani mechaniki rynku transportowego.
- Odbiór: kompletność, dopasowanie do listy, przezroczystość, rozmiar, czytelność z mniejszej skali.
- Dopiero po odbiorze grafika końcowe PNG trafiają do gry przez osobną gałąź integracyjną.
