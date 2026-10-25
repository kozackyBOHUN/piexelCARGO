import { polygons, type BoundaryGeometry, type LonLat } from "./geography";
export type Point = readonly [number, number];
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
export interface MapViewport {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}
const RADIUS = 6378137;
/** Spherical Web Mercator (EPSG:3857), with north up in SVG coordinates. */
export function project([longitude, latitude]: LonLat): Point {
  const lat = Math.max(-85.051129, Math.min(85.051129, latitude));
  return [
    (RADIUS * longitude * Math.PI) / 180,
    -RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
  ];
}
export function geometryBounds(geometry: BoundaryGeometry): Bounds {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  for (const polygon of polygons(geometry))
    for (const ring of polygon)
      for (const coordinate of ring) {
        const [x, y] = project(coordinate);
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
      }
  return bounds;
}
export function fitViewport(
  bounds: Bounds,
  width: number,
  height: number,
  padding = 24,
): MapViewport {
  const scale = Math.min(
    Math.max(1, width - padding * 2) / (bounds.maxX - bounds.minX),
    Math.max(1, height - padding * 2) / (bounds.maxY - bounds.minY),
  );
  return {
    width,
    height,
    scale,
    offsetX: width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
    offsetY: height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
  };
}
export function screenPoint(coordinate: LonLat, viewport: MapViewport): Point {
  const [x, y] = project(coordinate);
  return [
    x * viewport.scale + viewport.offsetX,
    y * viewport.scale + viewport.offsetY,
  ];
}
export function geometryPath(
  geometry: BoundaryGeometry,
  viewport: MapViewport,
): string {
  return polygons(geometry)
    .map((polygon) =>
      polygon
        .map(
          (ring) =>
            ring
              .map((coordinate, i) => {
                const [x, y] = screenPoint(coordinate, viewport);
                return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join("") + "Z",
        )
        .join(""),
    )
    .join("");
}
