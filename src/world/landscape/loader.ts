import dataUrl from "../data/hydrography.json?url";
import type { Hydrography } from "./model";
let pending: Promise<Hydrography> | null = null;
export function loadHydrography(): Promise<Hydrography> {
  if (!pending)
    pending = fetch(dataUrl)
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Nie udało się wczytać lokalnej hydrografii.");
        const data = await response.json();
        if (
          data.schemaVersion !== 1 ||
          !Array.isArray(data.features) ||
          data.features.length === 0
        )
          throw new Error("Niepoprawne dane hydrografii.");
        return data as Hydrography;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  return pending;
}
