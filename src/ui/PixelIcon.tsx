export type IconName =
  | "cargo"
  | "vehicle"
  | "driver"
  | "base"
  | "finance"
  | "history"
  | "settings"
  | "map"
  | "clock";
const paths: Record<IconName, string> = {
  cargo: "M2 3h12v11H2z M2 6h12 M6 3v3 M6 9h4v3H6z",
  vehicle: "M1 5h9v7H1z M10 7h3l2 3v2h-5 M3 12v2h2v-2 M11 12v2h2v-2",
  driver: "M5 2h6v6H5z M3 10h10v5H3z M6 10v3h4v-3",
  base: "M2 7l6-5 6 5v7H2z M6 14V9h4v5",
  finance: "M2 4h12v9H2z M2 7h12 M5 10h2 M10 10h1",
  history: "M4 2h8v12H4z M6 5h4 M6 8h4 M6 11h3",
  settings: "M6 1h4v3h3v2h2v4h-3v3h-2v2H6v-3H3v-2H1V6h3V3h2z M6 6h4v4H6z",
  map: "M1 3l5-2 4 2 5-2v12l-5 2-4-2-5 2z M6 1v12 M10 3v12",
  clock: "M4 1h8v2h2v2h1v7h-2v2H3v-2H1V5h2V3h1z M8 4v4h3",
};
export function PixelIcon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
