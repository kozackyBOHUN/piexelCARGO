# Kontrola wizualna mapy 04C

## Przed zmianami — 04C-1

Zrzuty faktycznej aplikacji w Chromium, commit bazowy 217be676ca434fd2a0d730db01f75a0930294f7a, 2026-10-25. JPEG quality 78, bez zmiany geometrii ani mechaniki mapy.

- [Polska, 1366×768](before-country-1366.jpg)
- [Polska, 1920×1080](before-country-1920.jpg)
- [Małopolska, 1920×1080](before-demo-1920.jpg)
- [Kraków, 1366×768](before-krakow-1366.jpg)

Ocena po obejrzeniu czterech obrazów: brak nachodzenia paneli, czytelne przyciski i etykiety, poprawnie wyróżniony wybór Krakowa. Mapa krajowa na laptopie jest niewielka; nie należy pokazywać w niej wszystkich szczegółów. Granice są obecnie mocniejsze niż planowany krajobraz. Brak rzek, lasów i rzeźby terenu — to punkt odniesienia, nie ukończone 04C. Po dodaniu warstw należy zachować jasne znaczniki i ciemny obrys tekstu, stonować granice wewnętrzne i ponownie obejrzeć widoki.

Weryfikacja punktu 04C-1: npm test 52/52, npm run typecheck OK, npm run build OK. Start aplikacji i cztery widoki faktycznie sprawdzone w Chromium.
