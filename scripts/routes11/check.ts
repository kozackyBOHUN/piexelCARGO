import {partialRules} from './partial';
import {combineAudit} from './partialAudit';
import {makeFullGraphDijkstra} from './fullGraph';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createNetwork,type RoadGraph} from '../../src/world/roads/model';
import {makeRoadRouter,DEFAULT_VAN,speedKph,restrictions,type PlannedRoadRoute} from '../routes08/routing';
import {makeRouteAuditor} from './audit';
import {accessErrors,conditionalDecision} from './access';
const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
const raw=readFileSync('public/roads/demo/graph.json.gz'),sha=hash(raw);
if(sha!=='e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f')throw Error('Source graph SHA mismatch');
const graph=JSON.parse(gunzipSync(raw).toString()) as RoadGraph;
const source=JSON.parse(readFileSync('/tmp/11-source-safety.json','utf8'));
if(source.sourceSha256!=='a0575a3f5bd99f190923818d79bbce882935809bf229792385392a9fa4262cbc')throw Error('Source PBF mismatch');
for(const w of graph.ways){const full=source.ways[String(w.id)];if(!full)throw Error(`Source way missing ${w.id}`);w.tags={...w.tags,...full}}
graph.snaps=graph.snaps.map(s=>s.cityId==='geonames:3089658'?{...s,nodeId:599998162}:s);
console.log('PBF metadata merged');
const network=createNetwork(graph),rules=restrictions(graph,DEFAULT_VAN),baseAudit=makeRouteAuditor(network,rules.diagnostics);
const audit=(r:PlannedRoadRoute)=>combineAudit(graph,r,baseAudit(r));
const unknown=new Set(rules.diagnostics.unsupportedRestrictions),unknownNodes=new Set<number>();
for(const r of graph.restrictions)if(unknown.has(r.id))for(const m of r.members)if((m[0]==='n'||m[0]==='node')&&m[2]==='via')unknownNodes.add(m[1]);
const blockedPoints=new Map<string,any>(),nodeChecks:any[]=[];
for(const n of source.nodes){const t=n.tags,e=accessErrors(t,false);const access=t.goods??t.motorcar??t.motor_vehicle??t.vehicle??t.access;
 if(t.barrier&&!['cattle_grid','entrance','toll_booth','border_control'].includes(t.barrier)&&!['yes','permissive','designated'].includes(access??''))e.push('Barrier without ordinary van permission');
 if(e.length)blockedPoints.set(n.coordinates.join(','),{id:n.id,errors:e});nodeChecks.push({id:n.id,coordinates:n.coordinates,tags:t,errors:e});
}
const blockedSegments=new Set<number>(),blockedWays=new Set<number>();const conditionalReport:any[]=[];
for(let i=0;i<graph.ways.length;i++){const w=graph.ways[i];if(accessErrors(w.tags,false).length&&accessErrors(w.tags,true).length)blockedWays.add(w.id);for(const [k,v]of Object.entries(w.tags))if(k.includes(':conditional'))conditionalReport.push({wayId:w.id,key:k,value:v,decision:conditionalDecision(k)})}
for(let i=0;i<graph.segments.length;i++)if(graph.segments[i][6].some(p=>blockedPoints.has(p.join(','))))blockedSegments.add(i);
const allowed=Uint8Array.from(network.edges,e=>!blockedSegments.has(e.segment)&&!accessErrors(graph.ways[graph.segments[e.segment][3]].tags,e.reverse).length?1:0);
// Optimistic lower bound uses all source edges with known access rules. Reference closes unresolved via nodes explicitly.
const baseNetwork={...network,outgoing:network.outgoing.map(es=>es.filter(i=>allowed[i]))};
const referenceNetwork=baseNetwork;
const router=makeRoadRouter(referenceNetwork),lowerRouter=makeRoadRouter(baseNetwork);
function accessAudit(r:PlannedRoadRoute){const e:string[]=[];for(const leg of r.legs){const edge=network.outgoing[network.nodeIndex.get(leg.fromNodeId)!].map(i=>network.edges[i]).find(x=>x.id===leg.edgeId)!;for(const x of accessErrors(graph.ways[graph.segments[edge.segment][3]].tags,edge.reverse))e.push(`Way ${leg.wayId}: ${x}`);if(blockedSegments.has(edge.segment))e.push(`Barrier segment ${leg.segmentId}`)}return e}
const same=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function reconstruct(r:any):PlannedRoadRoute{const snap=graph.snaps.find(s=>s.cityId===r.fromCityId)!;let node=network.nodeIndex.get(snap.nodeId)!,at=0;const legs:any[]=[];if(!same(r.geometry[0],graph.nodes[node].slice(1)))throw Error('Start snap mismatch');
 while(at<r.geometry.length-1){const candidates=network.outgoing[node].map(i=>network.edges[i]).filter(e=>{const s=graph.segments[e.segment],g=e.reverse?[...s[6]].reverse():s[6];return g.length>1&&g.every((p,j)=>same(p,r.geometry[at+j]??[]))});if(candidates.length!==1)throw Error(`Ambiguous source geometry at ${at}`);const e=candidates[0],s=graph.segments[e.segment],w=graph.ways[s[3]];legs.push({edgeId:e.id,segmentId:s[0],fromNodeId:graph.nodes[e.from][0],toNodeId:graph.nodes[e.to][0],wayId:w.id,meters:s[4],seconds:s[4]*3.6/speedKph(w.tags,e.reverse,DEFAULT_VAN),geometry:e.reverse?[...s[6]].reverse():s[6]});at+=s[6].length-1;node=e.to;}
 return {...r,graphVersion:graph.version,profileId:DEFAULT_VAN.id,fromNodeId:snap.nodeId,toNodeId:graph.nodes[node][0],legs,nodeIds:[snap.nodeId,...legs.map(l=>l.toNodeId)],edgeIds:legs.map(l=>l.edgeId)};
}
console.log('Access and barrier masks ready');
const routes=new Map<string,PlannedRoadRoute>(),rejected:any[]=[],certificates:any[]=[];
function admit(r:PlannedRoadRoute,source:string){const check=audit(r),errors=[...check.errors,...accessAudit(r)];if(errors.length){rejected.push({id:r.id,from:r.fromCityId,to:r.toCityId,source,errors:[...new Set(errors)]});return false}const key=`${r.fromCityId}|${r.toCityId}`,old=routes.get(key);if(!old||r.meters<old.meters)routes.set(key,r);return true}
const candidates=[...JSON.parse(readFileSync('tmp/route-recovery11/selected-routes.json','utf8')),...JSON.parse(readFileSync('/tmp/pixelcargo11-input/data/all_324_unverified_osm_candidates.json','utf8'))];
let tested=0;for(const c of candidates)try{if(++tested%50===0)console.log('Candidate audit',tested);admit(reconstruct(c),'provided geometry')}catch(e){rejected.push({id:c.id,from:c.fromCityId,to:c.toCityId,source:'provided geometry',errors:[String(e)]})}
console.log('Supplied audited pairs',routes.size,'blocked via nodes',unknownNodes.size,'barrier segments',blockedSegments.size);
const cities=JSON.parse(readFileSync('src/world/data/cities-demo.json','utf8'));let done=0;const allFrom=makeFullGraphDijkstra(referenceNetwork,partialRules(referenceNetwork)),optimisticFrom=makeFullGraphDijkstra(baseNetwork);const priority=new Set(JSON.parse(readFileSync('/tmp/pixelcargo11-input/qa/priority_route_baselines.json','utf8')).map((r:any)=>r.fromCityId+'|'+r.toCityId));
for(const from of cities){const tree=allFrom(from.id),boundTree=optimisticFrom(from.id);console.log('Dijkstra origin ready',from.name,tree.size);for(const to of cities)if(from.id!==to.id){
 const key=`${from.id}|${to.id}`,start=performance.now();
 const astar=priority.has(key)?router.findBetweenCities(from.id,to.id,'astar').route:null;const dijkstra=tree.get(to.id)??null;
 let referencePassed=false,referenceErrors:string[]=[];
 if(dijkstra){referenceErrors=[...audit(dijkstra).errors,...accessAudit(dijkstra)];referencePassed=referenceErrors.length===0;if(referencePassed)admit(dijkstra,'full-graph Dijkstra')}
 if(astar)admit(astar,'full-graph A*');
 const chosen=routes.get(key);let lower:number|null=null;
 // Independent optimistic bound makes explicit any price of conservative unresolved-node closures.
 const bound=boundTree.get(to.id);if(bound)lower=bound.meters;
 const c={fromCityId:from.id,toCityId:to.id,referencePassed,referenceErrors,referenceMeters:dijkstra?.meters??null,astarMeters:astar?.meters??null,optimisticLowerBoundMeters:lower,selectedMeters:chosen?.meters??null,stretch:chosen&&dijkstra?chosen.meters/dijkstra.meters:null,conservativeStretch:chosen&&lower?chosen.meters/lower:null,ms:Math.round(performance.now()-start)};
 certificates.push(c);console.log(++done,key,chosen?.meters.toFixed(2),'reference',referencePassed,c.ms,'ms');
 writeFileSync('/tmp/11-progress.json',JSON.stringify({completed:done,certificates,rejected}));
}
mkdirSync('tmp/route-recovery11',{recursive:true});
}
const full=[...routes.values()];writeFileSync('/tmp/11-full-routes.json',JSON.stringify(full));writeFileSync('/tmp/11-search-certificates.json',JSON.stringify({certificates,rejected,conditionalReport,nodeChecks,unknownNodes:[...unknownNodes],blockedSegments:blockedSegments.size,graphSha256:sha}));
console.log('FINISHED',full.length,'maxRSS MiB',Math.round(process.resourceUsage().maxRSS/1024));
