/** Offline full-graph multi-target Dijkstra. State retains incoming edge and active via-way history. */
import {createHash} from 'node:crypto';
import type {RoadNetwork} from '../../src/world/roads/model';
import {DEFAULT_VAN,restrictions,canTurn,advanceViaRules,speedKph,type PlannedRoadRoute,type RoadLeg} from '../routes08/routing';
class Queue{a:{s:number;d:number}[]=[];push(s:number,d:number){const a=this.a;a.push({s,d});let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].d<=d)break;[a[p],a[i]]=[a[i],a[p]];i=p}}pop(){const a=this.a,head=a[0],tail=a.pop()!;if(a.length){a[0]=tail;let i=0;while(true){let j=i,l=2*i+1,r=l+1;if(l<a.length&&a[l].d<a[j].d)j=l;if(r<a.length&&a[r].d<a[j].d)j=r;if(j===i)break;[a[i],a[j]]=[a[j],a[i]];i=j}}return head}}
export function makeFullGraphDijkstra(network:RoadNetwork,additionalTurn?:(a:import('../../src/world/roads/model').DirectedEdge,b:import('../../src/world/roads/model').DirectedEdge)=>boolean){const g=network.graph,rules=restrictions(g,DEFAULT_VAN),N=network.edges.length;
 return function all(fromCityId:string){
  const start=g.snaps.find(s=>s.cityId===fromCityId)!;const goals=new Map(g.snaps.filter(s=>s.cityId!==fromCityId).map(s=>[network.nodeIndex.get(s.nodeId)!,s.cityId]));
  const dist=new Float64Array(N);dist.fill(Infinity);const prev=new Int32Array(N);prev.fill(-1);const extra=new Map<string,number>(),edges:number[]=[],tokens:number[][]=[],xd:number[]=[],xp:number[]=[];
  const getD=(s:number)=>s<N?dist[s]:xd[s-N],getP=(s:number)=>s<N?prev[s]:xp[s-N],getE=(s:number)=>s<N?s:edges[s-N];
  function locate(e:number,t:number[]){if(!t.length)return e;const key=e+'|'+t.join(',');if(extra.has(key))return extra.get(key)!;const s=N+edges.length;extra.set(key,s);edges.push(e);tokens.push(t);xd.push(Infinity);xp.push(-1);return s}
  function put(s:number,d:number,p:number){if(s<N){dist[s]=d;prev[s]=p}else{xd[s-N]=d;xp[s-N]=p}}
  const q=new Queue(),ends=new Map<string,number>();for(const e of network.outgoing[network.nodeIndex.get(start.nodeId)!]){const s=g.segments[network.edges[e].segment];put(e,s[4],-1);q.push(e,s[4])}
  while(q.a.length&&ends.size<goals.size){const item=q.pop();if(item.d!==getD(item.s))continue;const prior=network.edges[getE(item.s)],goal=goals.get(prior.to);if(goal&&!ends.has(goal))ends.set(goal,item.s);
   for(const e of network.outgoing[prior.to]){const next=network.edges[e];if(!canTurn(network,prior,next,rules)||(additionalTurn&&!additionalTurn(prior,next)))continue;const t=advanceViaRules(network,prior,next,item.s<N?[]:tokens[item.s-N],rules);if(t===null)continue;const s=locate(e,t),d=item.d+g.segments[next.segment][4];if(d<getD(s)-1e-9){put(s,d,item.s);q.push(s,d)}}
  }
  const result=new Map<string,PlannedRoadRoute>();for(const [city,end]of ends){const path:number[]=[];for(let s=end;s>=0;s=getP(s))path.push(getE(s));path.reverse();const legs:RoadLeg[]=path.map(i=>{const e=network.edges[i],s=g.segments[e.segment];return {edgeId:e.id,segmentId:s[0],fromNodeId:g.nodes[e.from][0],toNodeId:g.nodes[e.to][0],wayId:g.ways[s[3]].id,meters:s[4],seconds:s[4]*3.6/speedKph(g.ways[s[3]].tags,e.reverse,DEFAULT_VAN),geometry:e.reverse?[...s[6]].reverse():s[6]}});const geometry=legs.flatMap((l,i)=>i?l.geometry.slice(1):l.geometry),edgeIds=legs.map(l=>l.edgeId);
   result.set(city,{id:'road11:'+createHash('sha256').update(edgeIds.join('|')).digest('hex').slice(0,20),graphVersion:g.version,profileId:DEFAULT_VAN.id,fromCityId,toCityId:city,fromNodeId:start.nodeId,toNodeId:legs.at(-1)!.toNodeId,legs,geometry,edgeIds,nodeIds:[start.nodeId,...legs.map(l=>l.toNodeId)],meters:legs.reduce((n,l)=>n+l.meters,0),seconds:legs.reduce((n,l)=>n+l.seconds,0)});
  }return result;
 };
}
