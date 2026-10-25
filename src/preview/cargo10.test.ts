import {describe,it,expect} from 'vitest';
import {createPreviewState,establishCompany,buyUsedVan,hireDriver,advancePreview,startEmptyTrip,makeUsedVanMarket,type PreviewState,type PreviewOffer,type TransportRoute} from './gameplay';
import {ensureMarket,acceptOrder,startOrder} from './market';
import {units,portion,sumLoads,heldLoad,capacity,capacityErrors,startBatch,batchPreview,progress,reserved,migrateCargo,maximumUnits,onboard} from './cargo10';
const H=3600000,K='geonames:3094802',T='geonames:757026',Z='geonames:3080866';
const route=(a:string,b:string):TransportRoute=>({id:`test:${a}:${b}`,fromCityId:a,toCityId:b,meters:1000,seconds:60,geometry:a===K?[[19.9324,50.0605],[20.987,50.0138]]:[[20.987,50.0138],[19.9324,50.0605]]});
const routes=[route(K,T),route(T,K),route(K,Z),route(Z,K)];
const offer=(id:string,count=8):PreviewOffer=>({id,fromCityId:K,toCityId:T,cargo:'Książki',units:{kind:'europaleta',count},massKg:count*100,volumeM3:count*1.2,pallets:count,payoutGrosze:80000,expiresAt:5*86400000});
function ready(offers=[offer('a')]):PreviewState{let s=establishCompany(createPreviewState(6*H),'Ładunki',K);s=hireDriver(buyUsedVan(s,'van-used-1'));s=ensureMarket(s,routes);return {...s,market:{...s.market!,offers}}}
const restore=(s:PreviewState):PreviewState=>JSON.parse(JSON.stringify(s));
const finish=(s:PreviewState)=>advancePreview(s,s.time+H);
function returnHome(s:PreviewState){return advancePreview(startEmptyTrip(s,K,routes),s.time+60000)}
describe('10 units and independent capacity',()=>{
 it('uses all five original vehicle capacities, independently accepts exact limits and rejects each overrun',()=>{
  for(const specs of makeUsedVanMarket('Ładunki',K)){
   const s={...ready(),van:{...ready().van!,specs}},c=capacity(s);expect(capacityErrors(s,c)).toEqual([]);
   for(const key of ['grams','litres','pallets'] as const){const excess={...c,[key]:c[key]+1};expect(capacityErrors(s,excess)).toHaveLength(1)}
  }
 });
 it('preserves independent unit metrics and exact totals under arbitrary whole-unit partitioning',()=>{
  const o={...offer('q',8),massKg:803.007,volumeM3:9.607};const parts=[portion(o,0,3),portion(o,3,3),portion(o,6,2)];expect(sumLoads(parts)).toEqual({grams:803007,litres:9607,pallets:8});expect(portion(o,0,1).grams).not.toBe(1000000);expect(()=>portion(o,0,1.5)).toThrow();
  const packages={...o,pallets:0,units:{kind:'karton' as const,count:40}};expect(portion(packages,0,40).pallets).toBe(0);expect(portion(packages,0,40).grams).toBe(803007);
 });
 it('keeps all ten goods and existing accepted prices, generates deterministic physical units',()=>{
  const s=ensureMarket({...ready(),market:undefined},routes);expect(new Set(s.market!.offers.map(o=>o.cargo)).size).toBe(10);
  for(const o of s.market!.offers){const u=units(o);expect(u.count).toBeGreaterThan(0);expect(portion(o,0,u.count)).toEqual({grams:Math.round(o.massKg*1000),litres:Math.round(o.volumeM3*1000),pallets:o.pallets})}
  const r=acceptOrder(ready(),'a');expect(r.market!.orders[0].offer.payoutGrosze).toBe(80000);
 });
});
describe('10 physical loads and partial deliveries',()=>{
 it('reserves then loads only after arrival/handling; makes three trips for eight pallets and pays once at the end',()=>{
  let s=acceptOrder(ready(),'a');expect(maximumUnits(s,s.market!.orders[0].offer)).toBe(3);
  for(const count of [3,3,2]){
   const before=progress(s,s.market!.orders[0].offer).delivered;s=startOrder(s,'a',routes);
   expect(reserved(s,'a')).toBe(count);expect(onboard(s)).toHaveLength(0);expect(()=>startOrder(s,'a',routes)).toThrow(/w trasie/);
   s=advancePreview(s,s.time+15*60000-1);expect(heldLoad(s).grams).toBe(0);
   s=advancePreview(restore(s),s.time+1);expect(heldLoad(s).pallets).toBe(count);expect(progress(s,s.market!.orders[0].offer)).toEqual({picked:before+count,delivered:before});expect(reserved(s,'a')).toBe(0);
   const loaded=restore(s);s=advancePreview(s,s.time+60000);expect(s.active!.phase).toBe('unloading');expect(heldLoad(s).pallets).toBe(count);s=finish(s);expect(heldLoad(s).pallets).toBe(0);expect(progress(s,s.market!.orders[0].offer).delivered).toBe(before+count);
   expect(s.events.filter(e=>e.message.startsWith('Dostarczono')&&e.changeGrosze>0)).toHaveLength(before+count===8?1:0);
   const replay=finish(loaded);expect(replay.market!.orders[0].cargoProgress).toEqual(s.market!.orders[0].cargoProgress);
   if(before+count<8){expect(s.market!.orders[0].completedAt).toBeNull();s=returnHome(s)}
  }
  expect(s.completedOfferIds).toEqual(['a']);expect(s.events.filter(e=>e.changeGrosze===80000)).toHaveLength(1);expect(()=>startOrder(s,'a',routes)).toThrow();expect(advancePreview(restore(s),s.time+H).events.filter(e=>e.changeGrosze===80000)).toHaveLength(1);
 });
 it('charges 50% of only the undelivered fraction once after a partial on-time delivery',()=>{
  let s=acceptOrder(ready(),'a');s={...s,market:{...s.market!,orders:s.market!.orders.map(o=>({...o,deadline:s.time+2*H}))}};
  s=finish(startOrder(s,'a',routes,3));const deadline=s.market!.orders[0].deadline;s=advancePreview(s,deadline);expect(s.market!.orders[0].penalized).toBe(false);
  s=advancePreview(restore(s),deadline+1);expect(s.market!.orders[0].penaltyGrosze).toBe(25000);s=advancePreview(restore(s),s.time+H);expect(s.events.filter(e=>e.message.startsWith('Kara'))).toHaveLength(1);
 });
 it('combines different goods on one real corridor, sums each constraint and settles each completed order once',()=>{
  const a={...offer('a',2),massKg:200,volumeM3:2},b={...offer('b',1),cargo:'Odzież',massKg:50,volumeM3:1,pallets:0,units:{kind:'paczka' as const,count:10}};
  let s=acceptOrder(acceptOrder(ready([a,b]),'a'),'b');s=startBatch(s,[{orderId:'a',count:2},{orderId:'b',count:5}],routes);s=advancePreview(s,s.time+15*60000);expect(heldLoad(s)).toEqual({grams:225000,litres:2500,pallets:2});expect(onboard(s)).toHaveLength(2);
  s=finish(restore(s));expect(s.completedOfferIds).toEqual(['a']);expect(progress(s,b)).toEqual({picked:5,delivered:5});s=returnHome(s);s=finish(startOrder(s,'b',routes));expect(new Set(s.completedOfferIds)).toEqual(new Set(['a','b']));expect(s.events.filter(e=>e.changeGrosze===80000)).toHaveLength(2);
 });
 it('rejects a combined overrun, repeated selection, fractional pallet and incompatible cities without reserving stock',()=>{
  const a=offer('a',3),b=offer('b',3),c={...offer('c',1),toCityId:Z};let s=ready([a,b,c]);for(const o of [a,b,c])s=acceptOrder(s,o.id);
  for(const selections of [[{orderId:'a',count:2},{orderId:'b',count:2}],[{orderId:'a',count:1},{orderId:'a',count:1}],[{orderId:'a',count:1.5}],[{orderId:'a',count:1},{orderId:'c',count:1}]])expect(()=>startBatch(s,selections,routes)).toThrow();
  expect(s.active).toBeNull();expect(progress(s,a)).toEqual({picked:0,delivered:0});expect(batchPreview(s,[{orderId:'a',count:4}]).errors.length).toBeGreaterThan(0);
 });
 it('drives to the pickup with an empty hold, never materializes cargo in the wrong city',()=>{
  let s=acceptOrder(ready(),'a');s={...s,van:{...s.van!,cityId:T}};s=startOrder(s,'a',routes,1);expect(heldLoad(s).grams).toBe(0);s=advancePreview(s,s.time+60000);expect(s.van!.cityId).toBe(K);expect(s.active!.phase).toBe('loading');expect(heldLoad(s).grams).toBe(0);s=advancePreview(s,s.time+15*60000);expect(heldLoad(s).pallets).toBe(1);
 });
 it('keeps fuel, inventory, wages and payment identical over reloads and fine/coarse steps',()=>{
  const initial=startOrder(acceptOrder(ready(),'a'),'a',routes,3),end=initial.time+31*60000;
  const run=(step:number)=>{let s=initial;while(s.time<end)s=advancePreview(restore(s),Math.min(end,s.time+step));return s};
  const a=run(H),b=run(17003);expect(b.market).toEqual(a.market);expect(b.company).toEqual(a.company);expect(b.van!.fuelMillilitres).toBe(a.van!.fuelMillilitres);expect(b.van!.mileageMeters).toBeCloseTo(a.van!.mileageMeters,6);expect(b.paidWagesGrosze).toBe(a.paidWagesGrosze);
 });
 it('migrates only proven current cargo, preserves legacy totals/prices, and invents no historical packages',()=>{
  const old={...offer('a',1),units:undefined,pallets:0,massKg:333,volumeM3:2.5};let s=acceptOrder(ready([old]),'a');const order=s.market!.orders[0];s={...s,market:{...s.market!,orders:[{...order,cargoProgress:undefined}]}};
  expect(units(old)).toEqual({kind:'legacy',count:1});expect(migrateCargo(s).market!.orders[0].cargoProgress).toEqual({picked:0,delivered:0});
  const active={offer:old,routeEmpty:{...routes[0],toCityId:K,meters:0,seconds:0},routeLoaded:routes[0],phase:'loaded' as const,phaseProgressMs:1000,startedAt:s.time-901000};s={...s,active};const migrated=migrateCargo(s);expect(migrated.market!.orders[0].cargoProgress).toEqual({picked:1,delivered:0});expect(heldLoad(migrated)).toEqual({grams:333000,litres:2500,pallets:0});expect(migrated.market!.orders[0].offer.payoutGrosze).toBe(80000);expect(migrateCargo(migrated)).toBe(migrated);
 });
});
