import type { MapCity } from "./geography";
import { screenPoint, type MapViewport } from "./projection";
export interface CityLabel {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Deterministic screen-space placement. Omitted labels keep their marker and accessible title. */
export function placeCityLabels(
  cities: readonly MapCity[],
  viewport: MapViewport,
): CityLabel[] {
  const placed: CityLabel[] = [];
  const points = cities.map((city) => ({
    city,
    point: screenPoint(city.coordinates, viewport),
  }));
  const priorities = ["geonames:3094802", "geonames:757026", "geonames:763534"];
  points.sort((a, b) => {
    const rank = (id: string) => {
      const index = priorities.indexOf(id);
      return index < 0 ? priorities.length : index;
    };
    return (
      rank(a.city.id) - rank(b.city.id) || a.city.id.localeCompare(b.city.id)
    );
  });
  for (const {
    city,
    point: [x, y],
  } of points) {
    const width = city.name.length * 6.5 + 4;
    const height = 14;
    for (const [dx, dy] of [
      [7, -17],
      [7, 5],
      [-width - 7, -17],
      [-width - 7, 5],
    ]) {
      const label = {
        id: city.id,
        text: city.name,
        x: x + dx,
        y: y + dy,
        width,
        height,
      };
      if (
        label.x < 6 ||
        label.y < 6 ||
        label.x + width > viewport.width - 6 ||
        label.y + height > viewport.height - 6
      )
        continue;
      if (
        placed.some(
          (other) =>
            label.x < other.x + other.width + 4 &&
            label.x + width + 4 > other.x &&
            label.y < other.y + other.height + 3 &&
            label.y + height + 3 > other.y,
        )
      )
        continue;
      if (
        points.some(
          (other) =>
            other.city.id !== city.id &&
            other.point[0] > label.x - 4 &&
            other.point[0] < label.x + width + 4 &&
            other.point[1] > label.y - 4 &&
            other.point[1] < label.y + height + 4,
        )
      )
        continue;
      placed.push(label);
      break;
    }
  }
  return placed;
}
