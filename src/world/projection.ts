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

export const MIN_GROUND_METERS_PER_PIXEL = 200;
export interface MapNavigationLimits {
  bounds: Bounds;
  /** Projected country polygons, built once rather than on every pointer move. */
  polygons: readonly (readonly (readonly Point[])[])[];
}
export function unproject([x, y]: Point): LonLat {
  return [
    ((x / RADIUS) * 180) / Math.PI,
    ((2 * Math.atan(Math.exp(-y / RADIUS)) - Math.PI / 2) * 180) / Math.PI,
  ];
}
export function worldPoint([x, y]: Point, viewport: MapViewport): Point {
  return [
    (x - viewport.offsetX) / viewport.scale,
    (y - viewport.offsetY) / viewport.scale,
  ];
}
export function viewportCenter(viewport: MapViewport): Point {
  return worldPoint([viewport.width / 2, viewport.height / 2], viewport);
}
export function atCenter(
  center: Point,
  scale: number,
  width: number,
  height: number,
): MapViewport {
  return {
    width,
    height,
    scale,
    offsetX: width / 2 - center[0] * scale,
    offsetY: height / 2 - center[1] * scale,
  };
}
export function groundMetersPerPixel(viewport: MapViewport): number {
  const latitude = unproject(viewportCenter(viewport))[1];
  return Math.cos((latitude * Math.PI) / 180) / viewport.scale;
}
export function scaleForGroundResolution(
  latitude: number,
  metersPerPixel: number,
): number {
  return Math.cos((latitude * Math.PI) / 180) / metersPerPixel;
}
export function createNavigationLimits(
  geometry: BoundaryGeometry,
): MapNavigationLimits {
  return {
    bounds: geometryBounds(geometry),
    polygons: polygons(geometry).map((polygon) =>
      polygon.map((ring) => ring.map(project)),
    ),
  };
}
function inRing([x, y]: Point, ring: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function centerInCountry(
  center: Point,
  limits: MapNavigationLimits,
): boolean {
  return limits.polygons.some(
    (polygon) =>
      inRing(center, polygon[0]) &&
      !polygon.slice(1).some((ring) => inRing(center, ring)),
  );
}
/** Keep the center on land or on its nearest boundary, so even at max zoom Poland cannot disappear. */
function countryCenter(center: Point, limits: MapNavigationLimits): Point {
  if (centerInCountry(center, limits)) return center;
  let nearest = center;
  let best = Infinity;
  for (const polygon of limits.polygons)
    for (const ring of polygon)
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1],
          b = ring[i];
        const dx = b[0] - a[0],
          dy = b[1] - a[1];
        const length = dx * dx + dy * dy;
        const t =
          length === 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  ((center[0] - a[0]) * dx + (center[1] - a[1]) * dy) / length,
                ),
              );
        const point: Point = [a[0] + t * dx, a[1] + t * dy];
        const distance =
          (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2;
        if (distance < best) {
          nearest = point;
          best = distance;
        }
      }
  return nearest;
}
export function constrainViewport(
  viewport: MapViewport,
  limits: MapNavigationLimits,
): MapViewport {
  const fitted = fitViewport(limits.bounds, viewport.width, viewport.height);
  if (viewport.scale <= fitted.scale * (1 + 1e-10)) return fitted;
  const center = countryCenter(viewportCenter(viewport), limits);
  const latitude = unproject(center)[1];
  const maximum = Math.max(
    fitted.scale,
    scaleForGroundResolution(latitude, MIN_GROUND_METERS_PER_PIXEL),
  );
  return atCenter(
    center,
    Math.max(fitted.scale, Math.min(maximum, viewport.scale)),
    viewport.width,
    viewport.height,
  );
}
/** Zoom retains the world point under the cursor except when a navigation limit is reached. */
export function zoomViewport(
  viewport: MapViewport,
  factor: number,
  anchor: Point,
  limits: MapNavigationLimits,
): MapViewport {
  if (!Number.isFinite(factor) || factor <= 0) return viewport;
  if (
    factor > 1 &&
    groundMetersPerPixel(viewport) <= MIN_GROUND_METERS_PER_PIXEL * (1 + 1e-9)
  )
    return viewport;
  const point = worldPoint(anchor, viewport);
  const scale = viewport.scale * factor;
  return constrainViewport(
    {
      ...viewport,
      scale,
      offsetX: anchor[0] - point[0] * scale,
      offsetY: anchor[1] - point[1] * scale,
    },
    limits,
  );
}
export function panViewport(
  viewport: MapViewport,
  dx: number,
  dy: number,
  limits: MapNavigationLimits,
): MapViewport {
  return constrainViewport(
    {
      ...viewport,
      offsetX: viewport.offsetX + dx,
      offsetY: viewport.offsetY + dy,
    },
    limits,
  );
}
export function resizeViewport(
  viewport: MapViewport,
  width: number,
  height: number,
  limits: MapNavigationLimits,
): MapViewport {
  const fitted = fitViewport(limits.bounds, viewport.width, viewport.height);
  if (viewport.scale <= fitted.scale * (1 + 1e-9))
    return fitViewport(limits.bounds, width, height);
  return constrainViewport(
    atCenter(viewportCenter(viewport), viewport.scale, width, height),
    limits,
  );
}
export function focusViewport(
  viewport: MapViewport,
  coordinate: LonLat,
  limits: MapNavigationLimits,
): MapViewport {
  return constrainViewport(
    atCenter(
      project(coordinate),
      Math.max(viewport.scale, scaleForGroundResolution(coordinate[1], 500)),
      viewport.width,
      viewport.height,
    ),
    limits,
  );
}
/** Real horizontal surface distance at the bar's latitude (Mercator is locally conformal). */
export function distanceScale(
  viewport: MapViewport,
  y = viewport.height / 2,
  maxWidth = 110,
) {
  const latitude = unproject(worldPoint([viewport.width / 2, y], viewport))[1];
  const metersPerPixel = Math.cos((latitude * Math.PI) / 180) / viewport.scale;
  const maxMeters =
    Math.max(1, Math.min(maxWidth, viewport.width / 3)) * metersPerPixel;
  const power = 10 ** Math.floor(Math.log10(maxMeters));
  const meters =
    [5, 2, 1]
      .map((value) => value * power)
      .find((value) => value <= maxMeters) ?? power / 2;
  return {
    meters,
    pixels: meters / metersPerPixel,
    metersPerPixel,
    label:
      meters >= 1000
        ? `${new Intl.NumberFormat("pl-PL").format(meters / 1000)} km`
        : `${Math.round(meters)} m`,
  };
}
/** Boundary coordinates stay cached at a base viewport; interactive movement uses an affine transform. */
export function viewportTransform(
  base: MapViewport,
  viewport: MapViewport,
): string {
  const scale = viewport.scale / base.scale;
  return `matrix(${scale} 0 0 ${scale} ${viewport.offsetX - base.offsetX * scale} ${viewport.offsetY - base.offsetY * scale})`;
}
