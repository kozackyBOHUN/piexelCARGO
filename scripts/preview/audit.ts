/** Offline validation against source OSM relations; never used by the game loop. */
import type { RoadGraph, RoadNetwork, TurnRelation } from '../../src/world/roads/model';
import type { PlannedRoadRoute, RoutingDiagnostics } from '../../src/world/roads/routing';
import { greatCircleMeters } from '../../src/world/roads/routing';
const member=(r:TurnRelation,role:string,type:string)=>r.members.find(m=>m[2]===role&&(m[0]===type||m[0]===(type==='w'?'way':'node')))?.[1];
const mode=(r:TurnRelation)=>r.tags['restriction:motorcar']??r.tags.restriction??'';
const exempt=(r:TurnRelation)=>(r.tags.except??'').split(/[;,]/).some(s=>['motorcar','motor_vehicle','vehicle'].includes(s.trim().toLowerCase()));
const equal=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function makeRouteAuditor(network:RoadNetwork,diagnostics:RoutingDiagnostics) {
 const graph:RoadGraph=network.graph,unsupported=new Set(diagnostics.unsupportedRestrictions);
 const handled=new Set(diagnostics.handledViaWayRestrictions),conservative=new Set(diagnostics.conservativeViaWayRestrictions);
 const nodeRules=new Map<string,TurnRelation[]>();
 const viaRules=graph.restrictions.filter(r=>handled.has(r.id)).map(r=>({id:r.id,mode:mode(r),chain:[member(r,'from','w')!,...r.members.filter(m=>m[2]==='via'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]),member(r,'to','w')!],junctions:[] as Set<number>[]}));
 const endpoints=new Map<number,Set<number>>();for(const r of viaRules)for(const w of r.chain)endpoints.set(w,new Set());
 for(const s of graph.segments){const set=endpoints.get(graph.ways[s[3]].id);if(set){set.add(graph.nodes[s[1]][0]);set.add(graph.nodes[s[2]][0]);}}
 for(const r of viaRules)for(let i=1;i<r.chain.length;i++)r.junctions.push(new Set([...endpoints.get(r.chain[i-1])!].filter(n=>endpoints.get(r.chain[i])!.has(n))));
 for(const r of graph.restrictions){if(exempt(r)||unsupported.has(r.id)||handled.has(r.id)||conservative.has(r.id))continue;
  const via=member(r,'via','n'),from=member(r,'from','w');if(via===undefined||from===undefined||!mode(r))continue;
  const key=`${via}:${from}`,list=nodeRules.get(key)??[];list.push(r);nodeRules.set(key,list);
 }
 return (route:PlannedRoadRoute)=>{
  const errors:string[]=[],legs=route.legs,viaEntries=new Set<number>(),nodeEncounters=new Set<number>();
  let sumMeters=0,sumSeconds=0,pointIndex=0,geometricMeters=0;
  if(route.graphVersion!==graph.version)errors.push('Graph version mismatch');
  if(!(route.meters>0&&route.seconds>0))errors.push('Non-positive route length/time');
  if(route.nodeIds.length!==legs.length+1||route.edgeIds.length!==legs.length)errors.push('Incorrect node/edge count');
  for(let i=0;i<legs.length;i++){
   const leg=legs[i],from=network.nodeIndex.get(leg.fromNodeId);
   const edge=from===undefined?undefined:network.outgoing[from].map(id=>network.edges[id]).find(e=>e.id===leg.edgeId);
   if(!edge){errors.push(`No actual outgoing edge at leg ${i}`);continue}
   const s=graph.segments[edge.segment],line=edge.reverse?[...s[6]].reverse():s[6];
   if(s[0]!==leg.segmentId||graph.ways[s[3]].id!==leg.wayId||graph.nodes[edge.to][0]!==leg.toNodeId||!(s[5]&(edge.reverse?2:1)))errors.push(`Wrong source topology/direction at ${i}`);
   if(leg.geometry.length!==line.length||!leg.geometry.every((p,j)=>equal(p,line[j])))errors.push(`Wrong source geometry at ${i}`);
   if(i&&(legs[i-1].toNodeId!==leg.fromNodeId||!equal(legs[i-1].geometry.at(-1)!,leg.geometry[0])))errors.push(`Disconnected legs at ${i}`);
   if(route.nodeIds[i]!==leg.fromNodeId||route.nodeIds[i+1]!==leg.toNodeId||route.edgeIds[i]!==leg.edgeId)errors.push(`Wrong ordered IDs at ${i}`);
   for(let j=i?1:0;j<line.length;j++)if(!equal(route.geometry[pointIndex++]??[],line[j]))errors.push(`Wrong flattened geometry at ${i}`);
   if(leg.meters!==s[4]||!(leg.seconds>0))errors.push(`Wrong leg distance/time at ${i}`);
   sumMeters+=s[4];sumSeconds+=leg.seconds;
  }
  for(let i=1;i<route.geometry.length;i++)geometricMeters+=greatCircleMeters(route.geometry[i-1],route.geometry[i]);
  if(pointIndex!==route.geometry.length||Math.abs(sumMeters-route.meters)>1e-6||Math.abs(sumSeconds-route.seconds)>1e-6||Math.abs(geometricMeters-route.meters)>0.01)errors.push('Totals/geometry mismatch');
  for(const [city,node,point] of [[route.fromCityId,route.fromNodeId,route.geometry[0]],[route.toCityId,route.toNodeId,route.geometry.at(-1)!]] as const){
   const source=graph.nodes[network.nodeIndex.get(node)!];if(!source||!equal(point,source.slice(1)))errors.push('Geometry endpoint mismatch');
   if(city&&graph.snaps.find(s=>s.cityId===city)?.nodeId!==node)errors.push('City snap mismatch');
  }
  const matchSuffix=(r:typeof viaRules[number],i:number)=>{
   if(i+1>=legs.length)return 'prefix';let stage=1;if(legs[i+1].wayId!==r.chain[1])return 'mismatch';
   for(let j=i+2;j<legs.length;j++){
    if(legs[j].wayId===r.chain[stage])continue;
    if(legs[j].wayId===r.chain[stage+1]&&r.junctions[stage].has(legs[j].fromNodeId)){if(++stage===r.chain.length-1)return 'complete'}else return 'mismatch';
   }return 'prefix';
  };
  for(let i=0;i+1<legs.length;i++){
   const a=legs[i],b=legs[i+1],rules=nodeRules.get(`${a.toNodeId}:${a.wayId}`)??[];
   rules.forEach(r=>nodeEncounters.add(r.id));
   const matches=(r:TurnRelation)=>member(r,'to','w')===b.wayId&&(!mode(r).endsWith('u_turn')||a.wayId!==b.wayId||a.fromNodeId===b.toNodeId);
   const only=rules.filter(r=>mode(r).startsWith('only_'));
   if(only.length&&!only.some(matches))errors.push(`only via-node violation: ${only.map(r=>r.id)} at ${a.toNodeId}`);
   for(const r of rules.filter(r=>mode(r).startsWith('no_')))if(matches(r))errors.push(`no via-node violation: ${r.id} at ${a.toNodeId} from ${a.wayId} to ${b.wayId}`);
   const starts=viaRules.filter(r=>r.chain[0]===a.wayId&&r.junctions[0].has(a.toNodeId));
   const mandatory=starts.filter(r=>r.mode.startsWith('only_'));
   if(mandatory.length&&!mandatory.some(r=>matchSuffix(r,i)!=='mismatch'))errors.push(`only via-way violation: ${mandatory.map(r=>r.id)}`);
   for(const r of starts)if(b.wayId===r.chain[1]){viaEntries.add(r.id);if(r.mode.startsWith('no_')&&matchSuffix(r,i)==='complete')errors.push(`no via-way violation: ${r.id}`)}
   for(const r of graph.restrictions)if(conservative.has(r.id)&&member(r,'from','w')===a.wayId&&member(r,'via','w')===b.wayId)errors.push(`Conservative entry violation: ${r.id}`);
  }
  // A malformed relation remains unsupported by the router. Prove it irrelevant
  // to this particular route only when its required from/to ways are absent.
  // Never treat a missing via as a blanket permission for the manoeuvre.
  const usedWays=new Set(legs.map(l=>l.wayId)),usedNodes=new Set(route.nodeIds),unsupportedExposure:number[]=[],unsupportedRuledOut:number[]=[];
  for(const r of graph.restrictions)if(unsupported.has(r.id)&&!exempt(r)){
   const from=r.members.filter(m=>m[2]==='from'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]);
   const to=r.members.filter(m=>m[2]==='to'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]);
   const viaNodes=r.members.filter(m=>m[2]==='via'&&(m[0]==='n'||m[0]==='node')).map(m=>m[1]);
   const viaWays=r.members.filter(m=>m[2]==='via'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]);
   if(viaNodes.some(n=>!usedNodes.has(n)))continue;
   if(mode(r).startsWith('no_')&&viaWays.some(w=>!usedWays.has(w)))continue;
   const fromUsed=from.some(w=>usedWays.has(w)),toUsed=to.some(w=>usedWays.has(w));
   if(from.length&&!fromUsed)continue;
   if(mode(r).startsWith('no_')&&to.length&&!toUsed){if(fromUsed)unsupportedRuledOut.push(r.id);continue;}
   unsupportedExposure.push(r.id);
  }
  if(unsupportedExposure.length)errors.push(`Unassessed unsupported restriction exposure: ${unsupportedExposure}`);
  return {errors,nodeRelationsEncountered:[...nodeEncounters],viaWayEntriesUsed:[...viaEntries],unsupportedExposure,unsupportedRuledOut};
 };
}
