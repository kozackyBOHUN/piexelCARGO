import type { MapCity } from "./geography";
export function normalizeCityName(value: string): string {
  return value
    .toLocaleLowerCase("pl")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l")
    .trim()
    .replace(/\s+/g, " ");
}
/** Catalog supplied by the caller: no hardcoded demo names, ready for a larger local catalog. */
export function searchCities(
  cities: readonly MapCity[],
  query: string,
): MapCity[] {
  const normalized = normalizeCityName(query);
  if (!normalized) return [];
  return cities
    .filter((city) => normalizeCityName(city.name).includes(normalized))
    .sort((a, b) => {
      const prefix = (city: MapCity) =>
        normalizeCityName(city.name).startsWith(normalized) ? 0 : 1;
      return (
        prefix(a) - prefix(b) ||
        a.name.localeCompare(b.name, "pl") ||
        a.id.localeCompare(b.id)
      );
    });
}
