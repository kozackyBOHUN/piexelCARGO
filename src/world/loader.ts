import countryUrl from "./data/poland.json?url";
import regionsUrl from "./data/voivodeships.json?url";
import citiesUrl from "./data/cities-demo.json?url";
import type {
  BoundaryFeature,
  BoundaryCollection,
  GeographyDataset,
  MapCity,
} from "./geography";
let pending: Promise<GeographyDataset> | null = null;
/** Same-origin static assets keep geographic coordinates out of the application JS chunk.
 * Shared promise prevents duplicate loading. No external map service or credentials. */
export function loadGeography(): Promise<GeographyDataset> {
  if (!pending)
    pending = Promise.all(
      [countryUrl, regionsUrl, citiesUrl].map(async (url) => {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            "Nie udało się wczytać lokalnych danych mapy. Spróbuj ponownie.",
          );
        return response.json();
      }),
    )
      .then(([country, regions, cities]) => {
        if (
          country?.type !== "Feature" ||
          regions?.type !== "FeatureCollection" ||
          regions.features?.length !== 16 ||
          !Array.isArray(cities) ||
          cities.length !== 19
        )
          throw new Error("Lokalne dane mapy są niezgodne z wersją 04A.");
        return {
          country: country as BoundaryFeature,
          voivodeships: (regions as BoundaryCollection).features,
          cities: cities as MapCity[],
          coverage: {
            demoVoivodeshipId: "PL-12",
            label: "Małopolskie · 19 miast demonstracyjnych",
            completeCountryCities: false as const,
          },
        };
      })
      .catch(() => {
        pending = null;
        throw new Error(
          "Nie udało się wczytać lokalnych danych mapy. Sprawdź pliki aplikacji i spróbuj ponownie.",
        );
      });
  return pending;
}
