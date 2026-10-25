import type { LonLat } from '../world/geography';
import {phaseDuration,type ActiveTransport,type Phase,type PreviewState,type TransportRoute} from './gameplay';
export const PHASE_LABELS:Record<Phase,string>={empty:'Dojazd pusty',loading:'Załadunek',loaded:'Jazda z ładunkiem',unloading:'Rozładunek'};
const cumulativeCache=new WeakMap<readonly LonLat[],Float64Array>();
function cumulative(points:readonly LonLat[]){
 let lengths=cumulativeCache.get(points);if(lengths)return lengths;
 lengths=new Float64Array(points.length);const rad=Math.PI/180;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];const h=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((b[0]-a[0])*rad/2)**2;
  lengths[i]=lengths[i-1]+12742017.6*Math.asin(Math.min(1,Math.sqrt(h)));
 }cumulativeCache.set(points,lengths);return lengths;
}
export function pointOnRoute(route:TransportRoute,fraction:number):LonLat {
 const points=route.geometry;if(!points.length)throw new Error('Brak geometrii trasy.');
 if(fraction<=0||points.length===1)return points[0];if(fraction>=1)return points.at(-1)!;
 const lengths=cumulative(points),target=lengths.at(-1)!*fraction;let low=0,high=points.length-1;
 while(low+1<high){const mid=(low+high)>>1;if(lengths[mid]<target)low=mid;else high=mid}
 const size=lengths[high]-lengths[low],t=size?(target-lengths[low])/size:0;
 return [points[low][0]+(points[high][0]-points[low][0])*t,points[low][1]+(points[high][1]-points[low][1])*t];
}
export interface MapVehicle {name:string;cityId:string;coordinates:LonLat|null;status:string;destinationId:string;progress:number;route:readonly LonLat[]|null}
export interface GameMapState {time:number;baseCityId:string|null;vehicle:MapVehicle|null}
export function mapState(state:PreviewState,routes:readonly TransportRoute[]):GameMapState {
 if(!state.van)return {time:state.time,baseCityId:state.company?.baseCityId??null,vehicle:null};
 const job=state.active;let coordinates:LonLat|null=null,route:readonly LonLat[]|null=null,progress=0;
 if(job){
  const moving=job.phase==='empty'?job.routeEmpty:job.routeLoaded;
  const fraction=phaseDuration(job)?Math.min(1,job.phaseProgressMs/phaseDuration(job)):1;
  progress=fraction;
  coordinates=pointOnRoute(moving,job.phase==='loading'?0:job.phase==='unloading'?1:fraction);
  route=job.phase==='empty'&&job.routeEmpty.meters>0?job.routeEmpty.geometry:job.routeLoaded.geometry;
 }else{
  coordinates=state.lastTransport?.routeLoaded.geometry.at(-1)??routes.find(r=>r.toCityId===state.van!.cityId)?.geometry.at(-1)??routes.find(r=>r.fromCityId===state.van!.cityId)?.geometry[0]??null;
  progress=state.lastTransport?1:0;
 }
 return {time:state.time,baseCityId:state.company?.baseCityId??null,vehicle:{name:state.van.specs?.model??'Furgon',cityId:state.van.cityId,coordinates,status:job?PHASE_LABELS[job.phase]:'Oczekiwanie',destinationId:job?.offer.toCityId??state.van.cityId,progress,route}};
}
export interface ScheduleActivity {phase:Phase|'waiting';label:string;start:number;end:number;ongoing:boolean;progress:number}
export function scheduleActivities(state:PreviewState):ScheduleActivity[]{
 if(!state.van)return [];
 const job:ActiveTransport|undefined=state.active??state.lastTransport;
 const result:ScheduleActivity[]=[];
 if(job){let start=job.startedAt;
  for(const phase of ['empty','loading','loaded','unloading'] as const){
   const end=start+phaseDuration({...job,phase});
   result.push({phase,label:PHASE_LABELS[phase],start,end,ongoing:!!state.active&&state.active.phase===phase,progress:end>start?Math.max(0,Math.min(1,(state.time-start)/(end-start))):state.time>=start?1:0});start=end;
  }
  if(!state.active){const from=state.lastTransport!.completedAt;result.push({phase:'waiting',label:'Oczekiwanie',start:from,end:state.time,ongoing:true,progress:1})}
 }else{
  const from=[...state.events].reverse().find(e=>e.message.startsWith('Dostarczono')||e.message.startsWith('Kupiono'))?.at??state.time;
  result.push({phase:'waiting',label:'Oczekiwanie',start:from,end:state.time,ongoing:true,progress:1});
 }
 return result;
}
