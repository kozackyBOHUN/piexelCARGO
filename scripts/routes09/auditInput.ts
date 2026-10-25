import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {makeRoadRouter,DEFAULT_VAN,edgeAllowed,speedKph,greatCircleMeters,type PlannedRoadRoute,type RoadLeg} from '../routes08/routing';
import {makeRouteAuditor} from '../routes08/audit';
const bytes=readFileSync('public/roads/demo/graph.json.gz');
if(createHash('sha256').update(bytes).digest('hex')!=='e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f')throw Error('Wrong OSM snapshot');
export const graph=JSON.parse(gunzipSync(bytes).toString()) as RoadGraph;
const proposed=599998162,old=graph.nodes.find(n=>n[0]===1744170406)!,node=graph.nodes.find(n=>n[0]===proposed)!;
if(!node||greatCircleMeters([old[1],old[2]],[node[1],node[2]])>40)throw Error('Invalid Oświęcim override');
// Only the in-memory audit snap changes; original source graph remains byte-identical.
graph.snaps=graph.snaps.map(s=>s.cityId==='geonames:3089658'?{...s,nodeId:proposed}:s);
export const network=createNetwork(graph),router=makeRoadRouter(network),audit=makeRouteAuditor(network,router.diagnostics);
const same=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((n,i)=>n===b[i]);
export function reconstruct(r:any):PlannedRoadRoute{
 const snap=graph.snaps.find(s=>s.cityId===r.fromCityId)!;let from=network.nodeIndex.get(snap.nodeId)!,point=0;const legs:RoadLeg[]=[],nodeIds=[snap.nodeId],edgeIds:string[]=[];
 if(!same(r.geometry[0],graph.nodes[from].slice(1)))throw Error('Wrong start snap');
 while(point<r.geometry.length-1){
  const matches=network.outgoing[from].map(i=>network.edges[i]).filter(e=>{
   const seg=graph.segments[e.segment],g=e.reverse?[...seg[6]].reverse():seg[6];return g.length>1&&g.every((p,j)=>same(p,r.geometry[point+j]??[]));
  });if(matches.length!==1)throw Error(`Ambiguous or absent directed source edge at ${point}`);
  const e=matches[0],seg=graph.segments[e.segment],way=graph.ways[seg[3]],geometry=e.reverse?[...seg[6]].reverse():seg[6];
  const access=way.tags.motorcar??way.tags.motor_vehicle??way.tags.vehicle??way.tags.access;
  if(Object.keys(way.tags).some(k=>k.endsWith(':conditional')))throw Error('Conditional road tags require review');
  if(!edgeAllowed(way.tags,DEFAULT_VAN)||['no','private','agricultural','forestry','delivery','destination'].includes(access??''))throw Error('Access/dimension limit');
  legs.push({edgeId:e.id,segmentId:seg[0],fromNodeId:graph.nodes[e.from][0],toNodeId:graph.nodes[e.to][0],wayId:way.id,meters:seg[4],seconds:seg[4]*3.6/speedKph(way.tags,e.reverse,DEFAULT_VAN),geometry});nodeIds.push(graph.nodes[e.to][0]);edgeIds.push(e.id);point+=geometry.length-1;from=e.to;
 }return {...r,legs,nodeIds,edgeIds,fromNodeId:snap.nodeId,toNodeId:graph.nodes[from][0],graphVersion:graph.version,profileId:DEFAULT_VAN.id};
}
