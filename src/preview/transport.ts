import {projectPlan} from './planning09';
import type { LonLat } from '../world/geography';
import {recordedPlan,phaseDuration,type ActiveTransport,type Phase,type PreviewState,type TransportRoute} from './gameplay';
export const PHASE_LABELS:Record<Phase,string>={empty:'Dojazd pusty',loading:'Załadunek',loaded:'Jazda z ładunkiem',unloading:'Rozładunek'};
export {pointOnRoute} from './routeGeometry';
import {pointOnRoute} from './routeGeometry';
export interface MapVehicle {name:string;cityId:string;coordinates:LonLat|null;status:string;destinationId:string;progress:number;route:readonly LonLat[]|null}
export interface GameMapState {highlightedRoute?:readonly LonLat[];time:number;baseCityId:string|null;vehicle:MapVehicle|null}
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
 return {time:state.time,baseCityId:state.company?.baseCityId??null,vehicle:{name:state.van.specs?.model??'Furgon',cityId:state.van.cityId,coordinates,status:state.service?(state.service.kind==='rest'?'Odpoczynek':'Tankowanie'):state.haltedReason?'Brak paliwa':job?PHASE_LABELS[job.phase]:'Oczekiwanie',destinationId:job?.offer.toCityId??state.van.cityId,progress,route}};
}
export interface ScheduleActivity {phase:Phase|'waiting'|'rest'|'fuel';stopId?:string;transportId?:string;label:string;start:number;end:number;ongoing:boolean;progress:number}
export function scheduleActivities(state:PreviewState):ScheduleActivity[]{
 if(!state.van)return [];
 if(state.driverState||state.activityLog||state.service){
  const {future,eta}=projectPlan(state),pending=state.stops?.some(p=>p.status==='planned');
  return (future.activityLog??[]).filter(a=>!(a.phase==='waiting'&&(state.active?eta!==null&&a.start>=eta:a.start>state.time&&!pending&&!state.service))).map(a=>{const end=a.phase==='waiting'&&!state.active&&!pending&&!state.service?Math.min(state.time,a.end):a.end;return {phase:a.phase,label:a.phase==='rest'?'Odpoczynek':a.phase==='fuel'?'Tankowanie':a.phase==='waiting'?'Oczekiwanie':PHASE_LABELS[a.phase],start:a.start,end,stopId:a.stopId,transportId:a.transportId,ongoing:state.time>=a.start&&state.time<end,progress:end>a.start?Math.max(0,Math.min(1,(state.time-a.start)/(end-a.start))):state.time>=a.start?1:0}});
 }
 const plans=[...(state.completedPlans??(state.lastTransport?[recordedPlan(state.lastTransport,state.lastTransport.completedAt)]:[]))];
 if(state.active)plans.push(recordedPlan(state.active,state.active.startedAt+(['empty','loading','loaded','unloading'] as const).filter(p=>!state.active!.emptyOnly||p==='empty').reduce((sum,phase)=>sum+phaseDuration({...state.active!,phase}),0)));
 const result:ScheduleActivity[]=[];let previousEnd:number|undefined;
 for(const plan of plans){
  if(previousEnd!==undefined&&plan.start>previousEnd)result.push({phase:'waiting',label:'Oczekiwanie',start:previousEnd,end:plan.start,ongoing:false,progress:1});
  let start=plan.start;for(const {phase,durationMs} of plan.phases){const end=start+durationMs;result.push({phase,label:PHASE_LABELS[phase],start,end,ongoing:!!state.active&&state.active.startedAt===plan.start&&state.active.phase===phase,progress:durationMs?Math.max(0,Math.min(1,(state.time-start)/durationMs)):state.time>=start?1:0});start=end;}previousEnd=plan.end;
 }
 if(!state.active){const from=previousEnd??[...state.events].reverse().find(e=>e.message.startsWith('Dostarczono')||e.message.startsWith('Kupiono'))?.at??state.time;result.push({phase:'waiting',label:'Oczekiwanie',start:from,end:state.time,ongoing:true,progress:1})}
 return result;
}
