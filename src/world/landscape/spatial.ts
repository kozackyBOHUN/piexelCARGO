import {
  groundMetersPerPixel,
  worldPoint,
  type Bounds,
  type MapViewport,
} from "../projection";
import { worldBounds } from "./geometry";
import type { WaterFeature } from "./model";
export const waterDetail = (viewport: MapViewport) =>
  groundMetersPerPixel(viewport) > 1800
    ? 0
    : groundMetersPerPixel(viewport) > 700
      ? 1
      : 2;
const intersects = (a: Bounds, b: Bounds) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
/** Small uniform grid gives viewport candidates without scanning every feature each frame. */
export function createWaterIndex(features: readonly WaterFeature[]) {
  const size = 200_000;
  const cells = new Map<string, Set<number>>();
  const records = features.map((feature) => ({
    feature,
    bounds: worldBounds(feature.geometries[2]),
  }));
  const visit = (bounds: Bounds, fn: (key: string) => void) => {
    for (
      let x = Math.floor(bounds.minX / size);
      x <= Math.floor(bounds.maxX / size);
      x++
    )
      for (
        let y = Math.floor(bounds.minY / size);
        y <= Math.floor(bounds.maxY / size);
        y++
      )
        fn(`${x}:${y}`);
  };
  records.forEach((record, index) =>
    visit(record.bounds, (key) => {
      if (!cells.has(key)) cells.set(key, new Set());
      cells.get(key)!.add(index);
    }),
  );
  return {
    query(viewport: MapViewport) {
      const [minX, minY] = worldPoint([-4, -4], viewport),
        [maxX, maxY] = worldPoint(
          [viewport.width + 4, viewport.height + 4],
          viewport,
        );
      const bounds = { minX, minY, maxX, maxY },
        candidates = new Set<number>();
      visit(bounds, (key) =>
        cells.get(key)?.forEach((index) => candidates.add(index)),
      );
      const detail = waterDetail(viewport);
      return [...candidates]
        .sort((a, b) => a - b)
        .map((index) => records[index])
        .filter(
          (record) =>
            record.feature.minDetail <= detail &&
            intersects(record.bounds, bounds),
        );
    },
    size: records.length,
  };
}
