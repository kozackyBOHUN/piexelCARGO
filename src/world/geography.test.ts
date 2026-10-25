import { describe, expect, test } from "vitest";
import { geography } from "./data";
import { polygons, type LonLat, type Ring } from "./geography";
import {
  fitViewport,
  geometryBounds,
  geometryPath,
  project,
  screenPoint,
} from "./projection";
import { placeCityLabels } from "./labels";
function inside([x, y]: LonLat, ring: Ring) {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      result = !result;
  }
  return result;
}
test("16 uniquely identified real voivodeships and national extent", () => {
  expect(geography.voivodeships).toHaveLength(16);
  expect(new Set(geography.voivodeships.map((r) => r.id)).size).toBe(16);
  expect(geography.voivodeships.map((r) => r.id)).toEqual([
    "PL-02",
    "PL-04",
    "PL-06",
    "PL-08",
    "PL-10",
    "PL-12",
    "PL-14",
    "PL-16",
    "PL-18",
    "PL-20",
    "PL-22",
    "PL-24",
    "PL-26",
    "PL-28",
    "PL-30",
    "PL-32",
  ]);
  const coordinates = polygons(geography.country.geometry).flat(2);
  expect(Math.min(...coordinates.map((p) => p[0]))).toBeCloseTo(14.12, 1);
  expect(Math.max(...coordinates.map((p) => p[0]))).toBeCloseTo(24.15, 1);
  expect(Math.min(...coordinates.map((p) => p[1]))).toBeCloseTo(49.0, 1);
  expect(Math.max(...coordinates.map((p) => p[1]))).toBeCloseTo(54.84, 1);
});
test("all source geometries have closed finite WGS84 rings", () => {
  for (const region of [geography.country, ...geography.voivodeships])
    for (const polygon of polygons(region.geometry))
      for (const ring of polygon) {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring.at(-1));
        expect(
          ring.every(
            ([lon, lat]) =>
              Number.isFinite(lon) &&
              Number.isFinite(lat) &&
              lon >= 14 &&
              lon <= 25 &&
              lat >= 49 &&
              lat <= 55,
          ),
        ).toBe(true);
      }
});
test("19 unique demo cities use real GeoNames positions inside Małopolskie", () => {
  expect(geography.coverage.completeCountryCities).toBe(false);
  expect(geography.cities).toHaveLength(19);
  expect(new Set(geography.cities.map((c) => c.id)).size).toBe(19);
  const region = geography.voivodeships.find((r) => r.id === "PL-12")!;
  for (const city of geography.cities) {
    expect(city.voivodeshipId).toBe("PL-12");
    expect(city.id).toMatch(/^geonames:\d+$/);
    expect(
      polygons(region.geometry).some(
        (p) =>
          inside(city.coordinates, p[0]) &&
          !p.slice(1).some((r) => inside(city.coordinates, r)),
      ),
    ).toBe(true);
  }
  expect(
    geography.cities.find((c) => c.name === "Kraków")?.coordinates,
  ).toEqual([19.93658, 50.06143]);
  expect(
    geography.cities.find((c) => c.name === "Tarnów")?.coordinates,
  ).toEqual([20.98698, 50.01381]);
});
test("projection has east right, north up, and known Web Mercator origin", () => {
  const [x, y] = project([0, 0]);
  expect(x).toBe(0);
  expect(y).toBeCloseTo(0, 6);
  expect(project([20, 50])[0]).toBeLessThan(project([21, 50])[0]);
  expect(project([20, 51])[1]).toBeLessThan(project([20, 50])[1]);
});
describe.each([
  [850, 200],
  [1200, 500],
  [350, 300],
])("viewport %i×%i", (width, height) => {
  test("country fits with equal scale on both axes; resize never crops boundaries", () => {
    const viewport = fitViewport(
      geometryBounds(geography.country.geometry),
      width,
      height,
      24,
    );
    for (const polygon of polygons(geography.country.geometry))
      for (const ring of polygon)
        for (const coordinate of ring) {
          const [x, y] = screenPoint(coordinate, viewport);
          expect(x).toBeGreaterThanOrEqual(23.99);
          expect(x).toBeLessThanOrEqual(width - 23.99);
          expect(y).toBeGreaterThanOrEqual(23.99);
          expect(y).toBeLessThanOrEqual(height - 23.99);
        }
    const path = geometryPath(geography.country.geometry, viewport);
    expect(path).not.toMatch(/NaN|Infinity/);
    expect(path).toMatch(/^M/);
    expect(path.endsWith("Z")).toBe(true);
  });
  test("labels are deterministic, in viewport and do not overlap", () => {
    const region = geography.voivodeships.find((r) => r.id === "PL-12")!;
    const viewport = fitViewport(
      geometryBounds(region.geometry),
      width,
      height,
    );
    const labels = placeCityLabels(geography.cities, viewport);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels).toEqual(placeCityLabels(geography.cities, viewport));
    labels.forEach((label, i) => {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.x + label.width).toBeLessThanOrEqual(width);
      expect(label.y + label.height).toBeLessThanOrEqual(height);
      for (const other of labels.slice(i + 1))
        expect(
          label.x < other.x + other.width &&
            label.x + label.width > other.x &&
            label.y < other.y + other.height &&
            label.y + label.height > other.y,
        ).toBe(false);
    });
  });
});
