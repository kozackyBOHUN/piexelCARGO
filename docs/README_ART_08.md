# PixelCargo - zweryfikowany zestaw dla Codexa - ETAP 08

Źródła: zatwierdzona partia van 06-08, paczka art 05 (van 14-15, cargo 01-10, budynki 4, portrety 6), paczka UI 06 (27 ikon).

Łącznie: **52 pliki PNG** = 5 aut + 10 ładunków + 4 budynki + 6 portretów + 27 ikon. Wszystkie pliki zostały otwarte przez PIL, mają właściwe rozmiary, tryb RGBA i piksele o pełnej przezroczystości.

## BARDZO WAŻNE - obecne modele giełdy

Obecna giełda ma modele van-used-1..5. Nie ma zaakceptowanych grafik tych numerów. Użyj mapowania wyglądu w `appearance_mapping.json`:
- oferta van-used-1 => obrazek van-used-6.png
- oferta van-used-2 => obrazek van-used-7.png
- oferta van-used-3 => obrazek van-used-8.png
- oferta van-used-4 => obrazek van-used-14.png
- oferta van-used-5 => obrazek van-used-15.png

To JEDYNIE podmiana wyglądu. Nie zmieniaj parametrów ani ID. Zostaw wszystkie oryginalne pliki o nazwach artystycznych, zamiast tworzyć fikcyjne duble. Można założyć registry w UI.

## Czego nie ma
- 09-13 w ZATWIERDZONEJ jakości jako gotowe pliki PNG 320x160. Nie dołączać starszych odrzuconych wersji.
- Markerów mapy widocznych dokładnie z profilu dla busa/ciężarówki/ciągnika siodłowego. Te obrazy trzeba osobno przygotować lub zastosować czytelne ikonki profilowe w kodzie bez udawania gotowej grafiki.

## Towary i budynki

- cargo-01..10 odpowiadają obecnemu katalogowi 10 towarów (nazwy powiąż jawnie).
- budynki office, parking, dispatch, hr to osobne warstwy izometryczne bazy, nie pełny obraz tła.
- 6 portretów to biblioteka grafik; aktualnie tylko jeden kierowca.
- 27 ikon UI nie zmienia mechaniki. Kolor alarmów ma wynikać z rzeczywistego stanu.

## Trasy referencyjne

`dane_tylko_do_weryfikacji/PixelCargo_Malopolska_19_miast_trasy.zip` zawiera 19 miast i trasy obliczone wcześniej roboczo; **nie są one prawnie ani topologicznie zweryfikowane w 100%**. Manifest wskazuje pary wymagające przeglądu, brakujące 18 połączeń do Oświęcimia i nieobsłużone restrykcje skrętów. Dopuszczaj do gry TYLKO niezależnie zweryfikowane realne trasy; nie zamieniaj ich na proste linie i nie teleportuj pojazdów. Priorytet: sprawny powrót z Zakopanego oraz pełna obsługa obu kierunków w pierwszym obszarze.

## Uruchomienie

Skopiuj `public/art/` do repo i zmapuj UI na zasoby zgodnie z manifestem. Nie nadpisuj silnika. Przed commitem uruchom testy i sprawdź bieżący branch HEAD.
