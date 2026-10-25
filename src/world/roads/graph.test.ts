import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createNetwork,hasDirectedConnection,type RoadGraph } from './model';
import cities from '../data/cities-demo.json';
const graph=JSON.parse(gunzipSync(readFileSync('public/roads/demo/graph.json.gz')).toString()) as RoadGraph;
const network=createNetwork(graph);
const names=new Map(cities.map(c=>[c.name,c.id]));
function snap(name:string) { return network.nodeIndex.get(graph.snaps.find(s=>s.cityId===names.get(name))!.nodeId)! }
describe('real OSM Małopolska topology',()=>{
 it('has original IDs, 19 real city snaps and nonempty source topology',()=>{
  expect(graph.nodes.length).toBeGreaterThan(1000);
  expect(graph.snaps).toHaveLength(19);
  expect(new Set(graph.nodes.map(n=>n[0])).size).toBe(graph.nodes.length);
  expect(graph.snaps.every(s=>network.nodeIndex.has(s.nodeId)&&s.gapMeters>=0)).toBe(true);
 });
 for(const [from,to] of [['Kraków','Tarnów'],['Kraków','Zakopane'],['Kraków','Nowy Sącz'],['Kraków','Oświęcim'],['Tarnów','Nowy Sącz'],['Nowy Targ','Zakopane']])
  it(`has directed connection ${from} → ${to}`,()=>expect(hasDirectedConnection(network,snap(from),snap(to))).toBe(true));
 it('retains actual endpoints and directed edges never contradict source directions',()=>{
  const endpointsCorrect=graph.segments.every(s=>{
   const a=graph.nodes[s[1]],b=graph.nodes[s[2]],first=s[6][0],last=s[6].at(-1)!;
   return first[0]===a[1]&&first[1]===a[2]&&last[0]===b[1]&&last[1]===b[2]&&s[4]>0;
  });
  expect(endpointsCorrect).toBe(true);
  expect(network.edges.every(e=>(graph.segments[e.segment][5] & (e.reverse?2:1))!==0)).toBe(true);
 });
});
