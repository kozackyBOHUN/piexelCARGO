import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import raw from "../../../public/landscape/manifest.json";
import lock from "../../../scripts/landscape-sources.json";
import { rasterWindow, type RasterManifest } from "./raster";
import { atCenter, project, scaleForGroundResolution } from "../projection";
const manifest = raw as unknown as RasterManifest;
test("real national raster covers the country grid with three compact georeferenced LODs", () => {
  expect(manifest.crs).toBe("EPSG:3857");
  expect(manifest.pixelSize).toBe(800);
  expect(manifest.landCoverage).toBe(1);
  expect(manifest.sources).toEqual({ forestTiles: 13, heightTiles: 56 });
  expect(manifest.levels.map((l) => l.factor)).toEqual([4, 2, 1]);
  expect(manifest.forestClass).toBe(10);
  expect(manifest.forestShare).toBeGreaterThan(0.2);
  expect(manifest.forestShare).toBeLessThan(0.6);
  let size = 0;
  for (const level of manifest.levels)
    for (const image of [level.terrain, level.forests]) {
      const bytes = readFileSync(
        new URL(`../../../public${image}`, import.meta.url),
      );
      size += bytes.length;
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(level.width);
      expect(bytes.readUInt32BE(20)).toBe(level.height);
    }
  expect(size).toBeLessThan(900_000);
});
test("DEM depicts Tatry/Beskidy/Bieszczady/Sudety and lowland rather than random mountains", () => {
  const height = (name: string) =>
    manifest.heightSamples.find((sample) => sample.name === name)!
      .elevationMeters;
  expect(height("Tatry")).toBeGreaterThan(1400);
  expect(height("Beskidy")).toBeGreaterThan(700);
  expect(height("Bieszczady")).toBeGreaterThan(700);
  expect(height("Sudety")).toBeGreaterThan(1000);
  expect(height("Wyżyna Krakowsko-Częstochowska")).toBeGreaterThan(250);
  expect(height("Nizina Mazowiecka")).toBeLessThan(180);
  expect(manifest.heightRange[1]).toBeGreaterThan(2000);
  expect(manifest.heightGridSha256).toMatch(/^[a-f0-9]{64}$/);
});
test("known Polish forest complexes are tree-covered in the ESA sample", () => {
  expect(manifest.forestRegions).toHaveLength(5);
  for (const region of manifest.forestRegions)
    expect(region.treeCoverShareNearPoint).toBeGreaterThan(0.5);
});
test("all acquired source tiles are locked, and terrain metadata lists only verified public-domain providers", () => {
  const entries = Object.entries(lock);
  expect(entries).toHaveLength(69);
  for (const [key, entry] of entries) {
    if (key.startsWith("ESA")) {
      const value = entry as { sampleSha256: string; etag: string };
      expect(value.sampleSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(value.etag).toBeTruthy();
    } else {
      const value = entry as { sha256: string; imagerySources: string };
      expect(value.sha256).toMatch(/^[a-f0-9]{64}$/);
      for (const source of value.imagerySources.split(", "))
        expect(["srtm", "gmted", "etopo1"]).toContain(source.split("/")[0]);
    }
  }
});
test("zoomed raster crop uses the same world camera and omits invisible image pixels", () => {
  const center = project([19.93658, 50.06143]);
  const viewport = atCenter(
    center,
    scaleForGroundResolution(50.06143, 500),
    900,
    250,
  );
  for (const level of manifest.levels) {
    const crop = rasterWindow(manifest, level.width, level.height, viewport)!;
    expect(crop).not.toBeNull();
    expect(crop.sw * crop.sh).toBeLessThan(level.width * level.height * 0.5);
    expect(crop.dx).toBeCloseTo((0 - viewport.offsetX) / viewport.scale, 6);
    expect(crop.dy).toBeCloseTo((0 - viewport.offsetY) / viewport.scale, 6);
    const projectedX =
      manifest.origin[0] +
      (crop.sx / level.width) * manifest.width * manifest.pixelSize;
    expect(projectedX).toBeCloseTo(crop.dx, 6);
  }
  const outside = atCenter([0, 0], 0.001, 100, 100);
  expect(rasterWindow(manifest, 100, 100, outside)).toBeNull();
});
test("distant forest LOD omits small islands while close view preserves the source sample", () => {
  const coverage = manifest.levels.map(
    (level) => level.forestPixelCount / (level.width * level.height),
  );
  expect(coverage[0]).toBeLessThan(coverage[2]);
  expect(manifest.levels.map((level) => level.minForestComponentCells)).toEqual(
    [25, 6, 1],
  );
  expect(manifest.levels[2].forestPixelCount).toBeGreaterThan(500_000);
});
