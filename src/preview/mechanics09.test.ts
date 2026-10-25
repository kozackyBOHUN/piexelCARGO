import {describe,it,expect} from 'vitest';
import {createPreviewState,establishCompany,buyVan,hireDriver,dispatchTransport,advancePreview,repayLoan,drawLoan,type PreviewState,type PreviewOffer,type TransportRoute} from './gameplay';
import {planRest,planFuel,moveStop,removeStop,projectPlan} from './planning09';
import {M09} from './mechanics09';
import {mapState} from './transport';
import {financialDays} from './interfaceModel';
const H=M09.hour,load=15*60000;
// Deliberately slow synthetic fixture to reach daily driving limits, never shipped as a road.
const road:TransportRoute={id:'test-long',fromCityId:'K',toCityId:'T',meters:100000,seconds:20*3600,geometry:[[19.94,50.06],[20.5,50.1],[20.98,50.01]]};
const offer:PreviewOffer={id:'test',fromCityId:'K',toCityId:'T',cargo:'książki',massKg:300,volumeM3:3,pallets:1,payoutGrosze:65000,expiresAt:5*24*H};
function ready(){return hireDriver(buyVan(establishCompany(createPreviewState(6*H),'Test','K')))}
function trip(){return dispatchTransport(ready(),offer,{...road,id:'stationary',toCityId:'K',meters:0,seconds:0,geometry:[road.geometry[0]]},road)}
const clone=(s:PreviewState):PreviewState=>JSON.parse(JSON.stringify(s));
describe('09 loan and midnight accounting',()=>{
 it('repays custom/full/last amounts and borrows free capital during any active phase without touching the course',()=>{
  let s=advancePreview(trip(),7*H);const a=s.active,initial=s.company!.balanceGrosze,profit=financialDays(s,0).profit;
  s=repayLoan(s,123456);expect(s.active).toBe(a);expect(s.company!.debtGrosze).toBe(1876544);
  s=drawLoan(s,123456);expect(s.active).toBe(a);expect(s.company!.balanceGrosze).toBe(initial);expect(s.company!.debtGrosze).toBe(2000000);expect(financialDays(s,0).profit).toBe(profit);expect(()=>drawLoan(s,1)).toThrow();
  s={...s,company:{...s.company!,balanceGrosze:3000000}};s=repayLoan(s,s.company!.debtGrosze);expect(s.company!.debtGrosze).toBe(0);s=drawLoan(s,17);s=repayLoan(s);expect(s.company!.debtGrosze).toBe(0);
  for(const n of [-1,0,1.5,2000001])expect(()=>drawLoan(s,n)).toThrow();
  s=planRest(s,s.time+1);s=advancePreview(s,s.time+1);expect(s.service?.kind).toBe('rest');expect(drawLoan(s,50000).service).toEqual(s.service);
 });
 it('charges current principal at midnight once, not capitalized, including multi-day jumps and reload',()=>{
  let s=repayLoan(ready(),100000);s=advancePreview(s,24*H-1);expect(s.events.filter(e=>e.message.startsWith('Odsetki'))).toHaveLength(0);
  s=advancePreview(clone(s),24*H);expect(s.events.at(-1)?.changeGrosze).toBe(-19000);expect(s.company!.debtGrosze).toBe(1900000);
  s=advancePreview(clone(s),24*H+1);expect(s.events.filter(e=>e.message.startsWith('Odsetki'))).toHaveLength(1);
  s=drawLoan(s,100000);s=advancePreview(s,72*H);expect(s.events.filter(e=>e.message.startsWith('Odsetki')).map(e=>e.changeGrosze)).toEqual([-19000,-20000,-20000]);
  let zero=ready();zero={...zero,company:{...zero.company!,balanceGrosze:3000000}};zero=repayLoan(zero,2000000);zero=advancePreview(zero,72*H);expect(zero.events.some(e=>e.message.startsWith('Odsetki'))).toBe(false);
 });
});
describe('09 driving and unpaid sleep',()=>{
 it('counts actual driving only, crosses 12/14/16 hours exactly, freezes real position for forced 15-hour sleep',()=>{
  let s=trip();s=advancePreview(s,6*H+load);expect(s.driverState!.drivingMs).toBe(0);
  s=advancePreview(s,18*H+load);expect(s.driverState!.drivingMs).toBe(12*H);expect(s.driverState!.satisfaction).toBe(100);
  s=advancePreview(s,20*H+load);expect(s.driverState!.satisfaction).toBe(96);
  s=advancePreview(s,22*H+load);expect(s.service?.kind).toBe('rest');expect(s.service!.end-s.service!.start).toBe(15*H);expect(s.driverState!.satisfaction).toBe(82);
  const pos=mapState(s,[]).vehicle!.coordinates,wages=s.paidWagesGrosze,progress=s.active!.phaseProgressMs;
  s=advancePreview(clone(s),s.time+15*H-1);expect(s.paidWagesGrosze).toBe(wages);expect(s.active!.phaseProgressMs).toBe(progress);expect(mapState(s,[]).vehicle!.coordinates).toEqual(pos);
  s=advancePreview(s,s.time+1);expect(s.driverState!.drivingMs).toBe(0);expect(s.service).toBeUndefined();
  s=advancePreview(s,s.time+4*H+load);expect(s.active).toBeNull();expect(s.paidWagesGrosze).toBe(20*2500);expect(s.events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
 });
 it('normal rest is 10h, preserves satisfaction, changes ETA, and cannot be moved after starting',()=>{
  let s=planRest(trip(),8*H);const id=s.stops![0].id,oldEta=projectPlan(trip()).eta!;
  s=moveStop(s,id,9*H);expect(s.stops![0].at).toBe(9*H);expect(projectPlan(s).eta).toBe(oldEta+10*H); // early normal rest still leaves >16h driving, so both sleeps are needed
  s=advancePreview(s,9*H);const satisfaction=s.driverState!.satisfaction,wages=s.paidWagesGrosze;
  expect(()=>moveStop(s,id,s.time+H)).toThrow();expect(()=>removeStop(s,id)).toThrow();s=advancePreview(s,19*H);expect(s.paidWagesGrosze).toBe(wages);expect(s.driverState!.drivingMs).toBe(0);expect(s.driverState!.satisfaction).toBe(satisfaction);
 });
 it('is step independent across wages, midnight, fatigue, sleep and serialized mid-trip states',()=>{
  const run=(step:number)=>{let s=trip();for(let t=s.time;t<44*H;){t=Math.min(44*H,t+step);s=advancePreview(s,t);s=clone(s)}return s};
  const a=run(38*H),b=run(170003);expect(b.company).toEqual(a.company);expect(b.driverState).toEqual(a.driverState);expect(b.van!.fuelMillilitres).toBe(a.van!.fuelMillilitres);expect(b.van!.mileageMeters).toBeCloseTo(a.van!.mileageMeters,5);expect(b.completedOfferIds).toEqual(['test']);expect(b.events.filter(e=>e.message.startsWith('Dostarczono'))).toHaveLength(1);
 });
 it('migrates an old save without losing company, wages, position or transport',()=>{
  const old=clone(advancePreview(trip(),7*H));delete (old as {driverState?:unknown}).driverState;delete (old as {activityLog?:unknown}).activityLog;
  const next=advancePreview(old,old.time+1);expect(next.company).toEqual(old.company);expect(next.driverState!.satisfaction).toBe(100);expect(next.active!.phaseProgressMs).toBe(old.active!.phaseProgressMs+1);expect(next.paidWagesGrosze).toBe(old.paidWagesGrosze);
 });
});
describe('09 planned refuelling',()=>{
 function fast(){const s=trip();return {...s,active:{...s.active!,routeLoaded:{...road,seconds:3600}}}}
 it('anchors 5–30km ahead, pauses 15min, charges and adds fuel once, delays ETA and survives reload',()=>{
  let s=advancePreview(fast(),6*H+load+60000),original=s;const eta=projectPlan(s).eta!;s=planFuel(s,s.time+60000,10);const stop=s.stops![0];expect(stop.coordinates).toBeDefined();expect(stop.progressMs).toBeGreaterThan(s.active!.phaseProgressMs);expect(projectPlan(s).eta).toBe(eta+15*60000);
  s=advancePreview(s,stop.at);expect(s.service?.kind).toBe('fuel');const pos=mapState(s,[]).vehicle!.coordinates,ml=s.van!.fuelMillilitres,balance=s.company!.balanceGrosze;
  expect(s.active!.phaseProgressMs/3600000*road.meters-original.active!.phaseProgressMs/3600000*road.meters).toBeGreaterThanOrEqual(5000);
  s=advancePreview(clone(s),stop.at+15*60000-1);expect(s.van!.fuelMillilitres).toBe(ml);expect(mapState(s,[]).vehicle!.coordinates).toEqual(pos);
  s=advancePreview(s,s.time+1);expect(s.van!.fuelMillilitres).toBe(ml+10000);expect(s.company!.balanceGrosze).toBe(balance-7500);expect(s.events.filter(e=>e.message.startsWith('Zatankowano'))).toHaveLength(1);
  s=advancePreview(clone(s),eta+15*60000);expect(s.active).toBeNull();expect(s.events.filter(e=>e.message.startsWith('Zatankowano'))).toHaveLength(1);
 });
 it('rejects unreachable stations and the last <5km, never drives with negative/free fuel',()=>{
  let s=advancePreview(fast(),6*H+load+60000);s={...s,van:{...s.van!,fuelMillilitres:1}};expect(()=>planFuel(s,s.time+1,10)).toThrow(/paliwa/);
  s=advancePreview(s,s.time+H);expect(s.haltedReason).toContain('Brak paliwa');expect(s.van!.fuelMillilitres).toBeGreaterThanOrEqual(0);const position=s.active!.phaseProgressMs;expect(advancePreview(s,s.time+H).active!.phaseProgressMs).toBe(position);
  s=advancePreview(fast(),6*H+load+58*60000);expect(()=>planFuel(s,s.time+1,10)).toThrow(/5 km/);
 });
 it('DO PEŁNA caps the tank and preserves exact costs with different steps',()=>{
  const start=advancePreview(fast(),6*H+load+60000),planned=planFuel(start,start.time+60000,null),end=projectPlan(planned).eta!;
  const run=(step:number)=>{let s=planned;while(s.time<end)s=advancePreview(clone(s),Math.min(end,s.time+step));return s};
  const a=run(end),b=run(17003);expect(b.company).toEqual(a.company);expect(b.van!.fuelMillilitres).toBe(a.van!.fuelMillilitres);expect(b.van!.fuelMillilitres).toBeLessThanOrEqual(80000);expect(b.events.filter(e=>e.message.startsWith('Zatankowano'))).toHaveLength(1);
 });
});
describe('09 boundary regressions',()=>{
 it('starts a station exactly at the road endpoint before unloading, without losing the stop',()=>{
  let s=trip();s={...s,active:{...s.active!,phase:'loaded',phaseProgressMs:0,routeLoaded:{...road,meters:6000,seconds:3600}}};
  s=planFuel(s,s.time+1,10);const p=s.stops![0];expect(p.progressMs).toBe(3600000);
  s=advancePreview(s,s.time+3600000);expect(s.service?.kind).toBe('fuel');expect(s.active!.phaseProgressMs).toBe(3600000);
  s=advancePreview(s,s.time+15*60000);expect(s.active!.phase).toBe('unloading');expect(s.events.filter(e=>e.message.startsWith('Zatankowano'))).toHaveLength(1);
 });
 it('does not create fuel or charge twice if funds disappear before the scheduled transaction',()=>{
  let s=trip();s={...s,active:{...s.active!,phase:'loaded',phaseProgressMs:0,routeLoaded:{...road,seconds:3600}}};s=planFuel(s,s.time+1,10);s=advancePreview(s,s.stops![0].at);const before=s.van!.fuelMillilitres;
  s={...s,company:{...s.company!,balanceGrosze:0}};s=advancePreview(s,s.service!.end);expect(s.van!.fuelMillilitres).toBe(before);expect(s.stops![0].status).toBe('failed');expect(s.events.filter(e=>e.message.startsWith('Zatankowano'))).toHaveLength(0);expect(s.company!.balanceGrosze).toBe(0);
 });
 it('rejects past placement and lets a future stop be removed without affecting the active route',()=>{
  let s=trip();expect(()=>planRest(s,s.time)).toThrow();s=planRest(s,s.time+H);expect(()=>moveStop(s,s.stops![0].id,s.time-1)).toThrow();const job=s.active;s=removeStop(s,s.stops![0].id);expect(s.active).toBe(job);expect(s.stops).toEqual([]);
 });
});
