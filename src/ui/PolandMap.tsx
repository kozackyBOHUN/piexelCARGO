import { memo, useEffect, useMemo, useRef, useState } from "react";
import { loadGeography } from "../world/loader";
import type { GeographyDataset } from "../world/geography";
import {
  fitViewport,
  geometryBounds,
  geometryPath,
  screenPoint,
} from "../world/projection";
import { placeCityLabels } from "../world/labels";
import { PixelIcon } from "./PixelIcon";

/** Layer groups share one geographic projection; future roads/routes/vehicles can use screenPoint.
 * The map owns presentation state only. It neither advances nor mutates the game simulation. */
export const PolandMap = memo(function PolandMap() {
  const [data, setData] = useState<GeographyDataset | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let mounted = true;
    loadGeography()
      .then((value) => {
        if (mounted) setData(value);
      })
      .catch((error) => {
        if (mounted) setError(error.message);
      });
    return () => {
      mounted = false;
    };
  }, [attempt]);
  if (data) return <PolandMapView geography={data} />;
  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <header className="panel-heading">
        <h2 id="map-title">Obszar operacyjny</h2>
        <span className="module-tag">MAPA · ETAP 04A</span>
      </header>
      <div className="map-loading" aria-live="polite">
        <p>{error || "Wczytywanie lokalnej mapy Polski…"}</p>
        {error && (
          <button
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            Ponów wczytywanie mapy
          </button>
        )}
      </div>
    </section>
  );
});

function PolandMapView({ geography }: { geography: GeographyDataset }) {
  const [view, setView] = useState<"country" | "demo">("country");
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 320 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width, height });
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const demo = geography.voivodeships.find(
    (region) => region.id === geography.coverage.demoVoivodeshipId,
  )!;
  const viewport = useMemo(
    () =>
      fitViewport(
        geometryBounds(
          view === "country" ? geography.country.geometry : demo.geometry,
        ),
        size.width,
        size.height,
        24,
      ),
    [view, size, demo],
  );
  const paths = useMemo(
    () => ({
      country: geometryPath(geography.country.geometry, viewport),
      regions: geography.voivodeships.map((region) => ({
        region,
        path: geometryPath(region.geometry, viewport),
      })),
    }),
    [viewport],
  );
  const labels = useMemo(
    () => (view === "demo" ? placeCityLabels(geography.cities, viewport) : []),
    [viewport, view],
  );
  const selected = geography.cities.find((city) => city.id === selectedCityId);
  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <header className="panel-heading">
        <div>
          <span className="section-number">02</span>
          <h2 id="map-title">Obszar operacyjny</h2>
        </div>
        <div className="map-view-buttons" aria-label="Stałe widoki mapy">
          <button
            aria-pressed={view === "country"}
            onClick={() => setView("country")}
          >
            Cała Polska
          </button>
          <button
            aria-pressed={view === "demo"}
            onClick={() => setView("demo")}
          >
            Obszar demo
          </button>
        </div>
        <span className="module-tag">MAPA · ETAP 04A</span>
      </header>
      <div ref={container} className="geographic-map" data-testid="poland-map">
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          width="100%"
          height="100%"
          role="group"
          aria-label={
            view === "country"
              ? "Mapa Polski z granicami województw"
              : "Mapa demonstracyjna województwa małopolskiego"
          }
        >
          <desc>
            Prawdziwe granice PRG/GUGiK. Miasta GeoNames wyłącznie w
            demonstracyjnym województwie małopolskim. Brak dróg i tras.
          </desc>
          <g data-layer="voivodeships">
            {paths.regions.map(({ region, path }) => (
              <path
                key={region.id}
                data-region={region.id}
                d={path}
                className={`region-shape ${region.id === demo.id ? "demo-region" : ""}`}
                fillRule="evenodd"
              >
                <title>Województwo {region.properties.name}</title>
              </path>
            ))}
          </g>
          <g data-layer="country">
            <path
              d={paths.country}
              className="country-outline"
              fillRule="evenodd"
            />
          </g>
          <g data-layer="cities">
            {geography.cities.map((city) => {
              const [x, y] = screenPoint(city.coordinates, viewport);
              return (
                <g
                  key={city.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Miasto: ${city.name}`}
                  aria-pressed={selectedCityId === city.id}
                  className={`map-city ${selectedCityId === city.id ? "selected" : ""}`}
                  onClick={() => setSelectedCityId(city.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedCityId(city.id);
                    }
                  }}
                >
                  <title>{city.name} · woj. małopolskie</title>
                  <rect
                    x={x - 7}
                    y={y - 7}
                    width={14}
                    height={14}
                    className="city-hit-area"
                  />
                  <rect
                    x={x - (view === "country" ? 1.5 : 3)}
                    y={y - (view === "country" ? 1.5 : 3)}
                    width={view === "country" ? 3 : 6}
                    height={view === "country" ? 3 : 6}
                    className="city-marker"
                  />
                </g>
              );
            })}
          </g>
          <g data-layer="city-labels" aria-hidden="true">
            {labels.map((label) => (
              <text
                key={label.id}
                x={label.x}
                y={label.y + 11}
                className="city-label"
              >
                {label.text}
              </text>
            ))}
          </g>
        </svg>
        <div className="map-legend" aria-hidden="true">
          <span>
            <i className="legend-border" />
            Granica państwa
          </span>
          <span>
            <i className="legend-region" />
            Województwa
          </span>
          <span>
            <i className="legend-city" />
            Miasta demo
          </span>
        </div>
      </div>
      <div
        className="map-selection"
        aria-label="Położenie miasta"
        aria-live="polite"
      >
        {selected ? (
          <span>
            <strong>{selected.name}</strong> · małopolskie ·{" "}
            {selected.coordinates[1].toFixed(4)}° N,{" "}
            {selected.coordinates[0].toFixed(4)}° E
          </span>
        ) : (
          <span>
            Wybierz miasto na mapie lub z listy, aby sprawdzić jego położenie.
          </span>
        )}
        <label>
          <span className="sr-only">Miasto demonstracyjne</span>
          <select
            aria-label="Miasto demonstracyjne"
            value={selectedCityId ?? ""}
            onChange={(event) => setSelectedCityId(event.target.value || null)}
          >
            <option value="">Wybierz miasto…</option>
            {[...geography.cities]
              .sort((a, b) => a.name.localeCompare(b.name, "pl"))
              .map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="map-data-note">
        Warstwa demonstracyjna obejmuje wyłącznie 19 miast Małopolski. Pełna
        sieć miast, drogi i trasy nie są jeszcze dostępne.
      </div>
      <div className="panel-footnote map-attribution">
        <PixelIcon name="map" size={14} />
        <span>
          Granice: PRG/GUGiK, oprac. ppatrzyk (MIT) · Miasta: © GeoNames (CC BY
          4.0) ·{" "}
          <a href="/map-sources.html" target="_blank" rel="noreferrer">
            Źródła i licencje
          </a>
        </span>
      </div>
    </section>
  );
}
