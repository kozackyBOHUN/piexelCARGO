import type { LonLat } from '../geography';
/** Source geometry and topology retain original OSM IDs. No simulation/save state. */
export type RoadNode = readonly [osmId: number, lon: number, lat: number];
export interface RoadWay { id: number; tags: Record<string, string> }
/** bits: 1 along source, 2 against source; geometry always follows source order. */
export type RoadSegment = readonly [id: string, from: number, to: number, way: number,
  meters: number, directions: number, geometry: readonly LonLat[]];
export interface TurnRelation { id: number; tags: Record<string,string>;
  members: readonly (readonly [type: string, id: number, role: string])[] }
export interface CitySnap { cityId: string; nodeId: number; gapMeters: number }
export interface RoadGraph { format: 1; version: string; nodes: RoadNode[]; ways: RoadWay[];
  segments: RoadSegment[]; restrictions: TurnRelation[]; snaps: CitySnap[] }
export interface DirectedEdge { id: string; from: number; to: number; segment: number; reverse: boolean }
export interface RoadNetwork { graph: RoadGraph; edges: DirectedEdge[]; outgoing: number[][]; nodeIndex: Map<number,number> }
export function createNetwork(graph: RoadGraph): RoadNetwork {
  const outgoing: number[][] = Array.from({length:graph.nodes.length},()=>[]);
  const edges: DirectedEdge[]=[];
  graph.segments.forEach((s,segment)=>{
    for (const reverse of [false,true]) if (s[5] & (reverse?2:1)) {
      const from=s[reverse?2:1], to=s[reverse?1:2];
      outgoing[from].push(edges.length);
      edges.push({id:`${s[0]}:${reverse?'r':'f'}`,from,to,segment,reverse});
    }
  });
  return {graph,edges,outgoing,nodeIndex:new Map(graph.nodes.map((n,i)=>[n[0],i]))};
}
/** Connectivity only, before turn restrictions. Routing service must apply turn state. */
export function hasDirectedConnection(network: RoadNetwork, from: number, to: number): boolean {
  const queue=[from],seen=new Set(queue);
  for(let i=0;i<queue.length;i++) {
    const node=queue[i]; if(node===to) return true;
    for(const edge of network.outgoing[node]??[]) {
      const next=network.edges[edge].to;
      if(!seen.has(next)){seen.add(next);queue.push(next)}
    }
  }
  return false;
}
