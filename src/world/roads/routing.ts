import type { LonLat } from '../geography';
import { createNetwork, type DirectedEdge, type RoadGraph, type RoadNetwork, type TurnRelation } from './model';

export interface VanProfile {
  readonly id: string;
  readonly vehicle: 'motorcar';
  readonly maxSpeedKph: number;
  readonly massTonnes?: number;
  readonly heightMeters?: number;
  readonly widthMeters?: number;
}
export const DEFAULT_VAN: VanProfile = { id: 'van-default-v1', vehicle: 'motorcar', maxSpeedKph: 120, massTonnes: 3.5, heightMeters: 2.7, widthMeters: 2.1 };
export interface RoadLeg {
  readonly edgeId: string;
  readonly segmentId: string;
  readonly fromNodeId: number;
  readonly toNodeId: number;
  readonly wayId: number;
  readonly meters: number;
  readonly seconds: number;
  readonly geometry: readonly LonLat[];
}
export interface PlannedRoadRoute {
  readonly id: string;
  readonly graphVersion: string;
  readonly profileId: string;
  readonly fromNodeId: number;
  readonly toNodeId: number;
  readonly fromCityId?: string;
  readonly toCityId?: string;
  readonly nodeIds: readonly number[];
  readonly edgeIds: readonly string[];
  readonly legs: readonly RoadLeg[];
  readonly geometry: readonly LonLat[];
  readonly meters: number;
  readonly seconds: number;
}
export interface RoutingDiagnostics {
  /** Unsupported multi-way via restrictions are conservatively closed at their entry, not treated as legal turns. */
  readonly conservativeViaWayRestrictions: readonly number[];
  readonly unsupportedRestrictions: readonly number[];
}
export interface RoutingResult { readonly route: PlannedRoadRoute | null; readonly diagnostics: RoutingDiagnostics }
export type RoutingStrategy = 'astar' | 'dijkstra';
const SPEEDS: Readonly<Record<string, number>> = {
  motorway: 120, motorway_link: 60, trunk: 100, trunk_link: 55,
  primary: 80, primary_link: 45, secondary: 70, secondary_link: 40,
  tertiary: 60, tertiary_link: 35, unclassified: 45, residential: 40,
  living_street: 15, service: 20,
};
const EARTH = 6371008.8;
export function greatCircleMeters(a: LonLat, b: LonLat): number {
  const toRadians = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRadians, dLon = (b[0] - a[0]) * toRadians;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toRadians) * Math.cos(b[1] * toRadians) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}
function limitMeters(value: string | undefined, unit: 't' | 'm'): number | undefined {
  if (!value || ['none', 'default'].includes(value.trim().toLowerCase())) return undefined;
  const match = value.trim().toLowerCase().replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(t|tonnes?|kg|m|cm)?$/);
  if (!match) return NaN; // Unknown restrictions are not assumed permissible.
  const amount = Number(match[1]);
  const suffix = match[2];
  return unit === 't' ? (suffix === 'kg' ? amount / 1000 : (!suffix || suffix === 't' || suffix.startsWith('ton') ? amount : NaN))
    : (suffix === 'cm' ? amount / 100 : (!suffix || suffix === 'm' ? amount : NaN));
}
function edgeAllowed(tags: Record<string, string>, profile: VanProfile): boolean {
  for (const [key, amount, unit] of [
    ['maxweight', profile.massTonnes, 't'], ['maxheight', profile.heightMeters, 'm'], ['maxwidth', profile.widthMeters, 'm'],
  ] as const) {
    if (amount === undefined) continue;
    const maximum = limitMeters(tags[key], unit);
    if (maximum !== undefined && !(amount <= maximum)) return false;
  }
  if (Object.keys(tags).some(key => /^(maxweight|maxheight|maxwidth):conditional$/.test(key))) return false;
  return true;
}
function speedKph(tags: Record<string, string>, reverse: boolean, profile: VanProfile): number {
  const parseSpeed = (raw: string | undefined): number | undefined => {
    if (!raw) return undefined;
    const s = raw.trim().toLowerCase().replace(',', '.');
    const match = s.match(/^(\d+(?:\.\d+)?)\s*(km\/h|kmh|kph|mph)?$/);
    if (match) return Number(match[1]) * (match[2] === 'mph' ? 1.609344 : 1);
    if (s === 'walk') return 5;
    return undefined;
  };
  const direction = reverse ? 'backward' : 'forward';
  const posted = parseSpeed(tags[`maxspeed:${direction}`]) ?? parseSpeed(tags.maxspeed);
  return Math.max(1, Math.min(profile.maxSpeedKph, posted ?? SPEEDS[tags.highway] ?? 30));
}
interface ViaNodeRule { readonly id: number; readonly kind: 'no' | 'only'; readonly toWay: number; readonly uturn: boolean }
interface TurnRules { readonly byNodeAndFrom: Map<string, ViaNodeRule[]>; readonly blockedViaWayEntries: Map<number, Set<number>>; readonly diagnostics: RoutingDiagnostics }
function memberId(relation: TurnRelation, role: string, type: string): number | undefined {
  return relation.members.find(m => m[2] === role && (m[0] === type || m[0] === (type === 'w' ? 'way' : 'node')))?.[1];
}
function restrictions(graph: RoadGraph, profile: VanProfile): TurnRules {
  const byNodeAndFrom = new Map<string, ViaNodeRule[]>(), blockedViaWayEntries = new Map<number, Set<number>>();
  const conservative: number[] = [], unsupported: number[] = [];
  for (const relation of graph.restrictions) {
    const except = (relation.tags.except ?? '').split(/[;,]/).map(t => t.trim().toLowerCase());
    if (except.some(t => t === 'motorcar' || t === 'motor_vehicle' || t === 'vehicle')) continue;
    const restriction = relation.tags['restriction:motorcar'] ?? relation.tags.restriction;
    if (!restriction) { unsupported.push(relation.id); continue; }
    const kind = restriction.startsWith('only_') ? 'only' : restriction.startsWith('no_') ? 'no' : null;
    const from = memberId(relation, 'from', 'w'), to = memberId(relation, 'to', 'w');
    const viaNode = memberId(relation, 'via', 'n');
    const viaWays = relation.members.filter(m => m[2] === 'via' && (m[0] === 'w' || m[0] === 'way')).map(m => m[1]);
    if (!kind || from === undefined || to === undefined) { unsupported.push(relation.id); continue; }
    if (viaWays.length) {
      // Keeping the graph conservative avoids treating partially implemented via-way restrictions as legal.
      // Closing the entry turn is stricter than OSM and may produce a detour; reported in diagnostics.
      const existing = blockedViaWayEntries.get(from) ?? new Set<number>();
      existing.add(viaWays[0]); blockedViaWayEntries.set(from, existing);
      conservative.push(relation.id);
    } else if (viaNode !== undefined) {
      const key = `${viaNode}:${from}`;
      const list = byNodeAndFrom.get(key) ?? [];
      list.push({ id: relation.id, kind, toWay: to, uturn: restriction === 'no_u_turn' });
      byNodeAndFrom.set(key, list);
    } else unsupported.push(relation.id);
  }
  return { byNodeAndFrom, blockedViaWayEntries,
    diagnostics: { conservativeViaWayRestrictions: conservative, unsupportedRestrictions: unsupported } };
}
function canTurn(network: RoadNetwork, prior: DirectedEdge, next: DirectedEdge, rules: TurnRules): boolean {
  const prevWay = network.graph.ways[network.graph.segments[prior.segment][3]].id;
  const nextWay = network.graph.ways[network.graph.segments[next.segment][3]].id;
  if (rules.blockedViaWayEntries.get(prevWay)?.has(nextWay)) return false;
  const via = network.graph.nodes[prior.to][0];
  const constraints = rules.byNodeAndFrom.get(`${via}:${prevWay}`);
  if (!constraints) return true;
  // Multiple only_* choices on the same junction are alternatives, not mutually exclusive ANDs.
  const allowed = constraints.filter(r => r.kind === 'only');
  if (allowed.length && !allowed.some(r => r.toWay === nextWay)) return false;
  return !constraints.some(r => r.kind === 'no' && r.toWay === nextWay && (!r.uturn || prior.from === next.to));
}
class Heap {
  private readonly items: { edge: number; cost: number; distance: number }[] = [];
  push(value: { edge: number; cost: number; distance: number }): void {
    const a = this.items; a.push(value); let i = a.length - 1;
    while (i) { const p = (i - 1) >>> 1; if (!this.less(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; }
  }
  pop(): { edge: number; cost: number; distance: number } | undefined {
    const a = this.items; if (!a.length) return undefined;
    const head = a[0], tail = a.pop()!;
    if (a.length) { a[0] = tail; let i = 0; while (true) {
      let j = i, l = i * 2 + 1, r = l + 1;
      if (l < a.length && this.less(a[l], a[j])) j = l;
      if (r < a.length && this.less(a[r], a[j])) j = r;
      if (j === i) break; [a[i], a[j]] = [a[j], a[i]]; i = j;
    }}
    return head;
  }
  get length(): number { return this.items.length; }
  private less(a: {edge:number; cost:number; distance:number}, b: {edge:number; cost:number; distance:number}): boolean {
    return a.cost < b.cost || (a.cost === b.cost && (a.distance < b.distance || (a.distance === b.distance && a.edge < b.edge)));
  }
}
function routeId(graph: RoadGraph, profile: VanProfile, nodeIds: readonly number[], edgeIds: readonly string[]): string {
  let h = 2166136261;
  const data = `${graph.version}|${profile.id}|${nodeIds[0]}|${nodeIds.at(-1)}|${edgeIds.join('|')}`;
  for (let i = 0; i < data.length; i++) { h ^= data.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `road:${graph.version}:${(h >>> 0).toString(16).padStart(8, '0')}`;
}
export function makeRoadRouter(network: RoadNetwork, profile: VanProfile = DEFAULT_VAN) {
  if (!(profile.maxSpeedKph > 0) || !Number.isFinite(profile.maxSpeedKph)) throw new Error('Niepoprawny profil prędkości.');
  const rules = restrictions(network.graph, profile);
  const graph = network.graph;
  const allowedWays = graph.ways.map(w => edgeAllowed(w.tags, profile));
  const secondsPerEdge = network.edges.map(edge => {
    const s = graph.segments[edge.segment], tags = graph.ways[s[3]].tags;
    return s[4] * 3.6 / speedKph(tags, edge.reverse, profile);
  });
  function findBetweenNodes(fromNodeId: number, toNodeId: number, strategy: RoutingStrategy = 'astar'): RoutingResult {
    const start = network.nodeIndex.get(fromNodeId), goal = network.nodeIndex.get(toNodeId);
    if (start === undefined || goal === undefined) throw new Error('Nieznany węzeł sieci drogowej.');
    const report = rules.diagnostics;
    if (start === goal) {
      const loc = graph.nodes[start];
      return { route: { id: routeId(graph, profile, [fromNodeId], []), graphVersion: graph.version,
        profileId: profile.id, fromNodeId, toNodeId, nodeIds: [fromNodeId], edgeIds: [], legs: [], geometry: [[loc[1], loc[2]]], meters: 0, seconds: 0 }, diagnostics: report };
    }
    const target: LonLat = [graph.nodes[goal][1], graph.nodes[goal][2]];
    const heuristic = (node: number) => strategy === 'dijkstra' ? 0 : greatCircleMeters([graph.nodes[node][1], graph.nodes[node][2]], target) * 0.999999;
    const queue = new Heap(), distance = new Map<number,number>(), predecessor = new Map<number, number>();
    for (const eIndex of network.outgoing[start]) {
      const e = network.edges[eIndex], s = graph.segments[e.segment];
      if (!allowedWays[s[3]]) continue;
      const cost = s[4];
      if (cost < (distance.get(eIndex) ?? Infinity)) { distance.set(eIndex, cost); predecessor.set(eIndex, -1); queue.push({ edge: eIndex, distance: cost, cost: cost + heuristic(e.to) }); }
    }
    let last = -1;
    while (queue.length) {
      const state = queue.pop()!, from = network.edges[state.edge];
      if (state.distance !== distance.get(state.edge)) continue;
      if (from.to === goal) { last = state.edge; break; }
      for (const nextIndex of network.outgoing[from.to]) {
        const next = network.edges[nextIndex], segment = graph.segments[next.segment];
        if (!allowedWays[segment[3]] || !canTurn(network, from, next, rules)) continue;
        const candidate = state.distance + segment[4];
        if (candidate >= (distance.get(nextIndex) ?? Infinity) - 1e-9) continue;
        distance.set(nextIndex, candidate); predecessor.set(nextIndex, state.edge);
        queue.push({ edge: nextIndex, distance: candidate, cost: candidate + heuristic(next.to) });
      }
    }
    if (last < 0) return { route: null, diagnostics: report };
    const path: number[] = [];
    for (let e = last; e !== -1; e = predecessor.get(e) ?? -1) path.push(e);
    path.reverse();
    const legs: RoadLeg[] = [];
    const geometry: LonLat[] = [];
    const nodeIds: number[] = [fromNodeId];
    let meters = 0, seconds = 0;
    for (const index of path) {
      const edge = network.edges[index], s = graph.segments[edge.segment];
      const coordinates = edge.reverse ? [...s[6]].reverse() : [...s[6]];
      if (geometry.length) geometry.push(...coordinates.slice(1)); else geometry.push(...coordinates);
      const leg: RoadLeg = {edgeId: edge.id, segmentId: s[0], fromNodeId: graph.nodes[edge.from][0],
        toNodeId: graph.nodes[edge.to][0], wayId: graph.ways[s[3]].id,
        meters: s[4], seconds: secondsPerEdge[index], geometry: coordinates};
      legs.push(leg); nodeIds.push(leg.toNodeId); meters += leg.meters; seconds += leg.seconds;
    }
    const edgeIds = legs.map(leg => leg.edgeId);
    return { route: {id: routeId(graph, profile, nodeIds, edgeIds), graphVersion: graph.version, profileId: profile.id,
      fromNodeId, toNodeId, nodeIds, edgeIds, legs, geometry, meters, seconds}, diagnostics: report };
  }
  function findBetweenCities(fromCityId: string, toCityId: string, strategy: RoutingStrategy = 'astar'): RoutingResult {
    const start = graph.snaps.find(s => s.cityId === fromCityId), end = graph.snaps.find(s => s.cityId === toCityId);
    if (!start || !end) throw new Error('Nieznane miasto na mapie demonstracyjnej.');
    const result = findBetweenNodes(start.nodeId, end.nodeId, strategy);
    return result.route ? { ...result, route: {...result.route, fromCityId, toCityId } } : result;
  }
  return { findBetweenNodes, findBetweenCities, diagnostics: rules.diagnostics };
}
/** For small tests only. Production callers should reuse the prepared network and router. */
export function routeOnGraph(graph: RoadGraph, fromNodeId: number, toNodeId: number, profile: VanProfile = DEFAULT_VAN): RoutingResult {
  return makeRoadRouter(createNetwork(graph), profile).findBetweenNodes(fromNodeId, toNodeId);
}

