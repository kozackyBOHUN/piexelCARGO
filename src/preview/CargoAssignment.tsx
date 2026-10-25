import {useState} from 'react';
import type {PreviewState,TransportRoute} from './gameplay';
import {batchPreview,maximumUnits,progress,units,unitLabel,startBatch,portion} from './cargo10';
import {LoadBars,quantity} from './CargoHold';
import {cityName} from './interfaceModel';
export function CargoAssignment({state,orderId,routes,onCommand,onClose}:{state:PreviewState;orderId:string;routes:readonly TransportRoute[];onCommand:(fn:(s:PreviewState)=>PreviewState)=>boolean;onClose:()=>void}){
 const [counts,setCounts]=useState<Record<string,number>>(()=>{const o=state.market!.orders.find(o=>o.offer.id===orderId)!;return {[orderId]:maximumUnits(state,o.offer)}});
 const main=state.market!.orders.find(o=>o.offer.id===orderId)!;
 const candidates=state.market!.orders.filter(o=>o.completedAt===null&&o.offer.fromCityId===main.offer.fromCityId&&o.offer.toCityId===main.offer.toCityId);
 const selections=Object.entries(counts).filter(([,n])=>n!==0).map(([orderId,count])=>({orderId,count})),plan=batchPreview(state,selections);
 return <section className="pc-assignment" aria-label="Przydziel samochód"><h2>Wybierz pojazd i partie ładunku</h2><label>Samochód<select aria-label="Samochód do zlecenia"><option>{state.van?.specs?.model??'Furgon 01'}</option></select></label><p>{cityName(main.offer.fromCityId)} → {cityName(main.offer.toCityId)}. Łączenie przyjętych zleceń z tym samym odbiorem i dostawą. Inne kierunki wymagają osobnego kursu; planer wielopunktowy nie jest dostępny.</p>
 {candidates.map(o=><label key={o.offer.id}>{o.offer.id} · {o.offer.cargo} · {unitLabel(o.offer)}<input aria-label={`Jednostki ${o.offer.id}`} type="number" min="0" max={units(o.offer).count-progress(state,o.offer).picked} step="1" value={counts[o.offer.id]??0} onChange={e=>setCounts(v=>({...v,[o.offer.id]:Number(e.target.value)}))}/><small>Jednostka: {quantity(portion(o.offer,0,1).grams/1000)} kg · {quantity(portion(o.offer,0,1).litres/1000)} m³ · {portion(o.offer,0,1).pallets} miejsc paletowych. Różnice zaokrągleń rozliczane w sumie partii.</small><small>Pozostało do odebrania: {units(o.offer).count-progress(state,o.offer).picked} · Mieści się pojedynczo do {maximumUnits(state,o.offer)} jednostek.</small></label>)}
 <LoadBars state={state} load={plan.load} considered={plan.load}/>{plan.errors.length>0&&<p role="status" className="pc-block-reason">{plan.errors.join(' ')}</p>}<p>Przydział rezerwuje całe jednostki. Załadunek nastąpi po dojeździe i 15 minutach pracy; wynagrodzenie dopiero po dostarczeniu całego zlecenia.</p><button disabled={plan.errors.length>0||!!state.active||!!state.service} onClick={()=>{if(onCommand(s=>startBatch(s,selections,routes)))onClose()}}>ROZPOCZNIJ KURS</button><button onClick={onClose}>Anuluj</button></section>
}
