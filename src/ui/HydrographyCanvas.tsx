import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { BoundaryGeometry } from "../world/geography";
import type { MapViewport } from "../world/projection";
import { worldPath } from "../world/landscape/geometry";
import { loadHydrography } from "../world/landscape/loader";
import { createWaterIndex, waterDetail } from "../world/landscape/spatial";
import type { Hydrography } from "../world/landscape/model";
export const HydrographyCanvas = memo(function HydrographyCanvas({
  viewport,
  country,
}: {
  viewport: MapViewport;
  country: BoundaryGeometry;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<Hydrography | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadHydrography()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError("Hydrografia niedostępna — ponów wczytywanie.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const prepared = useMemo(
    () =>
      data
        ? {
            index: createWaterIndex(data.features),
            paths: new Map(
              data.features.map((feature) => [
                feature.id,
                feature.geometries.map(
                  (geometry) => new Path2D(worldPath(geometry)),
                ),
              ]),
            ),
          }
        : null,
    [data],
  );
  const countryPath = useMemo(() => new Path2D(worldPath(country)), [country]);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const element = canvas.current;
      if (!element) return;
      const context = element.getContext("2d");
      if (!context) return;
      const start = performance.now(),
        dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(viewport.width * dpr),
        height = Math.round(viewport.height * dpr);
      if (element.width !== width) element.width = width;
      if (element.height !== height) element.height = height;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      context.setTransform(
        dpr * viewport.scale,
        0,
        0,
        dpr * viewport.scale,
        dpr * viewport.offsetX,
        dpr * viewport.offsetY,
      );
      context.save();
      context.fillStyle = "#293c42";
      context.fill(countryPath, "evenodd");
      context.clip(countryPath, "evenodd");
      const detail = waterDetail(viewport),
        visible = prepared?.index.query(viewport) ?? [];
      // Future height/forest layers belong before these two water passes, not above labels/cities.
      for (const kind of ["lake", "river"] as const)
        for (const { feature } of visible) {
          if (feature.kind !== kind) continue;
          const path = prepared!.paths.get(feature.id)![detail];
          if (kind === "lake") {
            context.fillStyle = "#2c5268";
            context.fill(path, "evenodd");
            context.strokeStyle = "#52768b";
            context.lineWidth = 0.5 / viewport.scale;
            context.stroke(path);
          } else {
            context.strokeStyle = feature.major ? "#6590a6" : "#466d83";
            context.lineWidth =
              (feature.major ? 1.6 : detail === 2 ? 0.85 : 0.65) /
              viewport.scale;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.stroke(path);
          }
        }
      context.restore();
      element.dataset.waterStatus = data ? "ready" : "loading";
      element.dataset.waterVisible = String(visible.length);
      element.dataset.waterTotal = String(prepared?.index.size ?? 0);
      element.dataset.waterLod = String(detail);
      element.dataset.drawMs = (performance.now() - start).toFixed(2);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    schedule();
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [viewport, prepared, countryPath, data]);
  return (
    <>
      <canvas
        ref={canvas}
        className="hydrography-canvas"
        data-layer="hydrography"
        aria-hidden="true"
      />
      {error && (
        <button
          className="hydrography-error map-overlay"
          onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}
        >
          {error}
        </button>
      )}
    </>
  );
});
