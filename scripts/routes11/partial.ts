import type {RoadNetwork,TurnRelation,DirectedEdge} from '../../src/world/roads/model';
const ways=(r:TurnRelation,role:string)=>r.members.filter(m=>m[2]===role&&['w','way'].includes(m[0])).map(m=>m[1]);
const vias=(r:TurnRelation)=>r.members.filter(m=>m[2]==='via'&&['n','node'].includes(m[0])).map(m=>m[1]);
export function partialRules(network:RoadNetwork){const byNode=new Map<number,{id:number;mode:string;from:number[];to:number[]}[]>();
 for(const r of network.graph.restrictions){if((r.tags.except??'').split(/[;,]/).some(v=>['motorcar','motor_vehicle','vehicle'].includes(v.trim())))continue;const n=vias(r),mode=r.tags['restriction:motorcar']??r.tags.restriction??'';if(n.length!==1||ways(r,'via').length)continue;const a=byNode.get(n[0])??[];a.push({id:r.id,mode,from:ways(r,'from'),to:ways(r,'to')});byNode.set(n[0],a)}
 return (a:DirectedEdge,b:DirectedEdge)=>{const rows=byNode.get(network.graph.nodes[a.to][0]);if(!rows)return true;const from=network.graph.ways[network.graph.segments[a.segment][3]].id,to=network.graph.ways[network.graph.segments[b.segment][3]].id;
  const knownOnly=rows.filter(r=>r.mode.startsWith('only_')&&r.from.includes(from));
  if(knownOnly.length&&!knownOnly.some(r=>r.to.includes(to)))return false;
  for(const r of rows){if(knownOnly.length&&r.mode.startsWith('only_'))continue;if(r.from.length&&!r.from.includes(from))continue;
   if(r.mode.startsWith('only_')){if(!r.to.length||!r.to.includes(to))return false}
   else if(r.mode.startsWith('no_')){if(r.mode==='no_u_turn'&&from===to&&a.from!==b.to)continue;if(!r.to.length||r.to.includes(to))return false}
   else return false;
  }return true;
 };
}
