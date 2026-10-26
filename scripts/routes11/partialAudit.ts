/** Independent universal proof over actual route legs, never infers a missing member. */
import type {RoadGraph} from '../../src/world/roads/model';
import type {PlannedRoadRoute} from '../routes08/routing';
export function auditNodeMembers(graph:RoadGraph,route:PlannedRoadRoute){
 const errors:string[]=[],proven:number[]=[],proofs:any[]=[];
 const alternatives=new Map<string,Set<number>>();
 for(const r of graph.restrictions){const mode=r.tags['restriction:motorcar']??r.tags.restriction??'';if(!mode.startsWith('only_')||(r.tags.except??'').split(/[;,]/).some(v=>['motorcar','motor_vehicle','vehicle'].includes(v.trim())))continue;const via=r.members.filter(m=>m[2]==='via'&&['n','node'].includes(m[0]));if(via.length!==1||r.members.some(m=>m[2]==='via'&&['w','way'].includes(m[0])))continue;for(const f of r.members.filter(m=>m[2]==='from'&&['w','way'].includes(m[0]))){const key=via[0][1]+':'+f[1],targets=alternatives.get(key)??new Set<number>();for(const t of r.members.filter(m=>m[2]==='to'&&['w','way'].includes(m[0])))targets.add(t[1]);alternatives.set(key,targets)}}

 for(const relation of graph.restrictions){const tags=relation.tags;if((tags.except??'').split(/[;,]/).some(v=>['motorcar','motor_vehicle','vehicle'].includes(v.trim())))continue;
  const from=relation.members.filter(m=>m[2]==='from'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]);const to=relation.members.filter(m=>m[2]==='to'&&(m[0]==='w'||m[0]==='way')).map(m=>m[1]);const node=relation.members.filter(m=>m[2]==='via'&&(m[0]==='n'||m[0]==='node'));const viaWay=relation.members.some(m=>m[2]==='via'&&(m[0]==='w'||m[0]==='way'));
  if(node.length!==1||viaWay||(!from.length&&!to.length))continue;const mode=tags['restriction:motorcar']??tags.restriction??'';if(!/^(no_|only_)/.test(mode))continue;
  let safe=true;const turns:any[]=[];
  for(let i=0;i+1<route.legs.length;i++){const a=route.legs[i],b=route.legs[i+1];if(a.toNodeId!==node[0][1])continue;
   const applies=from.length===0||from.includes(a.wayId);let allowed=true,reason='known source does not apply';
   if(applies){if(mode.startsWith('only_')){const targets=alternatives.get(a.toNodeId+':'+a.wayId);allowed=targets?targets.has(b.wayId):to.length>0&&to.includes(b.wayId);reason=targets?'known only alternatives permit this target':'known target satisfies every possible missing source'}else{const continuing=mode==='no_u_turn'&&a.wayId===b.wayId&&a.fromNodeId!==b.toNodeId;allowed=continuing||(to.length>0&&!to.includes(b.wayId));reason=continuing?'same-way continuation is not a U-turn':'avoids every known prohibited target'}}
   if(!allowed){safe=false;errors.push(`Node restriction ${relation.id}: ${a.wayId} -> ${b.wayId} at ${a.toNodeId}`)}
   turns.push({fromEdge:a.edgeId,toEdge:b.edgeId,viaNode:a.toNodeId,allowed,reason});
  }
  if(!from.length||!to.length){if(safe){proven.push(relation.id);if(turns.length)proofs.push({relationId:relation.id,missingFrom:!from.length,missingTo:!to.length,method:'universal for every possible missing member',turns})}}
 }
 return {errors,proven,proofs};
}
export function combineAudit(graph:RoadGraph,route:PlannedRoadRoute,base:any){const node=auditNodeMembers(graph,route),remaining=base.unsupportedExposure.filter((id:number)=>!node.proven.includes(id));
 return {...base,errors:[...base.errors.filter((e:string)=>!e.startsWith('Unassessed unsupported restriction exposure:')),...node.errors,...(remaining.length?[`Unassessed unsupported restriction exposure: ${remaining}`]:[])],unsupportedExposure:remaining,partialMemberProofs:node.proofs};
}
