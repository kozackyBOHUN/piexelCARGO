import type { LonLat } from '../geography';
import { greatCircleMeters, type PlannedRoadRoute, type RoadLeg } from './routing';
export interface RoutePosition {
  readonly coordinates: LonLat;
  /** Compass bearing, clockwise from true north. */
  readonly bearingDegrees: number;
  readonly legIndex: number;
  readonly traveledMeters: number;
  readonly remainingMeters: number;
}
function bearing(a: LonLat, b: LonLat): number {
  const r = Math.PI / 180, phi1 = a[1] * r, phi2 = b[1] * r, lambda = (b[0] - a[0]) * r;
  return ((Math.atan2(Math.sin(lambda) * Math.cos(phi2),
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda)) / r) + 360) % 360;
}
function onLeg(leg: RoadLeg, distance: number): { coordinates: LonLat; bearingDegrees: number } {
  const points = leg.geometry;
  if (!points.length) throw new Error('Odcinek bez geometrii.');
  if (points.length === 1) return { coordinates: points[0], bearingDegrees: 0 };
  const lengths = points.slice(1).map((p, i) => greatCircleMeters(points[i], p));
  const total = lengths.reduce((a, b) => a + b, 0);
  let remaining = total === 0 ? 0 : Math.max(0, Math.min(leg.meters, distance)) * total / leg.meters;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining > lengths[i] && i < lengths.length - 1) { remaining -= lengths[i]; continue; }
    const p = points[i], q = points[i + 1], fraction = lengths[i] ? Math.min(1, remaining / lengths[i]) : 0;
    return { coordinates: [p[0] + (q[0] - p[0]) * fraction, p[1] + (q[1] - p[1]) * fraction], bearingDegrees: bearing(p, q) };
  }
  return { coordinates: points.at(-1)!, bearingDegrees: bearing(points.at(-2)!, points.at(-1)!) };
}
export function positionAtMeters(route: PlannedRoadRoute, meters: number): RoutePosition {
  if (!Number.isFinite(meters)) throw new Error('Niepoprawna odległość na trasie.');
  const traveled = Math.max(0, Math.min(route.meters, meters));
  if (!route.legs.length) return { coordinates: route.geometry[0], bearingDegrees: 0, legIndex: -1, traveledMeters: 0, remainingMeters: 0 };
  let distance = traveled;
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    if (distance > leg.meters && i < route.legs.length - 1) { distance -= leg.meters; continue; }
    return { ...onLeg(leg, distance), legIndex: i, traveledMeters: traveled, remainingMeters: route.meters - traveled };
  }
  throw new Error('Niespójna długość trasy.');
}
/** Travel time and position are computed from exactly the same legs selected by routing. */
export function positionAtSeconds(route: PlannedRoadRoute, seconds: number): RoutePosition {
  if (!Number.isFinite(seconds)) throw new Error('Niepoprawny czas na trasie.');
  let time = Math.max(0, Math.min(route.seconds, seconds)), distance = 0;
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    if (time > leg.seconds && i < route.legs.length - 1) { time -= leg.seconds; distance += leg.meters; continue; }
    distance += leg.seconds > 0 ? (time / leg.seconds) * leg.meters : 0;
    return positionAtMeters(route, distance);
  }
  return positionAtMeters(route, route.meters);
}

