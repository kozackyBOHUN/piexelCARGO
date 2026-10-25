import { memo, useEffect, useMemo, useRef, useState } from "react";
import { loadGeography } from "../world/loader";
import type { GeographyDataset, MapCity } from "../world/geography";
import {
  fitViewport,
  geometryBounds,
  geometryPath,
  screenPoint,
  atCenter,
  constrainViewport,
  createNavigationLimits,
  distanceScale,
  focusViewport,
  groundMetersPerPixel,
  panViewport,
  resizeViewport,
  viewportCenter,
  viewportTransform,
  zoomViewport,
  type MapViewport,
  type Point,
} from "../world/projection";
import { placeCityLabels } from "../world/labels";
import { PixelIcon } from "./PixelIcon";
import { CitySearch } from "./CitySearch";

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
        <span className="module-tag">MAPA · ETAP 04B</span>
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
  const limits = useMemo(
    () => createNavigationLimits(geography.country.geometry),
    [geography],
  );
  const demo = geography.voivodeships.find(
    (region) => region.id === geography.coverage.demoVoivodeshipId,
  )!;
  const [view, setView] = useState<"country" | "demo" | "custom">("country");
  const [viewport, setViewport] = useState(() =>
    fitViewport(limits.bounds, 800, 320),
  );
  const current = useRef(viewport);
  const container = useRef<HTMLDivElement>(null);
  const animation = useRef<number | null>(null);
  const animationTarget = useRef<MapViewport | null>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    start: MapViewport;
    dragged: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [cluster, setCluster] = useState<readonly MapCity[]>([]);
  const write = (next: MapViewport) => {
    current.current = next;
    setViewport(next);
  };
  const cancelAnimation = () => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    animationTarget.current = null;
  };
  const change = (operation: (value: MapViewport) => MapViewport) => {
    cancelAnimation();
    write(operation(current.current));
  };
  useEffect(() => {
    const element = container.current!;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        cancelAnimation();
        gesture.current = null;
        setDragging(false);
        write(resizeViewport(current.current, width, height, limits));
      }
    });
    observer.observe(element);
    // React wheel handlers may be passive. Only this map owns/prevents its wheel events.
    const wheel = (event: WheelEvent) => {
      if ((event.target as Element).closest(".map-overlay")) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const delta =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      const factor = Math.exp(-Math.max(-250, Math.min(250, delta)) * 0.002);
      setView("custom");
      setCluster([]);
      change((value) =>
        zoomViewport(
          value,
          factor,
          [event.clientX - rect.left, event.clientY - rect.top],
          limits,
        ),
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
      cancelAnimation();
    };
  }, [limits]);
  const base = useMemo(
    () => fitViewport(limits.bounds, viewport.width, viewport.height),
    [limits, viewport.width, viewport.height],
  );
  // Rebuild geographic paths only on resize, never on each drag, wheel or animation frame.
  const paths = useMemo(
    () => ({
      country: geometryPath(geography.country.geometry, base),
      regions: geography.voivodeships.map((region) => ({
        region,
        path: geometryPath(region.geometry, base),
      })),
    }),
    [geography, base],
  );
  const labels = useMemo(
    () => placeCityLabels(geography.cities, viewport, selectedCityId),
    [geography, viewport, selectedCityId],
  );
  const selected = geography.cities.find((city) => city.id === selectedCityId);
  const selectedPoint = selected
    ? screenPoint(selected.coordinates, viewport)
    : null;
  const selectedVisible =
    selectedPoint &&
    selectedPoint[0] >= 10 &&
    selectedPoint[0] <= viewport.width - 10 &&
    selectedPoint[1] >= 10 &&
    selectedPoint[1] <= viewport.height - 10;
  const scale = distanceScale(viewport, viewport.height - 12.5);
  const reset = (target: "country" | "demo") => {
    setView(target);
    setCluster([]);
    change((value) =>
      constrainViewport(
        fitViewport(
          target === "country" ? limits.bounds : geometryBounds(demo.geometry),
          value.width,
          value.height,
        ),
        limits,
      ),
    );
  };
  const focusCity = (city: MapCity) => {
    setSelectedCityId(city.id);
    setCluster([]);
    setView("custom");
    change((value) => focusViewport(value, city.coordinates, limits));
  };
  const selectMarker = (city: MapCity) => {
    setSelectedCityId(city.id);
    setCluster([]);
  };
  const zoomButton = (factor: number) => {
    setView("custom");
    setCluster([]);
    const pending = animationTarget.current;
    cancelAnimation();
    const from = current.current;
    const target = zoomViewport(
      pending ?? from,
      factor,
      [from.width / 2, from.height / 2],
      limits,
    );
    animationTarget.current = target;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      write(target);
      animationTarget.current = null;
      return;
    }
    const start = performance.now(),
      a = viewportCenter(from),
      b = viewportCenter(target);
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 150),
        eased = 1 - (1 - t) ** 3;
      const center: Point = [
        a[0] + (b[0] - a[0]) * eased,
        a[1] + (b[1] - a[1]) * eased,
      ];
      write(
        constrainViewport(
          atCenter(
            center,
            from.scale * (target.scale / from.scale) ** eased,
            from.width,
            from.height,
          ),
          limits,
        ),
      );
      animation.current = t < 1 ? requestAnimationFrame(frame) : null;
      if (t === 1) animationTarget.current = null;
    };
    animation.current = requestAnimationFrame(frame);
  };
  const renderedCities = [
    ...geography.cities.filter((city) => city.id !== selectedCityId),
    ...geography.cities.filter((city) => city.id === selectedCityId),
  ];
  return (
    <section className="panel map-panel" aria-labelledby="map-title">
      <header className="panel-heading">
        <div>
          <span className="section-number">02</span>
          <h2 id="map-title">Obszar operacyjny</h2>
        </div>
        <div className="map-view-buttons" aria-label="Widoki mapy">
          <button
            aria-pressed={view === "country"}
            onClick={() => reset("country")}
          >
            Cała Polska
          </button>
          <button aria-pressed={view === "demo"} onClick={() => reset("demo")}>
            Obszar demo
          </button>
        </div>
        <span className="module-tag">MAPA · ETAP 04B</span>
      </header>
      <CitySearch
        cities={geography.cities}
        voivodeships={geography.voivodeships}
        onSelect={focusCity}
      />
      <div
        ref={container}
        className={`geographic-map ${dragging ? "is-dragging" : ""}`}
        data-testid="poland-map"
        data-map-scale={viewport.scale}
        data-offset-x={viewport.offsetX}
        data-offset-y={viewport.offsetY}
        data-width={viewport.width}
        data-height={viewport.height}
        data-ground-resolution={groundMetersPerPixel(viewport)}
        onPointerDown={(event) => {
          if (event.button !== 0 || !event.isPrimary) return;
          suppressClick.current = false;
          if ((event.target as Element).closest(".map-overlay")) return;
          cancelAnimation();
          gesture.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            start: current.current,
            dragged: false,
          };
        }}
        onPointerMove={(event) => {
          const active = gesture.current;
          if (!active || event.pointerId !== active.id) return;
          const dx = event.clientX - active.x,
            dy = event.clientY - active.y;
          if (!active.dragged && Math.hypot(dx, dy) < 4) return;
          if (!active.dragged) {
            active.dragged = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            setView("custom");
            setCluster([]);
          }
          write(panViewport(active.start, dx, dy, limits));
        }}
        onPointerUp={(event) => {
          if (gesture.current?.id !== event.pointerId) return;
          gesture.current = null;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          gesture.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          gesture.current = null;
          setDragging(false);
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <svg
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          width="100%"
          height="100%"
          role="group"
          aria-label={
            view === "demo"
              ? "Mapa demonstracyjna województwa małopolskiego"
              : "Mapa Polski z granicami województw"
          }
        >
          <desc>
            Prawdziwe granice PRG/GUGiK i 19 miast demo GeoNames. Przeciągnij,
            aby przesunąć; użyj kółka lub przycisków powiększenia. Brak dróg i
            tras.
          </desc>
          <g
            transform={viewportTransform(base, viewport)}
            data-layer="boundaries"
          >
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
          </g>
          <g data-layer="cities">
            {renderedCities.map((city) => {
              const [x, y] = screenPoint(city.coordinates, viewport);
              const markerSize = groundMetersPerPixel(viewport) > 1800 ? 4 : 6;
              return (
                <g
                  key={city.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Miasto: ${city.name}`}
                  aria-pressed={selectedCityId === city.id}
                  className={`map-city ${selectedCityId === city.id ? "selected" : ""}`}
                  data-city-id={city.id}
                  onFocus={() => {
                    const point = screenPoint(
                      city.coordinates,
                      current.current,
                    );
                    if (
                      point[0] < 12 ||
                      point[0] > current.current.width - 12 ||
                      point[1] < 12 ||
                      point[1] > current.current.height - 12
                    )
                      change((value) =>
                        focusViewport(value, city.coordinates, limits),
                      );
                  }}
                  onClick={(event) => {
                    const nearby = geography.cities.filter((other) => {
                      const p = screenPoint(other.coordinates, current.current);
                      return Math.hypot(p[0] - x, p[1] - y) < 14;
                    });
                    if (event.detail !== 0 && nearby.length > 1)
                      setCluster(nearby);
                    else selectMarker(city);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectMarker(city);
                    }
                  }}
                >
                  <title>
                    {city.name} · woj.{" "}
                    {
                      geography.voivodeships.find(
                        (region) => region.id === city.voivodeshipId,
                      )?.properties.name
                    }
                  </title>
                  <rect
                    x={x - 8}
                    y={y - 8}
                    width={16}
                    height={16}
                    className="city-hit-area"
                  />
                  <rect
                    x={x - markerSize / 2}
                    y={y - markerSize / 2}
                    width={markerSize}
                    height={markerSize}
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
                className={`city-label ${label.id === selectedCityId ? "selected-label" : ""}`}
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
        <div className="map-zoom map-overlay" aria-label="Powiększenie mapy">
          <button
            aria-label="Przybliż mapę"
            onClick={() => zoomButton(1.35)}
            disabled={groundMetersPerPixel(viewport) <= 200.001}
          >
            +
          </button>
          <button
            aria-label="Oddal mapę"
            onClick={() => zoomButton(1 / 1.35)}
            disabled={viewport.scale <= base.scale * (1 + 1e-9)}
          >
            −
          </button>
        </div>
        <div
          className="map-scale"
          aria-label={`Skala odległości: ${scale.label}`}
          data-testid="map-scale"
          data-meters={scale.meters}
          data-pixels={scale.pixels}
        >
          <span>{scale.label}</span>
          <i style={{ width: scale.pixels }} />
        </div>
        {cluster.length > 0 && (
          <div
            className="map-cluster map-overlay"
            aria-label="Wybierz miasto z grupy"
          >
            <div>
              Miasta w tym miejscu
              <button
                aria-label="Zamknij wybór miast"
                onClick={() => setCluster([])}
              >
                ×
              </button>
            </div>
            {cluster.map((city) => (
              <button key={city.id} onClick={() => focusCity(city)}>
                {city.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div
        className="map-selection"
        aria-label="Położenie miasta"
        aria-live="polite"
      >
        {selected ? (
          <span>
            <strong>{selected.name}</strong> ·{" "}
            {
              geography.voivodeships.find(
                (region) => region.id === selected.voivodeshipId,
              )?.properties.name
            }{" "}
            · {selected.coordinates[1].toFixed(4)}° N,{" "}
            {selected.coordinates[0].toFixed(4)}° E{" "}
            {!selectedVisible && (
              <button
                className="reveal-city"
                onClick={() => focusCity(selected)}
              >
                Pokaż miasto
              </button>
            )}
          </span>
        ) : (
          <span>
            Przeciąganie: przesuń · kółko: zoom · wybierz miasto, aby zobaczyć
            współrzędne.
          </span>
        )}
        <label>
          <span className="sr-only">Miasto demonstracyjne</span>
          <select
            aria-label="Miasto demonstracyjne"
            value={selectedCityId ?? ""}
            onChange={(event) => {
              const city = geography.cities.find(
                (city) => city.id === event.target.value,
              );
              if (city) focusCity(city);
              else setSelectedCityId(null);
            }}
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
