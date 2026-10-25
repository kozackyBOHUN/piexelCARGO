import { describe, expect, test } from "vitest";
import { geography } from "./data";
import { polygons } from "./geography";
import { placeCityLabels } from "./labels";
import { normalizeCityName, searchCities } from "./search";
import {
  atCenter,
  constrainViewport,
  createNavigationLimits,
  distanceScale,
  fitViewport,
  focusViewport,
  groundMetersPerPixel,
  panViewport,
  project,
  resizeViewport,
  scaleForGroundResolution,
  screenPoint,
  unproject,
  viewportCenter,
  worldPoint,
  zoomViewport,
} from "./projection";
const limits = createNavigationLimits(geography.country.geometry);
const krakow = geography.cities.find((city) => city.name === "Kraków")!;
const closePoint = (actual: readonly number[], expected: readonly number[]) => {
  expect(actual[0]).toBeCloseTo(expected[0], 6);
  expect(actual[1]).toBeCloseTo(expected[1], 6);
};
const base = () => fitViewport(limits.bounds, 900, 300);
test("Web Mercator roundtrip and ground resolution account for latitude", () => {
  for (const position of [
    [19, 49],
    [22, 54],
  ] as const)
    closePoint(unproject(project(position)), position);
  for (const latitude of [49, 52, 55]) {
    const viewport = atCenter(
      project([20, latitude]),
      scaleForGroundResolution(latitude, 200),
      900,
      300,
    );
    expect(groundMetersPerPixel(viewport)).toBeCloseTo(200, 10);
  }
  expect(scaleForGroundResolution(55, 200)).toBeLessThan(
    scaleForGroundResolution(49, 200),
  );
});
test("unconstrained cursor zoom keeps the exact geographic point under cursor", () => {
  const viewport = focusViewport(base(), krakow.coordinates, limits);
  const anchor = [480, 165] as const;
  const next = zoomViewport(viewport, 1.25, anchor, limits);
  closePoint(worldPoint(anchor, next), worldPoint(anchor, viewport));
  expect(next.scale).toBeCloseTo(viewport.scale * 1.25, 10);
});
test("zoom-out stops at whole Poland; zoom-in stops at 200 actual m/CSS px", () => {
  let viewport = focusViewport(base(), krakow.coordinates, limits);
  for (let i = 0; i < 20; i++)
    viewport = zoomViewport(viewport, 1.35, [450, 150], limits);
  expect(groundMetersPerPixel(viewport)).toBeCloseTo(200, 8);
  expect(zoomViewport(viewport, 2, [460, 155], limits)).toBe(viewport);
  expect(zoomViewport(viewport, 1e-9, [0, 0], limits)).toEqual(base());
});
test.each([49.2, 50, 52, 54.6])(
  "max zoom is 200m at latitude %f",
  (latitude) => {
    const center = project([20, latitude]);
    const viewport = constrainViewport(atCenter(center, 1, 900, 300), limits);
    expect(groundMetersPerPixel(viewport)).toBeCloseTo(200, 8);
  },
);
test("pan is in CSS pixels at any zoom, and cannot lose Poland even at bounding-box corners", () => {
  const initial = focusViewport(base(), krakow.coordinates, limits);
  const next = panViewport(initial, 15, -8, limits);
  const before = screenPoint(krakow.coordinates, initial),
    after = screenPoint(krakow.coordinates, next);
  expect(after[0] - before[0]).toBeCloseTo(15, 7);
  expect(after[1] - before[1]).toBeCloseTo(-8, 7);
  for (const [dx, dy] of [
    [1e6, 1e6],
    [-1e6, 1e6],
    [1e6, -1e6],
    [-1e6, -1e6],
  ]) {
    const outside = panViewport(initial, dx, dy, limits);
    expect(groundMetersPerPixel(outside)).toBeGreaterThanOrEqual(200 - 1e-8);
    const visible = polygons(geography.country.geometry)
      .flat(2)
      .some((coordinate) => {
        const [x, y] = screenPoint(coordinate, outside);
        return x >= 0 && x <= outside.width && y >= 0 && y <= outside.height;
      });
    expect(visible).toBe(true);
  }
});
test("resize fits at min zoom and preserves zoomed center and ground resolution", () => {
  const all = resizeViewport(base(), 1300, 600, limits);
  expect(all).toEqual(fitViewport(limits.bounds, 1300, 600));
  const zoomed = focusViewport(base(), krakow.coordinates, limits);
  const resized = resizeViewport(zoomed, 1100, 400, limits);
  closePoint(viewportCenter(resized), viewportCenter(zoomed));
  expect(groundMetersPerPixel(resized)).toBeCloseTo(
    groundMetersPerPixel(zoomed),
    8,
  );
});
test("real scale bar is nice-valued and uses its own latitude, not uncorrected projected meters", () => {
  const viewport = focusViewport(base(), krakow.coordinates, limits);
  for (const y of [20, 150, 280]) {
    const scale = distanceScale(viewport, y);
    const latitude = unproject(worldPoint([450, y], viewport))[1];
    expect(scale.meters / scale.pixels).toBeCloseTo(
      Math.cos((latitude * Math.PI) / 180) / viewport.scale,
      8,
    );
    expect(scale.pixels).toBeLessThanOrEqual(110);
    expect(scale.pixels).toBeGreaterThan(0);
    const power = 10 ** Math.floor(Math.log10(scale.meters));
    expect([1, 2, 5]).toContain(scale.meters / power);
  }
  expect(distanceScale(viewport).meters).toBeLessThan(
    distanceScale(base()).meters,
  );
});
test("search supports fragments, Polish letters, case, Ł and empty/no-result queries", () => {
  expect(normalizeCityName("  ŁÓDŹ ĄĆĘŃŚŹŻ  ")).toBe("lodz acenszz");
  for (const query of ["krakow", "KRAKÓW", "RakO"])
    expect(searchCities(geography.cities, query)[0].name).toBe("Kraków");
  expect(searchCities(geography.cities, "sacz")[0].name).toBe("Nowy Sącz");
  expect(searchCities(geography.cities, "wiecim")[0].name).toBe("Oświęcim");
  expect(searchCities(geography.cities, "nowy")).toHaveLength(2);
  expect(searchCities(geography.cities, "   ")).toEqual([]);
  expect(searchCities(geography.cities, "Warszawa")).toEqual([]);
});
describe.each([2500, 1000, 200])("labels at %im/px", (resolution) => {
  test("prioritize selected city, reveal more names and never overlap", () => {
    const viewport = atCenter(
      project(krakow.coordinates),
      scaleForGroundResolution(krakow.coordinates[1], resolution),
      1200,
      700,
    );
    const labels = placeCityLabels(geography.cities, viewport, krakow.id);
    expect(labels[0]?.id).toBe(krakow.id);
    if (resolution > 1800) expect(labels.length).toBeLessThanOrEqual(3);
    if (resolution === 1000) expect(labels.length).toBeLessThanOrEqual(9);
    labels.forEach((label, i) => {
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
test("close zoom shows more labels when space allows and labels never leave the viewport", () => {
  const counts = [2500, 1000, 200].map((resolution) => {
    const viewport = atCenter(
      project(krakow.coordinates),
      scaleForGroundResolution(krakow.coordinates[1], resolution),
      2000,
      1600,
    );
    const labels = placeCityLabels(geography.cities, viewport, krakow.id);
    for (const label of labels) {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.x + label.width).toBeLessThanOrEqual(viewport.width);
      expect(label.y + label.height).toBeLessThanOrEqual(viewport.height);
    }
    return labels.length;
  });
  expect(counts[1]).toBeGreaterThan(counts[0]);
  expect(counts[2]).toBeGreaterThan(counts[1]);
});
