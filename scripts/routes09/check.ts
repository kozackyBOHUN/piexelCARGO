import {readFileSync,writeFileSync} from 'node:fs';
import {audit,reconstruct,graph,network} from './auditInput';
import {restrictions,canTurn,advanceViaRules,DEFAULT_VAN} from '../routes08/routing';
import type {PlannedRoadRoute} from '../routes08/routing';
const input=JSON.parse(readFileSync('/tmp/pixelcargo09-input/adjacency_routes_ready_candidates.json','utf8'));
const accepted:any[]=[],rejected:any[]=[],plans=new Map<string,PlannedRoadRoute>();
for(const r of input)try{const p=reconstruct(r),check=audit(p);if(check.errors.length)throw Error(check.errors.join('; '));accepted.push(r);plans.set(r.id,p)}catch(e){rejected.push({id:r.id,fromCityId:r.fromCityId,toCityId:r.toCityId,reason:String(e)})}
const rules=restrictions(graph,DEFAULT_VAN),edgeIndex=new Map(network.edges.map((e,i)=>[e.id,i]));
// State includes incoming source edge AND active via-way tokens. No city-only turn reset.
type State={cityId:string;prior:number;tokens:number[]};const states:State[]=[],keys=new Map<string,number>(),transitions:{linkId:string;to:number}[][]=[];
function state(s:State){const k=`${s.cityId}|${s.prior}|${s.tokens.join(',')}`;if(keys.has(k))return keys.get(k)!;const id=states.length;keys.set(k,id);states.push(s);transitions.push([]);return id}
const cities=[...new Set(accepted.flatMap(r=>[r.fromCityId,r.toCityId]))],starts:Record<string,number>={};for(const cityId of cities)starts[cityId]=state({cityId,prior:-1,tokens:[]});
for(let i=0;i<states.length;i++){
 if(states.length>5000)throw Error('Unexpected county state explosion');
 const s=states[i];for(const link of accepted.filter(r=>r.fromCityId===s.cityId)){
  let prior=s.prior,tokens=s.tokens,ok=true;
  for(const id of plans.get(link.id)!.edgeIds){const next=edgeIndex.get(id)!;if(prior>=0){if(network.edges[prior].to!==network.edges[next].from||!canTurn(network,network.edges[prior],network.edges[next],rules)){ok=false;break}const progress=advanceViaRules(network,network.edges[prior],network.edges[next],tokens,rules);if(!progress){ok=false;break}tokens=progress}prior=next}
  if(ok)transitions[i].push({linkId:link.id,to:state({cityId:link.toCityId,prior,tokens:[...tokens]})});
 }
}
const linkMap=new Map(accepted.map(r=>[r.id,r]));
function path(from:string,to:string){const distance=new Map([[starts[from],0]]),prev=new Map<number,{s:number;link:string}>(),seen=new Set<number>();let goal=-1;
 while(true){let best=-1,cost=Infinity;for(const [s,d] of distance)if(!seen.has(s)&&d<cost){best=s;cost=d}if(best<0)break;if(states[best].cityId===to){goal=best;break}seen.add(best);for(const t of transitions[best]){const next=cost+linkMap.get(t.linkId)!.meters;if(next<(distance.get(t.to)??Infinity)){distance.set(t.to,next);prev.set(t.to,{s:best,link:t.linkId})}}}
 if(goal<0)return null;const ids:string[]=[];while(goal!==starts[from]){const p=prev.get(goal)!;ids.unshift(p.link);goal=p.s}return ids;
}
const routes:any[]=[],failed:any[]=[];
for(const a of cities)for(const b of cities)if(a!==b){const ids=path(a,b);if(!ids){failed.push({a,b,reason:'No legal stateful county chain'});continue}
 const legs=ids.flatMap(id=>plans.get(id)!.legs),geometry=ids.flatMap((id,i)=>i?plans.get(id)!.geometry.slice(1):plans.get(id)!.geometry),nodeIds=[legs[0].fromNodeId,...legs.map(l=>l.toNodeId)];
 const route={id:`county:${ids.join('+')}`,graphVersion:graph.version,profileId:DEFAULT_VAN.id,fromCityId:a,toCityId:b,fromNodeId:nodeIds[0],toNodeId:nodeIds.at(-1)!,legs,nodeIds,edgeIds:legs.map(l=>l.edgeId),geometry,meters:legs.reduce((n,l)=>n+l.meters,0),seconds:legs.reduce((n,l)=>n+l.seconds,0)};
 const check=audit(route);if(check.errors.length){failed.push({a,b,reason:check.errors.join('; ')});continue}routes.push({fromCityId:a,toCityId:b,segmentIds:ids,meters:route.meters,seconds:route.seconds,viaCityIds:[a,...ids.map(id=>linkMap.get(id)!.toCityId)]});
}
const manifest={format:1,graphVersion:graph.version,graphSha256:'e67a4d18e39c2894edcab59e7ef776a01ce0d6251a00618ff7b262d330e42c9f',states:states.map(s=>({cityId:s.cityId})),starts,transitions,approvedPairs:routes.map(r=>`${r.fromCityId}|${r.toCityId}`),snapOverride:{cityId:'geonames:3089658',nodeId:599998162},license:'ODbL-1.0'};
writeFileSync('public/roads/county/links.json',JSON.stringify(accepted));writeFileSync('public/roads/county/network.json',JSON.stringify(manifest));writeFileSync('docs/reports/09-routes.json',JSON.stringify({accepted:accepted.length,rejected,cities,routeCount:routes.length,routes,failed,stateCount:states.length,joinValidation:'OSM via-node and via-way state carried through every source edge; full 08 audit on every resulting chain',gorlice:'disabled',oswiecim:manifest.snapOverride},null,2));console.log(JSON.stringify({links:accepted.length,rejected:rejected.length,states:states.length,pairs:routes.length,failed:failed.length}));
