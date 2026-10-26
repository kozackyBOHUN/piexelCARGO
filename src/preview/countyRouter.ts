import type {TransportRoute} from './gameplay';
export interface CountyLink extends TransportRoute {linkId:string}
export interface CountyNetwork {format:number;states:{cityId:string}[];starts:Record<string,number>;transitions:{linkId:string;to:number}[][];approvedPairs:string[]}
export function makeCountyRouter(links:readonly CountyLink[],network:CountyNetwork){
 const byId=new Map(links.map(r=>[r.id,r])),allowed=new Set(network.approvedPairs),cache=new Map<string,TransportRoute>();
 if(network.format!==1||network.states.length!==network.transitions.length)throw Error('Nieprawidłowa sieć powiatowa.');
 for(const row of network.transitions)for(const e of row)if(!byId.has(e.linkId)||!network.states[e.to])throw Error('Nieznany odcinek lub stan sieci.');
 function routeBetween(from:string,to:string):TransportRoute|null {
  const key=`${from}|${to}`;if(!allowed.has(key))return null;if(cache.has(key))return cache.get(key)!;
  const start=network.starts[from];if(start===undefined)return null;const distance=new Map([[start,0]]),previous=new Map<number,{state:number;id:string}>(),seen=new Set<number>();let goal=-1;
  while(true){let best=-1,cost=Infinity;for(const [s,d] of distance)if(!seen.has(s)&&d<cost){best=s;cost=d}if(best<0)break;if(network.states[best].cityId===to){goal=best;break}seen.add(best);for(const edge of network.transitions[best]){const d=cost+byId.get(edge.linkId)!.meters;if(d<(distance.get(edge.to)??Infinity)){distance.set(edge.to,d);previous.set(edge.to,{state:best,id:edge.linkId})}}}
  if(goal<0)return null;const chain:CountyLink[]=[];while(goal!==start){const p=previous.get(goal);if(!p)throw Error('Nieciągły łańcuch powiatowy.');chain.unshift(byId.get(p.id)!);goal=p.state}
  let geometry:TransportRoute['geometry']|undefined;
  const route:TransportRoute={id:`county:${chain.map(c=>c.id).join('+')}`,fromCityId:from,toCityId:to,meters:chain.reduce((n,c)=>n+c.meters,0),seconds:chain.reduce((n,c)=>n+c.seconds,0),get geometry(){if(!geometry){const points:(readonly[number,number])[]=[];for(const leg of chain){if(points.length){const a=points.at(-1)!,b=leg.geometry[0];if(a[0]!==b[0]||a[1]!==b[1])throw Error('Nieciągła geometria sąsiadów.')}points.push(...(points.length?leg.geometry.slice(1):leg.geometry))}geometry=points}return geometry}};
  cache.set(key,route);return route;
 }
 return {routeBetween,catalog:()=>network.approvedPairs.map(p=>{const [a,b]=p.split('|');const r=routeBetween(a,b);if(!r)throw Error('Brak dopuszczonej trasy.');return r})};
}
export {loadPreferredRoutes as loadGameRoutes} from './preferredRoutes11';
