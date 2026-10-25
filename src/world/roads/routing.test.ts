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

/** Valid via-way restrictions must match the entire directed manoeuvre,
 * not simply prohibit entering the connecting way. */
function viaFixture(): RoadGraph {
  const points = [
    [19,50], [19.001,50], [19.002,50], [19.003,50],
    [19.004,50], [19.002,50.001], [19.002,50.002], [19.001,50.001],
  ] as const;
  const edges = [
    [0,1,0], [1,2,1], [2,3,1], [3,4,2],
    [2,5,3], [7,1,4], [1,6,5], [6,4,5],
  ] as const;
  return {
    format: 1, version: 'via-fixture-v1',
    nodes: points.map((p,i)=>[i+1,...p]),
    ways: [10,20,30,40,50,60].map(id=>({id,tags:{highway:'residential'}})),
    segments: edges.map(([a,b,w],i)=>[
      `v${i}`,a,b,w,greatCircleMeters(points[a],points[b]),3,[points[a],points[b]],
    ]),
    restrictions: [], snaps: [],
  };
}
function viaRelation(id: number, mode: string, from: number, through: readonly number[], to: number): TurnRelation {
  return {id,tags:{type:'restriction',restriction:mode},members:[
    ['w',from,'from'],...through.map(way=>['w',way,'via'] as const),['w',to,'to'],
  ]};
}
const viaEdges = (graph: RoadGraph, start: number, end: number, strategy: 'astar'|'dijkstra'='astar') =>
  makeRoadRouter(createNetwork(graph)).findBetweenNodes(start,end,strategy).route?.edgeIds;

describe('05B full via-way turn sequences', () => {
  it('forbids a completed no_* manoeuvre but allows leaving the via-way earlier',()=>{
    const graph=viaFixture();
    graph.restrictions=[viaRelation(101,'no_right_turn',10,[20],30)];
    const router=makeRoadRouter(createNetwork(graph));
    expect(router.diagnostics.handledViaWayRestrictions).toEqual([101]);
    expect(router.diagnostics.conservativeViaWayRestrictions).toEqual([]);
    const full=router.findBetweenNodes(1,5).route!;
    expect(full).not.toBeNull();
    // The forbidden continuous sequence from 1 through 2,3,4 to 5 is absent.
    expect(full.edgeIds.join(',')).not.toContain('v0:f,v1:f,v2:f,v3:f');
    // Entering the via-way and exiting through an unrelated branch is legal.
    expect(router.findBetweenNodes(1,6).route?.edgeIds).toEqual(['v0:f','v1:f','v4:f']);
    // Approaching the same road from a different way remains legal.
    expect(router.findBetweenNodes(8,5).route?.edgeIds).toEqual(['v5:f','v1:f','v2:f','v3:f']);
  });
  it('enforces only_* along the whole connector, not for other approaches',()=>{
    const graph=viaFixture();
    graph.restrictions=[viaRelation(102,'only_right_turn',10,[20],30)];
    const router=makeRoadRouter(createNetwork(graph));
    expect(router.findBetweenNodes(1,5).route?.edgeIds).toEqual(['v0:f','v1:f','v2:f','v3:f']);
    expect(router.findBetweenNodes(8,6).route?.edgeIds).toEqual(['v5:f','v1:f','v4:f']);
  });
  it('handles more than one via way in the actual traversal order',()=>{
    const graph=viaFixture();
    graph.ways.push({id:25,tags:{highway:'residential'}});
    graph.segments=graph.segments.map((segment,index)=>index===2
      ? [segment[0],segment[1],segment[2],6,segment[4],segment[5],segment[6]]
      : segment);
    graph.restrictions=[viaRelation(103,'no_right_turn',10,[20,25],30)];
    const router=makeRoadRouter(createNetwork(graph));
    expect(router.diagnostics.handledViaWayRestrictions).toEqual([103]);
    expect(router.findBetweenNodes(1,5).route?.edgeIds.join(',')).not.toContain('v0:f,v1:f,v2:f,v3:f');
    expect(router.findBetweenNodes(1,6).route?.edgeIds).toEqual(['v0:f','v1:f','v4:f']);
  });
  it('A* and Dijkstra agree despite different via-way histories at the same edge',()=>{
    const graph=viaFixture();
    const no=viaRelation(104,'no_right_turn',10,[20],30);
    const only=viaRelation(105,'only_right_turn',10,[20],30);
    for(const active of [[no],[only],[no,only]]) {
      graph.restrictions=active;
      const router=makeRoadRouter(createNetwork(graph));
      for(const [from,to] of [[1,5],[1,6],[8,5],[8,6]]) {
        const a=router.findBetweenNodes(from,to).route;
        const d=router.findBetweenNodes(from,to,'dijkstra').route;
        expect(a?.meters).toEqual(d?.meters);
      }
    }
  });
});
