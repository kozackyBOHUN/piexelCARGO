import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {makeRoadRouter,DEFAULT_VAN,edgeAllowed,speedKph,type PlannedRoadRoute,type RoadLeg} from './routing';
import {makeRouteAuditor} from './audit';
const zipManifest=JSON.parse(readFileSync('/tmp/stage08-route-manifest.json','utf8'));
const bytes=readFileSync('public/roads/demo/graph.json.gz'),sha=createHash('sha256').update(bytes).digest('hex');
if(sha!==zipManifest.graphSha256)throw Error('Candidate source graph checksum mismatch');
const graph=JSON.parse(gunzipSync(bytes).toString()) as RoadGraph;console.log('graph parsed');
const network=createNetwork(graph),router=makeRoadRouter(network),audit=makeRouteAuditor(network,router.diagnostics);console.log('network ready');
const existing=JSON.parse(readFileSync('public/roads/preview/routes.json','utf8'));
const candidates=JSON.parse(readFileSync('/tmp/stage08-candidates.json','utf8'));
const accepted=new Map<string,any>(),reports:any[]=[],rejected:any[]=[];
const same=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((n,i)=>n===b[i]);
function reconstruct(r:any):PlannedRoadRoute{
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
function admit(r:any,source:string){try{const route=reconstruct(r),check=audit(route);if(check.errors.length)throw Error(check.errors.join('; '));accepted.set(`${r.fromCityId}|${r.toCityId}`,r);reports.push({id:r.id,fromCityId:r.fromCityId,toCityId:r.toCityId,source,meters:r.meters,seconds:r.seconds,edgeCount:route.legs.length,...check});return true}catch(e){rejected.push({id:r.id,fromCityId:r.fromCityId,toCityId:r.toCityId,reason:String(e)});return false}}
for(const r of [...existing,...candidates])admit(r,'independent geometry-to-directed-edges reconstruction and relation audit');
console.log('candidate audit',accepted.size,'accepted',rejected.length,'rejected');
// Malformed relations are NOT ignored: close every named way before finding an alternative.
const unknown=new Set([...router.diagnostics.unsupportedRestrictions,...router.diagnostics.conservativeViaWayRestrictions]);const blocked=new Set<number>();
for(const r of graph.restrictions)if(unknown.has(r.id))for(const m of r.members)if(m[0]==='w'||m[0]==='way')blocked.add(m[1]);
for(const w of graph.ways)if(Object.keys(w.tags).some(k=>k.endsWith(':conditional')))blocked.add(w.id);
const safeRouter=makeRoadRouter(network,DEFAULT_VAN,blocked);
const K='geonames:3094802',priority=[K,'geonames:757026','geonames:3080866','geonames:775758'];
for(const city of priority.slice(1))for(const [a,b] of [[K,city],[city,K]])if(!accepted.has(`${a}|${b}`)){
 const r=safeRouter.findBetweenCities(a,b).route;console.log('safe alternative',a,b,r?.meters);
 if(r)admit({id:r.id,fromCityId:a,toCityId:b,meters:r.meters,seconds:r.seconds,geometry:r.geometry},'conservative closure of all ways named by unsupported/conservative relations, then independent audit');
}
// Only launch cities in Kraków's bidirectionally reachable component; no one-way traps.
function reachable(reverse=false){const set=new Set([K]);let changed=true;while(changed){changed=false;for(const r of accepted.values()){const a=reverse?r.toCityId:r.fromCityId,b=reverse?r.fromCityId:r.toCityId;if(set.has(a)&&!set.has(b)){set.add(b);changed=true}}}return set}
const f=reachable(),b=reachable(true),cities=[...f].filter(c=>b.has(c));const routes=[...accepted.values()].filter(r=>cities.includes(r.fromCityId)&&cities.includes(r.toCityId));
if(!routes.some(r=>r.fromCityId==='geonames:3080866'&&r.toCityId===K))console.log('WARNING: Zakopane return remains unavailable');
mkdirSync('docs/reports',{recursive:true});writeFileSync('docs/reports/08-routes.json',JSON.stringify({routesSha256:createHash('sha256').update(JSON.stringify(routes)+'\n').digest('hex'),candidateSha256:createHash('sha256').update(readFileSync('/tmp/stage08-candidates.json')).digest('hex'),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',graphSha256:sha,graphVersion:graph.version,profile:DEFAULT_VAN,diagnostics:router.diagnostics,cities,routeCount:routes.length,verified:routes.map(r=>reports.filter(v=>v.id===r.id).at(-1)),rejected,blockedWayCount:blocked.size,limitations:['Verification against local OSM snapshot only; not real-time legal certification.','Missing and unsupported relations never inferred; exposed paths rejected.','Oświęcim inbound gaps in supplied data may remain unavailable.']},null,2));
writeFileSync('public/roads/preview/routes.json',JSON.stringify(routes)+'\n');console.log(JSON.stringify({cities:cities.length,routes:routes.length,bytes:JSON.stringify(routes).length}));
