import country from "./data/poland.json";
import voivodeships from "./data/voivodeships.json";
import cities from "./data/cities-demo.json";
import type {
  BoundaryCollection,
  BoundaryFeature,
  GeographyDataset,
  MapCity,
} from "./geography";
/** Checked-in, checksum-pinned data; no tile service or runtime API dependency. */
export const geography: GeographyDataset = {
  country: country as unknown as BoundaryFeature,
  voivodeships: (voivodeships as unknown as BoundaryCollection).features,
  cities: cities as unknown as MapCity[],
  coverage: {
    demoVoivodeshipId: "PL-12",
    label: "Małopolskie · 19 miast demonstracyjnych",
    completeCountryCities: false,
  },
};
