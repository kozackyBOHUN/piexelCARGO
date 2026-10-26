import {migrateCargo,loadBatch,unloadBatch,units} from './cargo10';
import {phaseDuration,recordedPlan,type PreviewState,type ActiveTransport,type Phase} from './gameplay';
import {M09,type ActivityRecord,type PlannedStop} from './mechanics09';
import {refreshMarket} from './market';
export function event(s:PreviewState,message:string,changeGrosze=0):PreviewState{return {...s,events:[...s.events,{id:`preview:${s.events.length+1}`,at:s.time,message,changeGrosze}]}}
export function migrate09(s:PreviewState):PreviewState{
 if(s.driverHiredAt!==null&&!s.driverState)s={...s,driverState:{drivingMs:0,satisfaction:100,overtimeHoursCharged:0,paidWorkMs:Math.max(0,s.time-s.driverHiredAt)}};
 if(s.activityLog)return s;
 const log:ActivityRecord[]=[];const plans=s.completedPlans??(s.lastTransport?[recordedPlan(s.lastTransport,s.lastTransport.completedAt)]:[]);
 for(const p of plans){let at=p.start;for(const v of p.phases){log.push({phase:v.phase,start:at,end:at+v.durationMs});at+=v.durationMs}}
 if(s.active){let at=s.active.startedAt;for(const phase of (s.active.emptyOnly?['empty']:['empty','loading','loaded','unloading']) as Phase[]){const end=at+(phase===s.active.phase?s.active.phaseProgressMs:phaseDuration({...s.active,phase}));if(end>at)log.push({phase,start:at,end,transportId:s.active.offer.id});if(phase===s.active.phase)break;at=end}}
 return {...s,activityLog:log};
}
function append(s:PreviewState,phase:ActivityRecord['phase'],start:number,end:number,transportId?:string,stopId?:string){
 if(end<start||(!s.van&&phase==='waiting'))return s;const list=s.activityLog??[],last=list.at(-1);
 if(last&&last.phase===phase&&last.end===start&&last.transportId===transportId&&last.stopId===stopId)return {...s,activityLog:[...list.slice(0,-1),{...last,end}]};
 return {...s,activityLog:[...list,{phase,start,end,transportId,stopId}]};
}
export function beginStop(s:PreviewState,p:PlannedStop):PreviewState{
 const mandatory=p.kind==='rest'&&(p.mandatory||!!s.driverState&&s.driverState.drivingMs>=M09.maxDriveMs);
 const duration=mandatory?M09.mandatoryRestMs:p.durationMs;
 const active={...p,status:'active' as const,mandatory,at:s.time,startedAt:s.time,durationMs:duration};
 let next={...s,stops:[...(s.stops??[]).filter(v=>v.id!==p.id).map(v=>v.status==='planned'&&v.at>=s.time?{...v,at:v.at+duration}:v),active],service:{stopId:p.id,kind:p.kind,start:s.time,end:s.time+duration}} as PreviewState;
 if(mandatory&&next.driverState)next={...next,driverState:{...next.driverState,satisfaction:Math.max(0,next.driverState.satisfaction-M09.mandatoryPenalty)}};
 return event(next,mandatory?'Obowiązkowy odpoczynek 15 h po 16 h jazdy.':p.kind==='rest'?'Rozpoczęto odpoczynek 10 h.':'Rozpoczęto tankowanie — postój 15 min.');
}
export function beginCityFuel(s:PreviewState,litres:number|null):PreviewState{
 if(!s.company||!s.van||s.active||s.service)throw Error('Tankowanie w mieście wymaga wolnego pojazdu na postoju.');
 if(litres!==null&&(!Number.isSafeInteger(litres)||litres<=0||litres*1000+s.van.fuelMillilitres>M09.tankMl))throw Error('Przekroczona pojemność baku lub niepoprawna liczba litrów.');
 const ml=litres===null?M09.tankMl-s.van.fuelMillilitres:litres*1000;
 if(ml<=0||s.company.balanceGrosze<Math.round(ml/1000*M09.fuelPriceGroszePerLitre))throw Error('Brak środków na paliwo albo bak jest pełny.');
 return beginStop(migrate09(s),{id:`city-fuel:${s.time}:${s.stopSequence??0}`,kind:'fuel',at:s.time,durationMs:M09.fuelStopMs,status:'planned',litres});
}
function activateStop(s:PreviewState):PreviewState{
 if(!s.service){
   const due=(s.stops??[]).filter(p=>p.status==='planned'&&(p.kind==='rest'||!p.phase?p.at<=s.time:s.active?.phase===p.phase&&(!p.transportId||s.active.offer.id===p.transportId)&&s.active.phaseProgressMs>=(p.progressMs??Infinity))).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id))[0];
   if(due){return beginStop(s,due)}
   if(s.driverState&&s.driverState.drivingMs>=M09.maxDriveMs){const id=`mandatory:${s.time}`;return beginStop(s,{id,kind:'rest',at:s.time,durationMs:M09.mandatoryRestMs,status:'planned',mandatory:true})}
  }
 return s;
}
export function simulatePreview(state:PreviewState,newGameTime:number):PreviewState{
 if(!Number.isSafeInteger(newGameTime)||newGameTime<state.time)throw Error('Niepoprawny lub cofnięty czas gry.');if(newGameTime===state.time)return state;
 let s=migrateCargo(migrate09(state));
 while(s.time<newGameTime){
  const activated=activateStop(s);if(activated!==s){s=activated;continue}
  const a=s.active,paused=!!s.service||!!s.haltedReason,moving=!!a&&!paused&&(a.phase==='empty'||a.phase==='loaded');
  const phaseEnd=a&&!paused?s.time+Math.max(0,phaseDuration(a)-a.phaseProgressMs):Infinity;
  const midnight=(Math.floor(s.time/86400000)+1)*86400000;
  const nextWage=s.driverState&&s.service?.kind!=='rest'?s.time+M09.hour-s.driverState.paidWorkMs%M09.hour:Infinity;
  const threshold=moving&&s.driverState?s.time+Math.max(0,(s.driverState.drivingMs<12*M09.hour?12*M09.hour:Math.min(16*M09.hour,(Math.floor(s.driverState.drivingMs/M09.hour)+1)*M09.hour))-s.driverState.drivingMs):Infinity;
  const planned=Math.min(Infinity,...(s.stops??[]).filter(p=>p.status==='planned').map(p=>s.service?Infinity:p.kind==='rest'||!p.phase?Math.max(s.time,p.at):a&&!paused&&a.phase===p.phase&&(!p.transportId||a.offer.id===p.transportId)?s.time+Math.max(0,p.progressMs!-a.phaseProgressMs):Infinity));
  const deadline=Math.min(Infinity,...(s.market?.orders.filter(o=>o.completedAt===null&&!o.penalized).map(o=>Math.max(s.time,o.deadline+1))??[]));
  let fuelEnd=Infinity,routeMeters=0,rate=0,duration=0;
  if(moving&&a&&s.van){duration=phaseDuration(a);routeMeters=a.phase==='empty'?a.routeEmpty.meters:a.routeLoaded.meters;rate=(a.phase==='empty'?(s.van.specs?.emptyLitresPer100Km??10):(s.van.specs?.loadedLitresPer100Km??12))/100;
   const used=(p:number)=>Math.ceil(routeMeters*rate*(duration?Math.min(1,p/duration):1));
   if(used(duration)-used(a.phaseProgressMs)>s.van.fuelMillilitres){let lo=a.phaseProgressMs,hi=duration;while(lo+1<hi){const m=Math.floor((lo+hi)/2);if(used(m)-used(a.phaseProgressMs)<=s.van.fuelMillilitres)lo=m;else hi=m}fuelEnd=s.time+lo-a.phaseProgressMs;if(fuelEnd<=s.time){s=event({...s,haltedReason:'Brak paliwa w trasie — dalsza jazda zablokowana. Usługa dowozu nie jest jeszcze dostępna.'},'Pojazd zatrzymany: brak paliwa.');continue}}
  }
  const to=Math.min(newGameTime,midnight,nextWage,threshold,planned,deadline,phaseEnd,s.service?.end??Infinity,fuelEnd),dt=to-s.time;
  if(dt<0||!Number.isFinite(to))throw Error('Nieprawidłowa granica symulacji.');
  if(dt>0){
   const kind=s.service?.kind??(a&&!s.haltedReason?a.phase:'waiting');s=append(s,kind,s.time,to,a?.offer.id,s.service?.stopId);
   if(moving&&a&&s.van){const cum=(p:number)=>Math.ceil(routeMeters*rate*(duration?Math.min(1,p/duration):1));s={...s,van:{...s.van,fuelMillilitres:s.van.fuelMillilitres-(cum(a.phaseProgressMs+dt)-cum(a.phaseProgressMs)),mileageMeters:s.van.mileageMeters+routeMeters*(duration?dt/duration:1)}}}
   if(s.driverState){const drive=s.driverState.drivingMs+(moving?dt:0),overtime=Math.max(0,Math.floor((drive-12*M09.hour)/M09.hour)),newPenalty=Math.max(0,overtime-s.driverState.overtimeHoursCharged)*M09.overtimePenalty;
    s={...s,driverState:{...s.driverState,drivingMs:drive,paidWorkMs:s.driverState.paidWorkMs+(s.service?.kind==='rest'?0:dt),satisfaction:Math.max(0,s.driverState.satisfaction-newPenalty),overtimeHoursCharged:Math.max(overtime,s.driverState.overtimeHoursCharged)}};
   }
   s={...s,time:to};const earned=s.driverState?Math.floor(s.driverState.paidWorkMs/M09.hour)*2500:0,difference=Math.max(0,earned-s.paidWagesGrosze);
   if(difference&&s.company){s={...s,paidWagesGrosze:s.paidWagesGrosze+difference,wagesLoggedGrosze:(s.wagesLoggedGrosze??0)+difference,company:{...s.company,balanceGrosze:s.company.balanceGrosze-difference}};s=event(s,'Pensja kierowcy - zakończona godzina pracy.',-difference)}
   if(a&&!paused)s={...s,active:{...s.active!,phaseProgressMs:a.phaseProgressMs+dt}};
  }
  s=refreshMarket(s);
  if(s.service&&s.time>=s.service.end){const pause=s.service,p=s.stops!.find(v=>v.id===pause.stopId)!;let failed='';
   if(pause.kind==='rest'&&s.driverState)s={...s,driverState:{...s.driverState,drivingMs:0,overtimeHoursCharged:0}};
   if(pause.kind==='fuel'&&s.van&&s.company){const ml=p.litres===null?M09.tankMl-s.van.fuelMillilitres:Math.min((p.litres??0)*1000,M09.tankMl-s.van.fuelMillilitres),price=Math.round(ml/1000*M09.fuelPriceGroszePerLitre);
    if(s.company.balanceGrosze<price)failed='Brak pieniędzy przy zakończeniu tankowania — paliwo nie zostało dodane.';else{s={...s,van:{...s.van,fuelMillilitres:s.van.fuelMillilitres+ml},company:{...s.company,balanceGrosze:s.company.balanceGrosze-price},haltedReason:undefined};s=event(s,`Zatankowano ${(ml/1000).toFixed(3)} l podczas postoju.`, -price)}
   }
   s={...s,service:undefined,stops:s.stops!.map(v=>v.id===p.id?{...v,status:failed?'failed':'completed',endedAt:s.time,failure:failed||undefined}:v)};s=event(s,failed||'Zakończono postój.');
  }
  s=activateStop(s);
  if(!s.service&&s.active&&!s.haltedReason&&s.active.phaseProgressMs>=phaseDuration(s.active)){
   const job=s.active;if(!dt&&phaseDuration(job)===0)s=append(s,job.phase,s.time,s.time,job.offer.id);
   const next:Record<Phase,Phase|'finished'>={empty:'loading',loading:'loaded',loaded:'unloading',unloading:'finished'},phase=job.emptyOnly?'finished':next[job.phase];
   if(phase==='finished'&&job.batch){
    s=unloadBatch(s);
    s={...s,active:null,lastTransport:{...job,completedAt:s.time},completedPlans:[...(s.completedPlans??[]),recordedPlan(job,s.time)]};
   }else if(phase==='finished'){
    const value=job.emptyOnly?0:job.offer.payoutGrosze;
    s={...s,active:null,lastTransport:{...job,completedAt:s.time},completedPlans:[...(s.completedPlans??[]),recordedPlan(job,s.time)],completedOfferIds:job.emptyOnly?s.completedOfferIds:[...s.completedOfferIds,job.offer.id],van:{...s.van!,cityId:job.offer.toCityId},company:{...s.company!,balanceGrosze:s.company!.balanceGrosze+value}};
    if(s.market)s={...s,market:{...s.market,orders:s.market.orders.map(o=>o.offer.id===job.offer.id?{...o,completedAt:s.time,cargoProgress:{picked:units(o.offer).count,delivered:units(o.offer).count}}:o)}};s=event(s,job.emptyOnly?`Zakończono przejazd pusty do ${job.offer.toCityId}.`:`Dostarczono ${job.offer.cargo}.`,value);
   }else {
    if(phase==='loaded'){
     if(job.batch)s=loadBatch(s);
     else if(s.market)s={...s,market:{...s.market,orders:s.market.orders.map(o=>o.offer.id===job.offer.id?{...o,cargoProgress:{picked:units(o.offer).count,delivered:0}}:o)}};
    }
    s={...s,active:{...job,phase,phaseProgressMs:0},van:phase==='loading'?{...s.van!,cityId:job.offer.fromCityId}:phase==='unloading'?{...s.van!,cityId:job.offer.toCityId}:s.van};
   }
  }
  if(to===midnight&&s.company&&s.company.debtGrosze>0){const cost=Math.round(s.company.debtGrosze/100);s={...s,company:{...s.company,balanceGrosze:s.company.balanceGrosze-cost}};s=event(s,'Odsetki od kredytu - 1% dziennie.',-cost)}
 }
 return s;
}
