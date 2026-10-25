import type {PreviewState} from './gameplay';
import {capacity,heldLoad,onboard,unitLabel,type Load} from './cargo10';
import {VehicleArt} from './BaseParking';
import {CargoPixel} from './PixelSprites';
import {cityName} from './interfaceModel';
export const quantity=(n:number)=>n.toLocaleString('pl-PL',{maximumFractionDigits:3});
export function LoadBars({state,load,considered}:{state:PreviewState;load:Load;considered?:Load}){
 const c=capacity(state);return <div className="pc-load-bars">{([{key:'grams',label:'Masa',unit:'kg',scale:1000},{key:'litres',label:'Objętość',unit:'m³',scale:1000},{key:'pallets',label:'Miejsca paletowe',unit:'palet',scale:1}] as const).map(({key,label,unit,scale})=>{
 const used=load[key],limit=c[key],color=considered&&considered[key]>limit?'#e26666':used>=limit*.85?'#e9a644':'#54c77b';
 return <div key={key} data-testid={`load-${key}`}><strong>{label}: {quantity(used/scale)} / {quantity(limit/scale)} {unit}</strong><meter aria-label={label} min={0} max={limit||1} value={Math.min(used,limit)} style={{color}}/><small>Wolne: {quantity(Math.max(0,limit-used)/scale)} {unit}{considered&&considered[key]>limit?` · Nie mieści się: nadmiar ${quantity((considered[key]-limit)/scale)} ${unit}`:''}</small></div>})}</div>
}
export function CargoHold({state}:{state:PreviewState}){
 const contents=onboard(state);return <section aria-label="Ładownia" className="pc-cargo-hold"><h2>ŁADOWNIA · {state.van?.specs?.model??'Furgon'}</h2>{state.van?.specs&&<VehicleArt offer={state.van.specs}/>}<LoadBars state={state} load={heldLoad(state)}/><p>Faktycznie na pokładzie — towar trafia tu po zakończeniu załadunku i pozostaje do końca rozładunku.</p>{!contents.length?<p>Ładownia pusta.</p>:<ul>{contents.map(p=><li key={p.orderId} data-testid="onboard-cargo"><CargoPixel cargo={p.offer.cargo}/><strong>{p.offer.cargo}</strong> · {p.count} × {unitLabel(p.offer)}<br/>Zlecenie {p.orderId} · Rozładunek: {cityName(p.offer.toCityId)}</li>)}</ul>}</section>
}
