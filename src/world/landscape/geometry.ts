import type { LonLat } from "../geography";
import { project, type Bounds } from "../projection";
import type { WaterGeometry } from "./model";
export function geometryLines(
  geometry: WaterGeometry,
): readonly (readonly LonLat[])[] {
  switch (geometry.type) {
    case "LineString":
      return [geometry.coordinates];
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates;
    case "MultiPolygon":
      return geometry.coordinates.flat();
  }
}
/** Shared project() produces the same world coordinates used by SVG and the camera. */
export function worldPath(geometry: WaterGeometry): string {
  const closed =
    geometry.type === "Polygon" || geometry.type === "MultiPolygon";
  return geometryLines(geometry)
    .map(
      (line) =>
        line
          .map((coordinate, index) => {
            const [x, y] = project(coordinate);
            return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
          })
          .join("") + (closed ? "Z" : ""),
    )
    .join("");
}
export function worldBounds(geometry: WaterGeometry): Bounds {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  for (const line of geometryLines(geometry))
    for (const coordinate of line) {
      const [x, y] = project(coordinate);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  return bounds;
}
