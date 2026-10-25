import type { BoundaryGeometry, LonLat } from "../geography";
export type WaterGeometry =
  | BoundaryGeometry
  | { type: "LineString"; coordinates: readonly LonLat[] }
  | { type: "MultiLineString"; coordinates: readonly (readonly LonLat[])[] };
export interface WaterFeature {
  id: string;
  kind: "river" | "lake";
  name: string;
  major: boolean;
  minDetail: number;
  geometries: readonly [WaterGeometry, WaterGeometry, WaterGeometry];
}
export interface Hydrography {
  schemaVersion: 1;
  source: string;
  features: readonly WaterFeature[];
}
