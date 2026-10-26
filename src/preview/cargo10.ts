import type {PreviewOffer,PreviewState,TransportRoute} from './gameplay';
import {dispatchTransport} from './gameplay';
import {dispatchReadiness} from './dispatchReadiness';
export interface CargoUnits {kind:'paczka'|'karton'|'europaleta'|'legacy';count:number}
export interface CargoProgress {picked:number;delivered:number}
export interface BatchPart {orderId:string;offer:PreviewOffer;offset:number;count:number}
export interface Load {grams:number;litres:number;pallets:number}
export const ZERO:Load={grams:0,litres:0,pallets:0};
export function units(o:PreviewOffer):CargoUnits {
 if(o.units){if(!['paczka','karton','europaleta','legacy'].includes(o.units.kind)||!Number.isSafeInteger(o.units.count)||o.units.count<1||(o.units.kind==='europaleta'?o.units.count!==o.pallets:o.pallets!==0))throw Error('Niespójne jednostki ładunku.');return o.units}
 return o.pallets?{kind:'europaleta',count:o.pallets}:{kind:'legacy',count:1};
}
export function unitLabel(o:PreviewOffer){const u=units(o);return u.kind==='legacy'?'partia historyczna (liczba paczek nieznana)':u.kind}
// Whole grams/litres are allocated by consecutive ordinal ranges. Last unit owns the remainder.
export function portion(o:PreviewOffer,offset:number,count:number):Load {
 const n=units(o).count;if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(count)||offset<0||count<0||offset+count>n)throw Error('Niepoprawna liczba całych jednostek.');
 const share=(total:number)=>Math.floor(total*(offset+count)/n)-Math.floor(total*offset/n);
 return {grams:share(Math.round(o.massKg*1000)),litres:share(Math.round(o.volumeM3*1000)),pallets:units(o).kind==='europaleta'?count:0};
}
export function sumLoads(loads:readonly Load[]):Load{return loads.reduce((a,b)=>({grams:a.grams+b.grams,litres:a.litres+b.litres,pallets:a.pallets+b.pallets}),{...ZERO})}
export function capacity(s:PreviewState):Load{return {grams:(s.van?.specs?.capacityKg??1200)*1000,litres:(s.van?.specs?.volumeM3??12)*1000,pallets:s.van?.specs?.pallets??4}}
export function capacityErrors(s:PreviewState,l:Load):string[]{const c=capacity(s);return [l.grams>c.grams?'Przekroczona masa (kg).':'',l.litres>c.litres?'Przekroczona objętość (m³).':'',l.pallets>c.pallets?'Brak miejsc na europalety.':''].filter(Boolean)}
export function progress(s:PreviewState,o:PreviewOffer):CargoProgress {
 const order=s.market?.orders.find(v=>v.offer.id===o.id);if(order?.cargoProgress)return order.cargoProgress;
 const total=units(o).count;if(order?.completedAt!==null&&order?.completedAt!==undefined||s.completedOfferIds.includes(o.id))return {picked:total,delivered:total};
 // Only the saved current loaded/unloading phase proves stock on board. No invented history.
 const batch=s.active?.batch?.find(p=>p.orderId===o.id);if(batch&&s.active&&['loaded','unloading'].includes(s.active.phase))return {picked:batch.offset+batch.count,delivered:batch.offset};
 const proven=s.active&&!s.active.emptyOnly&&!s.active.batch&&s.active.offer.id===o.id&&['loaded','unloading'].includes(s.active.phase);
 return {picked:proven?total:0,delivered:0};
}
export function migrateCargo(s:PreviewState):PreviewState {
 if(!s.market||s.market.orders.every(o=>o.cargoProgress))return s;
 return {...s,market:{...s.market,orders:s.market.orders.map(o=>o.cargoProgress?o:{...o,cargoProgress:progress(s,o.offer)})}};
}
export function onboard(s:PreviewState):BatchPart[]{
 if(!s.active||s.active.emptyOnly||!['loaded','unloading'].includes(s.active.phase))return [];
 return s.active.batch?[...s.active.batch]:[{orderId:s.active.offer.id,offer:s.active.offer,offset:0,count:units(s.active.offer).count}];
}
export function heldLoad(s:PreviewState){return sumLoads(onboard(s).map(p=>portion(p.offer,p.offset,p.count)))}
export function reserved(s:PreviewState,id:string){return s.active?.batch&&['empty','loading'].includes(s.active.phase)?s.active.batch.filter(p=>p.orderId===id).reduce((n,p)=>n+p.count,0):0}
export function maximumUnits(s:PreviewState,o:PreviewOffer){
 const p=progress(s,o),remaining=units(o).count-p.picked;let lo=0,hi=remaining;
 while(lo<hi){const m=Math.ceil((lo+hi)/2);if(capacityErrors(s,sumLoads([heldLoad(s),portion(o,p.picked,m)])).length)hi=m-1;else lo=m}return lo;
}
export function chunkOffer(o:PreviewOffer,offset:number,count:number):PreviewOffer {const l=portion(o,offset,count);return {...o,units:undefined,massKg:l.grams/1000,volumeM3:l.litres/1000,pallets:l.pallets}}
export interface Selection {orderId:string;count:number}
export function batchPreview(s:PreviewState,selections:readonly Selection[]){
 const errors:string[]=[],parts:BatchPart[]=[];const ids=new Set<string>();
 for(const selection of selections){const order=s.market?.orders.find(o=>o.offer.id===selection.orderId&&o.completedAt===null);
  if(!order||ids.has(selection.orderId)){errors.push('Nieznane, zakończone lub powtórzone zlecenie.');continue}ids.add(selection.orderId);
  const p=progress(s,order.offer);if(!Number.isSafeInteger(selection.count)||selection.count<1||selection.count>units(order.offer).count-p.picked){errors.push(`Niepoprawna ilość dla ${selection.orderId}.`);continue}
  parts.push({orderId:selection.orderId,offer:order.offer,offset:p.picked,count:selection.count});
 }
 if(!parts.length)errors.push('Wybierz co najmniej jedną jednostkę.');
 if(parts.some(p=>p.offer.fromCityId!==parts[0].offer.fromCityId||p.offer.toCityId!==parts[0].offer.toCityId))errors.push('Łączenie wymaga wspólnego miasta odbioru i dostawy. Planer wielopunktowy nie jest jeszcze dostępny.');
 const load=sumLoads([heldLoad(s),...parts.map(p=>portion(p.offer,p.offset,p.count))]);errors.push(...capacityErrors(s,load));return {parts,load,errors};
}
export function orderReadiness(s:PreviewState,o:PreviewOffer,routes:readonly TransportRoute[]){
 if(s.active||s.service||!s.van||s.driverHiredAt===null||s.haltedReason)return dispatchReadiness(s,chunkOffer(o,0,1),routes);
 const count=maximumUnits(s,o);if(count<1)return capacityErrors(s,portion(o,progress(s,o).picked,Math.min(1,units(o).count-progress(s,o).picked))).join(' ')||'Wszystkie jednostki już odebrano.';
 return dispatchReadiness(s,chunkOffer(o,progress(s,o).picked,count),routes);
}
export function startBatch(state:PreviewState,selections:readonly Selection[],routes:readonly TransportRoute[]):PreviewState {
 const s=migrateCargo(state),preview=batchPreview(s,selections);if(preview.errors.length)throw Error(preview.errors.join(' '));
 const first=preview.parts[0].offer,loaded=routes.find(r=>r.fromCityId===first.fromCityId&&r.toCityId===first.toCityId);if(!loaded||!s.van)throw Error('Brak zatwierdzonej trasy lub samochodu.');
 const empty=s.van.cityId===first.fromCityId?{id:'stationary',fromCityId:s.van.cityId,toCityId:s.van.cityId,meters:0,seconds:0,geometry:[loaded.geometry[0]]}:routes.find(r=>r.fromCityId===s.van!.cityId&&r.toCityId===first.fromCityId);if(!empty)throw Error('Brak zatwierdzonego dojazdu pustego.');
 const cargo={...first,units:undefined,massKg:preview.load.grams/1000,volumeM3:preview.load.litres/1000,pallets:preview.load.pallets};
 const next=dispatchTransport(s,cargo,empty,loaded);return {...next,active:{...next.active!,batch:preview.parts}};
}
export function loadBatch(s:PreviewState):PreviewState {
 const a=s.active;if(!a?.batch)return s;if(capacityErrors(s,sumLoads(a.batch.map(p=>portion(p.offer,p.offset,p.count)))).length)throw Error('Partie przekraczają pojemność samochodu.');if(s.van?.cityId!==a.offer.fromCityId)throw Error('Załadunek poza miastem odbioru.');
 let next=migrateCargo(s);for(const p of a.batch){const order=next.market!.orders.find(o=>o.offer.id===p.orderId)!;if(order.cargoProgress!.picked!==p.offset)throw Error('Jednostki zostały już odebrane.');next={...next,market:{...next.market!,orders:next.market!.orders.map(o=>o.offer.id===p.orderId?{...o,cargoProgress:{...o.cargoProgress!,picked:o.cargoProgress!.picked+p.count}}:o)}}}return next;
}
export function unloadBatch(s:PreviewState):PreviewState {
 const a=s.active!;if(!a.batch||s.van?.cityId!==a.offer.toCityId)throw Error('Rozładunek poza miastem dostawy.');
 let next=migrateCargo(s);
 for(const p of a.batch){const order=next.market!.orders.find(o=>o.offer.id===p.orderId)!;const old=order.cargoProgress!;if(old.picked-old.delivered<p.count)throw Error('Brak jednostek do rozładunku.');const delivered=old.delivered+p.count,done=delivered===units(order.offer).count;
  next={...next,market:{...next.market!,orders:next.market!.orders.map(o=>o.offer.id===p.orderId?{...o,cargoProgress:{...old,delivered},completedAt:done?s.time:null}:o)}};
  const paid=done&&!next.completedOfferIds.includes(p.orderId),value=paid?order.offer.payoutGrosze:0;
  next={...next,company:{...next.company!,balanceGrosze:next.company!.balanceGrosze+value},completedOfferIds:paid?[...next.completedOfferIds,p.orderId]:next.completedOfferIds,events:[...next.events,{id:`preview:${next.events.length+1}`,at:s.time,message:paid?`Dostarczono ${order.offer.cargo}.`:`Dostarczono część ${p.orderId}: ${p.count} jednostek.`,changeGrosze:value}]};
 }return next;
}
