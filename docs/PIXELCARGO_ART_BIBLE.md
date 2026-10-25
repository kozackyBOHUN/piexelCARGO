# PIXELCARGO - ART BIBLE / produkcja assetów v0.1

## Kierunek zatwierdzony przez właściciela
Referencja: zatwierdzony przez użytkownika ekran gry z dużą szczegółową izometryczną bazą, pięcioma realistycznymi pixelartowymi furgonami w przewijanej giełdzie, grafitowo-granatowym HUD-em i bursztynowymi akcentami.

**WIZJA:** realistyczna ekonomia transportowa, wizualnie bogaty, pełen drobiazgów i zabawnej przesady retro pixel art. Poziom dopracowania graficznego porównywalny z dobrymi komercyjnymi grami 16-bit/32-bit; NIE proste wektorowe prostokąty/SVG, nie stockowe ikony, nie realistyczne zdjęcia ani filmowe rendery 3D.

**Priorytet:** rzeczywiste sprite'y do gry, nie pełnoekranowe makiety UI. Interfejs tekstowy, liczby, zakładki i przyciski są oddzielnym kodem React/CSS; nie wypalać ich w obrazach.

## Design system
- Tło/panele: granat/grafit #101922, #192734, #263844.
- Akcent aktywny: złoto/pomarańcz #E7AC4F.
- Sukces/pieniądze: zieleń #79C693.
- Błąd/stan krytyczny: rdza/czerwień #D56957.
- Miasta i realne pojazdy mają zachować wiarygodne proporcje.
- Pixel grid wyraźny, ostre krawędzie, brak wygładzenia, nie upiększać filtrem blur/AI softness.
- Spójne oświetlenie z góry z lewej, ciemny wyraźny obrys, bogata tekstura.
- Auta zwrócone w prawo, ujęcie boczne z lekkim widokiem z góry, jednakowy poziom kół, wielkość pojazdu i marginesy we wszystkich PNG.
- Eksporty RGBA przezroczyste, bez napisów, bez tła, bez ramek karty, bez watermarków.

## Paczka 01 - priorytet: furgony giełdowe

Assetów oczekujemy w `public/art/vehicles/`:
1. `van-used-1.png`: starszy, mocno wyeksploatowany furgon z odrobiną rdzy i wgnieceniami, stan ok. 18%, niski budżet.
2. `van-used-2.png`: starszy furgon w szaro-niebieskim lakierze, widoczne ślady użytkowania, ok. 42%.
3. `van-used-3.png`: furgon w niebieskim lakierze, zadbany średniak, ok. 60%.
4. `van-used-4.png`: duży srebrny/biały furgon, dobry stan, ok. 85%.
5. `van-used-5.png`: nowoczesny ciemny furgon, prawie nowy, ok. 97%.

Pojazdy muszą wizualnie różnić się nadwoziem i detalami, a nie tylko kolorem. W stylistyce wizualnie zbliżonej do pięciu sprite'ów samochodowych na zaakceptowanym przez użytkownika mockupie.

- Docelowy plik każdego sprite'a: PNG RGBA 320x160 pikseli, w ramce transparentnej. Zbudować z czytelnego gridu (np. bazowe 160x80 skalowane x2 algorytmem nearest-neighbor) lub ręcznie 320x160 bez antyaliasingu.
- Drobne szczegóły: reflektory, koła, grille, uszczelki, drzwi, klamki, szyby, refleksy pikselowe, obtłuczenia/rdza zależnie od stanu, różnice wysokości dachu.
- Samochód powinien zajmować większość kadru, koła na jednej linii, bez uciętych elementów.
- Wykonać dodatkowo `vehicles-contact-sheet.png` jako poglądową planszę pięciu sprite'ów na ciemnym tle z podpisami POZA właściwymi plikami PNG.

### Kryteria odbioru
1. **Prawdziwe assety do gry:** każdy plik osobny, alpha, zgodny rozmiar i nazwą; żadnych screenów kart UI.
2. Spójność: wszystkie 5 aut mają wspólną skalę/perspektywę i oświetlenie.
3. Różnorodność: pięć unikalnych sylwetek / śladów zużycia.
4. Jakość: szczegółowy pixel art jak w zaakceptowanej referencji - nie piktogramy z kilkudziesięciu prostokątów.
5. Załączyć kartę kontroli: rozmiary, przezroczystość, podgląd, informacja o prawach do użycia wygenerowanych grafik.
6. **Nie modyfikować silnika, mechaniki, CSS, UI ani routingu.** Zmiany wyłącznie plików artystycznych i ewentualnego README w `public/art/`.

## Po zaakceptowaniu paczki 01
- 02: portrety kierowców (96x96, oddzielne PNG bez teł).
- 03: ikony różnorodnych ładunków (64x64 z przezroczystością).
- 04: izometryczna baza, osobne interaktywne warstwy/budynki level 1-5, drogi/otoczenie.
- 05: pixelartowe markery aut na prawdziwej mapie geograficznej.

## Integracja i gałęzie
- Wszystkie prace wizualne wykonywać tylko na `feat/pixelcargo-art-assets`.
- NIE modyfikować `feat/preview-gameplay-core` ani `main`; mechanika i mapa są rozwijane równolegle.
- Jeśli agent nie ma dostępu do zapisu plików binarnych na GitHubie, oddać komplet PNG + zip użytkownikowi do dołączenia i podać dokładne nazwy plików.
- Kod integrować dopiero po akceptacji assetów i przejściu testów na nowej gałęzi.
