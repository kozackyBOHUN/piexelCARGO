import cities from '../world/data/cities-demo.json';
import type {PreviewState,PreviewEvent} from './gameplay';
export const cityName=(id:string)=>cities.find(c=>c.id===id)?.name??id;
export function geographicKm(a:string,b:string){
 const p=cities.find(c=>c.id===a)?.coordinates,q=cities.find(c=>c.id===b)?.coordinates;
 if(!p||!q)return Infinity;
 const rad=Math.PI/180,h=Math.sin((q[1]-p[1])*rad/2)**2+Math.cos(p[1]*rad)*Math.cos(q[1]*rad)*Math.sin((q[0]-p[0])*rad/2)**2;
 return 12742.0176*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function financialDays(state:PreviewState,days:number){
 const since=days?Math.max(0,state.time-days*86400000):-Infinity;
 const events=state.events.filter(e=>e.at>=since&&e.changeGrosze!==0);
 const operating=events.filter(e=>!e.message.startsWith('Utworzono firmę')&&!e.message.startsWith('Spłacono'));
 const groups=new Map<number,{day:number;income:number;cost:number}>();
 for(const e of operating){const day=Math.floor(e.at/86400000);const g=groups.get(day)??{day,income:0,cost:0};if(e.changeGrosze>0)g.income+=e.changeGrosze;else g.cost-=e.changeGrosze;groups.set(day,g)}
 const income=operating.reduce((n,e)=>n+Math.max(0,e.changeGrosze),0),cost=operating.reduce((n,e)=>n-Math.min(0,e.changeGrosze),0);
 return {events,income,cost,profit:income-cost,groups:[...groups.values()].sort((a,b)=>a.day-b.day)};
}

/** Latest timestamp first; equal timestamps follow reverse execution order. */
export function newestTransactions(events:readonly PreviewEvent[]){return events.map((event,index)=>({event,index})).sort((a,b)=>b.event.at-a.event.at||b.index-a.index).map(v=>v.event)}
