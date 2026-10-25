import { worldPoint, type MapViewport } from "../projection";
export interface RasterManifest {
  schemaVersion: 1;
  crs: "EPSG:3857";
  origin: readonly [number, number];
  pixelSize: number;
  width: number;
  height: number;
  levels: readonly {
    factor: number;
    width: number;
    height: number;
    terrain: string;
    forests: string;
  }[];
  forestClass: number;
  forestShare: number;
  landCoverage: number;
  heightRange: readonly [number, number];
  heightSamples: readonly {
    name: string;
    coordinates: readonly [number, number];
    elevationMeters: number;
  }[];
  forestRegions: readonly {
    name: string;
    coordinates: readonly [number, number];
    treeCoverShareNearPoint: number;
  }[];
  sources: { forestTiles: number; heightTiles: number };
  heightGridSha256: string;
}
export interface RasterLandscape {
  manifest: RasterManifest;
  images: readonly { terrain: HTMLImageElement; forests: HTMLImageElement }[];
}
let pending: Promise<RasterLandscape> | null = null;
const baseUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
function image(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const value = new Image();
    value.onload = () => resolve(value);
    value.onerror = () =>
      reject(new Error("Nie udało się wczytać lokalnego obrazu krajobrazu."));
    value.src = baseUrl(url);
  });
}
export function loadRasterLandscape(): Promise<RasterLandscape> {
  if (!pending)
    pending = fetch(baseUrl("/landscape/manifest.json"))
      .then(async (response) => {
        if (!response.ok) throw new Error("Nie udało się wczytać krajobrazu.");
        const manifest = (await response.json()) as RasterManifest;
        if (
          manifest.schemaVersion !== 1 ||
          manifest.crs !== "EPSG:3857" ||
          manifest.levels.length !== 3 ||
          manifest.width <= 0 ||
          manifest.height <= 0
        )
          throw new Error("Niepoprawny zestaw krajobrazu.");
        const images = await Promise.all(
          manifest.levels.map(async (level) => {
            const [terrain, forests] = await Promise.all([
              image(level.terrain),
              image(level.forests),
            ]);
            if (
              terrain.width !== level.width ||
              terrain.height !== level.height ||
              forests.width !== level.width ||
              forests.height !== level.height
            )
              throw new Error("Niepoprawny rozmiar obrazu krajobrazu.");
            return { terrain, forests };
          }),
        );
        return { manifest, images };
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  return pending;
}
/** Crop before draw: a zoomed city view never resamples the entire national raster. */
export function rasterWindow(
  manifest: RasterManifest,
  imageWidth: number,
  imageHeight: number,
  viewport: MapViewport,
) {
  const [left, top] = manifest.origin,
    totalWidth = manifest.width * manifest.pixelSize,
    totalHeight = manifest.height * manifest.pixelSize;
  const [x0, y0] = worldPoint([0, 0], viewport),
    [x1, y1] = worldPoint([viewport.width, viewport.height], viewport);
  const minX = Math.max(left, x0),
    minY = Math.max(top, y0),
    maxX = Math.min(left + totalWidth, x1),
    maxY = Math.min(top + totalHeight, y1);
  if (maxX <= minX || maxY <= minY) return null;
  return {
    sx: ((minX - left) / totalWidth) * imageWidth,
    sy: ((minY - top) / totalHeight) * imageHeight,
    sw: ((maxX - minX) / totalWidth) * imageWidth,
    sh: ((maxY - minY) / totalHeight) * imageHeight,
    dx: minX,
    dy: minY,
    dw: maxX - minX,
    dh: maxY - minY,
  };
}
