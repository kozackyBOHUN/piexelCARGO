import {simulatePreview,migrate09} from './simulation09';
import {M09,type PlannedStop} from './mechanics09';
import {phaseDuration,type PreviewState,type TransportRoute} from './gameplay';
import {pointOnRoute} from './routeGeometry';
function future(s:PreviewState,at:number){if(!s.van||s.driverHiredAt===null)throw Error('Potrzebny jest samochód i kierowca.');if(!Number.isSafeInteger(at)||at<=s.time)throw Error('Wybierz przyszłe miejsce na osi.');if(at>s.time+7*86400000)throw Error('Planowanie dostępne do 7 dni naprzód.');if((s.stops??[]).filter(p=>p.status==='planned').length>=10)throw Error('Najpierw zrealizuj lub usuń wcześniejsze postoje.');}
export function planRest(state:PreviewState,at:number):PreviewState{future(state,at);const s=migrate09(state),n=(s.stopSequence??0)+1;return {...s,stopSequence:n,stops:[...(s.stops??[]),{id:`stop:${n}`,kind:'rest',at,durationMs:M09.restMs,status:'planned'}]}}
export function planFuel(state:PreviewState,at:number,litres:number|null):PreviewState{
 future(state,at);if(litres!==null&&(!Number.isSafeInteger(litres)||litres<=0||litres>80))throw Error('Wpisz od 1 do 80 litrów albo DO PEŁNA.');
 const s=migrate09(state),predicted=simulatePreview(s,at),job=predicted.active;
 if(!job||job.phase==='unloading')throw Error('Brak dalszej trasy w wybranym czasie. Wybierz czas jazdy.');
 const phase=job.phase==='empty'?'empty':'loaded',route=phase==='empty'?job.routeEmpty:job.routeLoaded;
 const progress=job.phase===phase?job.phaseProgressMs:0,duration=phaseDuration({...job,phase}),position=duration?route.meters*progress/duration:route.meters,remaining=route.meters-position;
 if(remaining<5000)throw Error('Przed celem pozostało mniej niż 5 km — nie można umieścić stacji.');
 const currentJob=s.active;if(!currentJob||((currentJob.phase==='empty'?'empty':'loaded')!==phase))throw Error('Wybierz najbliższą fazę jazdy, bez pomijania celu bieżącej drogi.');
 const currentProgress=currentJob.phase===phase?currentJob.phaseProgressMs:0,currentPosition=route.meters*currentProgress/duration;
 if(position-currentPosition>30000)throw Error('Stacja musi być 5–30 km przed aktualną pozycją na tej drodze.');
 const distance=position-currentPosition>=5000?position:currentPosition+Math.min(10000,route.meters-currentPosition);
 if(distance-currentPosition<5000||distance-currentPosition>30000)throw Error('Brak miejsca na stację 5–30 km przed pojazdem.');
 const target=Math.round(distance/route.meters*duration),mlNeeded=Math.ceil((distance-position)*(phase==='empty'?(s.van!.specs?.emptyLitresPer100Km??10):(s.van!.specs?.loadedLitresPer100Km??12))/100);
 if(predicted.van!.fuelMillilitres<mlNeeded)throw Error('Za mało paliwa na dojazd do stacji — wybór zablokowany.');
 if(predicted.company!.balanceGrosze<M09.fuelPriceGroszePerLitre*(litres??Math.ceil((M09.tankMl-predicted.van!.fuelMillilitres+mlNeeded)/1000)))throw Error('Za mało środków na planowane tankowanie.');
 const n=(s.stopSequence??0)+1,estimated=at+(predicted.service?predicted.service.end-at:0)+(job.phase==='loading'?phaseDuration(job)-job.phaseProgressMs:0)+(target-progress);
 const p:PlannedStop={id:`stop:${n}`,kind:'fuel',at:estimated,durationMs:M09.fuelStopMs,status:'planned',phase,transportId:job.offer.id,progressMs:target,litres,coordinates:pointOnRoute(route,distance/route.meters)};
 return {...s,stopSequence:n,stops:[...(s.stops??[]),p]};
}
export function moveStop(state:PreviewState,id:string,at:number):PreviewState{
 const p=state.stops?.find(p=>p.id===id);if(!p||p.status!=='planned'||p.at<=state.time)throw Error('Nie można przesuwać rozpoczętej ani przeszłej czynności.');
 const base={...state,stops:state.stops!.filter(v=>v.id!==id)};const next=p.kind==='rest'?planRest(base,at):planFuel(base,at,p.litres??null),added=next.stops!.at(-1)!;return {...next,stops:next.stops!.map(v=>v.id===added.id?{...v,id}:v)};
}
export function removeStop(state:PreviewState,id:string):PreviewState{const p=state.stops?.find(v=>v.id===id);if(!p||p.status!=='planned'||p.at<=state.time)throw Error('Nie można usuwać rozpoczętej czynności.');return {...state,stops:state.stops!.filter(v=>v.id!==id)}}
const cache=new WeakMap<PreviewState,{future:PreviewState;eta:number|null}>();
export function projectPlan(s:PreviewState){
 const old=cache.get(s);if(old)return old;
 let remaining=0,drive=0;if(s.active){for(const phase of (s.active.emptyOnly?['empty']:['empty','loading','loaded','unloading']) as ('empty'|'loading'|'loaded'|'unloading')[]){const order={empty:0,loading:1,loaded:2,unloading:3};if(order[phase]<order[s.active.phase])continue;const d=phaseDuration({...s.active,phase})-(phase===s.active.phase?s.active.phaseProgressMs:0);remaining+=d;if(phase==='empty'||phase==='loaded')drive+=d}}
 const pending=(s.stops??[]).filter(p=>p.status==='planned'),wait=s.service?Math.max(0,s.service.end-s.time):0;
 const horizon=Math.min(s.time+14*86400000,Math.max(s.time+4*M09.hour,s.time+remaining+wait+pending.reduce((n,p)=>n+p.durationMs,0)+Math.ceil(((s.driverState?.drivingMs??0)+drive)/M09.maxDriveMs)*M09.mandatoryRestMs,...pending.filter(p=>!p.phase).map(p=>p.at+p.durationMs)));
 const future=simulatePreview(s,horizon),eta=s.active&&future.lastTransport?.offer.id===s.active.offer.id&&future.lastTransport.startedAt===s.active.startedAt?future.lastTransport.completedAt:null;const result={future,eta};cache.set(s,result);return result;
}
