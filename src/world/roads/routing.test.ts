import { describe, expect, it } from 'vitest';
import { createNetwork, type RoadGraph, type TurnRelation } from './model';
import { DEFAULT_VAN, greatCircleMeters, makeRoadRouter, routeOnGraph } from './routing';
import { positionAtMeters, positionAtSeconds } from './position';

const nodes = [[101,19,50],[102,19.001,50],[103,19.002,50],[104,19.003,50],[105,19.001,50.001]] as const;
const coords = (index: number) => [nodes[index][1], nodes[index][2]] as const;
const len = (a: number, b: number) => greatCircleMeters(coords(a),coords(b));
function fixture(): RoadGraph {
  return {
    format: 1, version: 'fixture-v1',
    nodes: nodes.map(n => [...n]),
    ways: [{id:11,tags:{highway:'primary',maxspeed:'60'}},{id:12,tags:{highway:'residential'}},{id:13,tags:{highway:'residential'}},{id:14,tags:{highway:'service'}}],
    segments: [
      ['s1',0,1,0,len(0,1),3,[coords(0),coords(1)]],
      ['s2',1,2,1,len(1,2),3,[coords(1),coords(2)]],
      ['s3',2,3,1,len(2,3),3,[coords(2),coords(3)]],
      ['s4',1,4,2,len(1,4),3,[coords(1),coords(4)]],
      ['s5',4,3,2,len(4,3),3,[coords(4),coords(3)]],
      ['s6',0,4,3,len(0,4),1,[coords(0),coords(4)]],
    ], restrictions: [], snaps: [{cityId:'A',nodeId:101,gapMeters:0},{cityId:'D',nodeId:104,gapMeters:0}],
  };
}
function relation(id: number, restriction: string, from: number, via: number, to: number, viaType: 'n'|'w' = 'n'): TurnRelation {
  return {id,tags:{type:'restriction',restriction},members:[['w',from,'from'],[viaType,via,'via'],['w',to,'to']]};
}
const router = (graph: RoadGraph) => makeRoadRouter(createNetwork(graph));

describe('05B road routing on controlled physical topology', () => {
  it('matches reference Dijkstra and uses full road geometry and shortest distance', () => {
    const r = router(fixture()); const a = r.findBetweenCities('A','D').route, b = r.findBetweenCities('A','D','dijkstra').route;
    expect(a).not.toBeNull(); expect(b).not.toBeNull();
    expect(a!.meters).toBeCloseTo(b!.meters, 7);
    expect(a!.nodeIds.at(0)).toBe(101); expect(a!.nodeIds.at(-1)).toBe(104);
    expect(a!.geometry[0]).toEqual(coords(0)); expect(a!.geometry.at(-1)).toEqual(coords(3));
    expect(a!.edgeIds).toHaveLength(a!.legs.length);
    expect(a!.seconds).toBeGreaterThan(0);
  });
  it('does not drive wrong way on one-way road', () => {
    const graph = fixture(); graph.segments = [graph.segments[5]];
    expect(router(graph).findBetweenNodes(105,101).route).toBeNull();
    expect(router(graph).findBetweenNodes(101,105).route?.edgeIds).toEqual(['s6:f']);
  });
  it('applies no turn at the correct OSM via-node', () => {
    const graph = fixture(); graph.restrictions=[relation(1,'no_right_turn',11,102,12)];
    const route = router(graph).findBetweenNodes(101,103).route!;
    expect(route.edgeIds.some((id,i)=>id==='s1:f'&&route.edgeIds[i+1]==='s2:f')).toBe(false);
  });
  it('enforces an only-turn choice without eliminating legal detours', () => {
    const graph = fixture(); graph.restrictions=[relation(2,'only_right_turn',11,102,13)];
    const route = router(graph).findBetweenNodes(101,103).route!;
    expect(route.edgeIds.some((id,i)=>id==='s1:f'&&route.edgeIds[i+1]==='s2:f')).toBe(false);
    expect(route).not.toBeNull();
  });
  it('no_u_turn is not interpreted as forbidding straight movement on the same way', () => {
    const graph=fixture(); graph.restrictions=[relation(3,'no_u_turn',12,103,12)];
    expect(router(graph).findBetweenNodes(102,104).route!.edgeIds).toContain('s3:f');
  });
  it('never silently treats via-way restrictions as allowed', () => {
    const graph=fixture(); graph.restrictions=[relation(4,'no_left_turn',11,12,14,'w')];
    const r=router(graph); expect(r.diagnostics.conservativeViaWayRestrictions).toEqual([4]);
    const route=r.findBetweenNodes(101,103).route!;
    expect(route.edgeIds.some((id,i)=>id==='s1:f'&&route.edgeIds[i+1]==='s2:f')).toBe(false);
  });
  it('respects van weight and highway speed limit and declines unknown restrictions', () => {
    const graph=fixture(); graph.ways[0].tags.maxweight='3 t';
    expect(router(graph).findBetweenNodes(101,103).route!.edgeIds).not.toContain('s1:f');
    graph.ways[0].tags.maxweight='invalid';
    expect(router(graph).findBetweenNodes(101,103).route!.edgeIds).not.toContain('s1:f');
    delete graph.ways[0].tags.maxweight;
    const pure=routeOnGraph(graph,101,102).route!;
    expect(pure.seconds).toBeGreaterThanOrEqual(pure.meters*3.6/DEFAULT_VAN.maxSpeedKph);
  });
  it('returns deterministic IDs and supports precise animation samples', () => {
    const graph=fixture(), route=router(graph).findBetweenNodes(101,104).route!;
    expect(router(graph).findBetweenNodes(101,104).route?.id).toBe(route.id);
    expect(positionAtMeters(route,0).coordinates).toEqual(route.geometry[0]);
    expect(positionAtMeters(route,route.meters).coordinates).toEqual(route.geometry.at(-1));
    expect(positionAtMeters(route,-100).traveledMeters).toBe(0);
    expect(() => positionAtMeters(route,Infinity)).toThrow();
    const mid=positionAtSeconds(route,route.seconds/2);
    expect(mid.traveledMeters).toBeGreaterThan(0);
    expect(mid.traveledMeters).toBeLessThan(route.meters);
    expect(mid.bearingDegrees).toBeGreaterThanOrEqual(0);
    expect(mid.bearingDegrees).toBeLessThan(360);
  });
  it('handles unknown nodes, same node, disconnected components and zero-length route', () => {
    const graph=fixture();
    expect(()=>router(graph).findBetweenNodes(1234567,101)).toThrow();
    const same=router(graph).findBetweenNodes(101,101).route!;
    expect(same.meters).toBe(0); expect(same.legs).toHaveLength(0);
    expect(positionAtMeters(same,0).coordinates).toEqual(coords(0));
    graph.segments=[graph.segments[0]];
    expect(router(graph).findBetweenNodes(101,104).route).toBeNull();
  });
});

