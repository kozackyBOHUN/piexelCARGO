/** Geographic data stays separate from simulation and save schema. WGS84 order: longitude, latitude. */
export type LonLat = readonly [number, number];
export type Ring = readonly LonLat[];
export type Polygon = readonly Ring[];
export type BoundaryGeometry =
  | { type: "Polygon"; coordinates: Polygon }
  | { type: "MultiPolygon"; coordinates: readonly Polygon[] };
export interface BoundaryFeature {
  type: "Feature";
  id: string;
  properties: { name: string };
  geometry: BoundaryGeometry;
}
export interface BoundaryCollection {
  type: "FeatureCollection";
  features: BoundaryFeature[];
}
export interface MapCity {
  id: string;
  name: string;
  voivodeshipId: string;
  coordinates: LonLat;
}
export interface GeographyDataset {
  country: BoundaryFeature;
  voivodeships: readonly BoundaryFeature[];
  cities: readonly MapCity[];
  coverage: {
    demoVoivodeshipId: string;
    label: string;
    completeCountryCities: false;
  };
}
export const polygons = (geometry: BoundaryGeometry): readonly Polygon[] =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
