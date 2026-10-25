import { expect, test } from "vitest";
import raw from "../data/hydrography.json";
import { geography } from "../data";
import {
  atCenter,
  createNavigationLimits,
  fitViewport,
  focusViewport,
  project,
} from "../projection";
import { geometryLines, worldBounds, worldPath } from "./geometry";
import { createWaterIndex, waterDetail } from "./spatial";
import type { Hydrography } from "./model";
const data = raw as unknown as Hydrography;
const limits = createNavigationLimits(geography.country.geometry);
test("pinned hydrography has eight required rivers, 33 river parts and 21 real water polygons", () => {
  expect(data.schemaVersion).toBe(1);
  expect(data.features.filter((f) => f.kind === "river")).toHaveLength(33);
  expect(data.features.filter((f) => f.kind === "lake")).toHaveLength(21);
  expect(new Set(data.features.map((f) => f.id)).size).toBe(
    data.features.length,
  );
  for (const name of [
    "Wisła",
    "Odra",
    "Warta",
    "Bug",
    "Narew",
    "San",
    "Dunajec",
    "Pilica",
  ])
    expect(
      data.features.some(
        (f) => f.name === name && f.major && f.minDetail === 0,
      ),
    ).toBe(true);
});
test("all three LODs are finite, within Poland bounds and polygon rings close", () => {
  for (const feature of data.features) {
    expect(feature.geometries).toHaveLength(3);
    for (const geometry of feature.geometries) {
      for (const line of geometryLines(geometry)) {
        expect(line.length).toBeGreaterThanOrEqual(
          feature.kind === "lake" ? 4 : 2,
        );
        expect(
          line.every(
            ([lon, lat]) =>
              Number.isFinite(lon) &&
              Number.isFinite(lat) &&
              lon >= 14.12 &&
              lon <= 24.15 &&
              lat >= 49 &&
              lat <= 54.84,
          ),
        ).toBe(true);
        if (feature.kind === "lake") expect(line[0]).toEqual(line.at(-1));
      }
      expect(worldPath(geometry)).not.toMatch(/NaN|Infinity/);
    }
  }
});
test("coarse LOD has fewer vertices without replacing river geometry with invented straight connections", () => {
  const count = (level: number) =>
    data.features.reduce(
      (sum, f) =>
        sum +
        geometryLines(f.geometries[level]).reduce(
          (n, line) => n + line.length,
          0,
        ),
      0,
    );
  expect(count(0)).toBeLessThan(count(1));
  expect(count(1)).toBeLessThan(count(2));
  const vistula = data.features.find(
    (f) =>
      f.name === "Wisła" &&
      geometryLines(f.geometries[2]).some((line) => line.length > 100),
  )!;
  expect(vistula).toBeDefined();
  expect(
    geometryLines(vistula.geometries[0]).some((line) => line.length > 10),
  ).toBe(true);
});
test("path builder uses shared Web Mercator rather than another map coordinate system", () => {
  const coordinate = [19.93658, 50.06143] as const;
  const [x, y] = project(coordinate);
  expect(
    worldPath({
      type: "LineString",
      coordinates: [coordinate, [20, 51]],
    }).startsWith(`M${x.toFixed(2)},${y.toFixed(2)}`),
  ).toBe(true);
});
test("spatial index exactly matches brute-force visibility and LOD at country/demo/city scales", () => {
  const index = createWaterIndex(data.features);
  const base = fitViewport(limits.bounds, 1000, 400);
  const views = [
    base,
    focusViewport(base, [19.93658, 50.06143], limits),
    atCenter(project([21, 53]), 0.003, 1000, 400),
  ];
  for (const viewport of views) {
    const actual = index
      .query(viewport)
      .map((r) => r.feature.id)
      .sort();
    const minX = (-4 - viewport.offsetX) / viewport.scale,
      minY = (-4 - viewport.offsetY) / viewport.scale,
      maxX = (viewport.width + 4 - viewport.offsetX) / viewport.scale,
      maxY = (viewport.height + 4 - viewport.offsetY) / viewport.scale;
    const expected = data.features
      .filter((f) => {
        const b = worldBounds(f.geometries[2]);
        return (
          f.minDetail <= waterDetail(viewport) &&
          b.minX <= maxX &&
          b.maxX >= minX &&
          b.minY <= maxY &&
          b.maxY >= minY
        );
      })
      .map((f) => f.id)
      .sort();
    expect(actual).toEqual(expected);
  }
  expect(index.query(views[1]).length).toBeLessThan(data.features.length);
});
test("detail gradually reveals tributaries and smaller lakes with zoom", () => {
  const viewport = (scale: number) =>
    atCenter(project([20, 52]), scale, 1200, 700);
  expect(waterDetail(viewport(0.0002))).toBe(0);
  expect(waterDetail(viewport(0.0006))).toBe(1);
  expect(waterDetail(viewport(0.002))).toBe(2);
});
