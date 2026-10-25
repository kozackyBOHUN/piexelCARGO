import { useEffect, useState } from 'react';
import { listUsedVans, type PreviewState, type UsedVanOffer } from './gameplay';
import { DriverPortrait } from './PixelSprites';

type Building = 'parking'|'kadry'|'spedycja'|'warsztat'|'magazyn'|'paliwo'|'hotel';
type GarageTab = 'flota'|'dealer'|'gielda';
interface Props {
  state: PreviewState;
  cityName: string;
  onBuy: (id: string) => void;
  onHire: () => void;
  onShowMap: () => void;
  money: (grosze: number) => string;
}
const BUILDINGS: {id: Building; name: string; x: number; y: number; variant: number}[] = [
  {id:'parking',name:'PARKING',x:11,y:47,variant:0},
  {id:'kadry',name:'KADRY',x:41,y:12,variant:1},
  {id:'spedycja',name:'SPEDYCJA',x:66,y:20,variant:2},
  {id:'warsztat',name:'WARSZTAT',x:70,y:59,variant:3},
  {id:'magazyn',name:'MAGAZYN',x:33,y:63,variant:4},
  {id:'paliwo',name:'STACJA',x:7,y:10,variant:5},
  {id:'hotel',name:'HOTEL',x:83,y:5,variant:6},
];
/** SVG is deliberately composed of hard-edge blocks, not stock photographs. */
export function PixelBuilding({variant, lit}: {variant:number;lit:boolean}) {
  if(variant===0)return <svg className="pv-building-art" viewBox="0 0 180 120" shapeRendering="crispEdges" aria-hidden="true">
    <polygon points="4,48 103,8 174,48 74,107" fill="#323f49" stroke="#7b8b94" strokeWidth="3"/>
    <polygon points="20,52 101,19 159,51 77,89" fill="#525d5e"/>
    <path d="M36 53 L47 48 M58 44 L70 40 M82 36 L95 32 M101 73 L111 69 M123 64 L135 60" stroke="#d8c39a" strokeWidth="5"/>
    <g transform="translate(56 47)"><rect x="0" y="9" width="67" height="21" fill="#1c2930"/><rect x="5" y="2" width="38" height="22" fill="#c68d4c"/><rect x="13" y="6" width="17" height="8" fill="#b8d7d4"/><rect x="46" y="13" width="15" height="12" fill="#d3a66a"/><rect x="10" y="28" width="12" height="10" fill="#131a20"/><rect x="51" y="28" width="12" height="10" fill="#131a20"/></g>
    <rect x="10" y="39" width="6" height="27" fill="#a18b66"/><rect x="150" y="39" width="6" height="28" fill="#a18b66"/>
    {lit&&<rect x="141" y="17" width="23" height="14" fill="#f5c46d"/>}
  </svg>;
  const tall=variant===6, wide=variant===4;
  return <svg className="pv-building-art" viewBox="0 0 180 120" shapeRendering="crispEdges" aria-hidden="true">
    <polygon points="6,79 87,35 170,71 86,117" fill="#263440"/>
    <polygon points={wide?"25,48 99,9 164,47 88,85":"35,45 97,16 150,44 89,76"} fill={lit?'#856648':'#67707b'}/>
    <polygon points={wide?"25,48 25,81 88,113 88,85":"35,45 35,87 89,113 89,76"} fill={lit?'#ad875a':'#4c5a66'}/>
    <polygon points={wide?"88,85 164,47 164,79 88,113":"89,76 150,44 150,83 89,113"} fill={lit?'#765a46':'#333f49'}/>
    <polygon points={wide?"25,48 99,9 164,47 88,85":"35,45 97,16 150,44 89,76"} fill="none" stroke="#a0aab0" strokeWidth="3"/>
    <path d={wide?"M57 64 L120 32":"M57 58 L117 29"} stroke="#374451" strokeWidth="4"/>
    {Array.from({length:tall?3:2},(_,i)=><g key={i} transform={`translate(${tall?55+i*22:50+i*30} ${tall?53:60})`}><rect width="13" height="15" fill="#1b2c37"/><rect x="2" y="2" width="9" height="9" fill={lit?'#f7c36c':'#70838b'}/></g>)}
    <rect x="112" y="73" width="22" height="20" fill="#1d2932"/><path d="M111 75 L134 75" stroke="#99a6ab" strokeWidth="3"/>
    <rect x="84" y="17" width="30" height="10" fill={lit?'#deb978':'#89939a'}/>
    <rect x="18" y="86" width="7" height="16" fill="#505f5a"/>
  </svg>;
}
export function VehiclePixel({color='#bfa36d',quality=55}: {color?:string;quality?:number}) {
  const rust=quality<35;
  return <svg viewBox="0 0 188 84" className="pv-van-art" shapeRendering="crispEdges" role="img" aria-label="Furgon pixelart">
    <rect x="10" y="69" width="171" height="8" fill="#1a242a"/>
    <rect x="14" y="55" width="166" height="10" fill="#53616c"/>
    <rect x="23" y="31" width="102" height="30" fill={color}/>
    <rect x="31" y="25" width="87" height="8" fill={rust?'#9e6a51':'#e0bc82'}/>
    <rect x="119" y="39" width="24" height="21" fill={color}/>
    <polygon points="126,31 152,31 168,46 168,62 126,62" fill={color}/>
    <rect x="146" y="36" width="14" height="12" fill="#acc9d3"/>
    <rect x="172" y="53" width="6" height="10" fill="#f2cf77"/>
    <rect x="22" y="57" width="6" height="7" fill="#b7544b"/>
    <rect x="43" y="58" width="8" height="7" fill="#444e51"/><rect x="138" y="58" width="8" height="7" fill="#444e51"/>
    <rect x="36" y="57" width="28" height="13" fill="#141e25"/><rect x="132" y="57" width="28" height="13" fill="#141e25"/>
    <rect x="42" y="61" width="17" height="17" fill="#151f26"/><rect x="138" y="61" width="17" height="17" fill="#151f26"/>
    <rect x="47" y="65" width="7" height="9" fill="#a2afb3"/><rect x="143" y="65" width="7" height="9" fill="#a2afb3"/>
    <rect x="35" y="39" width="80" height="3" fill={rust?'#a16145':'#e9d2a5'}/>
    {rust&&<><rect x="40" y="48" width="16" height="5" fill="#90583a"/><rect x="85" y="51" width="7" height="7" fill="#90583a"/></>}
    <rect x="12" y="80" width="175" height="3" fill="#39434c"/>
  </svg>;
}
function OfferCard({offer,canPay,owned,onBuy,money}: {
  offer:UsedVanOffer;canPay:boolean;owned:boolean;onBuy:(id:string)=>void;money:(g:number)=>string;
}){
  const worn=offer.conditionPercent<35;
  return <article className="pv-car-card">
    <div className="pv-car-graphic">
      <VehiclePixel color={offer.color} quality={offer.conditionPercent}/>
      <span className={worn?'pv-condition-warn':'pv-condition-good'}>{worn?'DO REMONTU':offer.conditionPercent>85?'ZADBANY':'UŻYWANY'}</span>
    </div>
    <div className="pv-car-info">
      <strong>{offer.model}</strong>
      <span className="pv-car-sub">DIESEL {offer.engineLitres.toFixed(1)} L · {offer.horsepower} KM</span>
      <div className="pv-car-facts">
        <span>Przebieg <b>{(offer.mileageMeters/1000).toLocaleString('pl-PL')} km</b></span>
        <span>Stan <b>{offer.conditionPercent}%</b></span>
        <span>Ładowność <b>{offer.capacityKg} kg</b></span>
        <span>Przestrzeń <b>{offer.volumeM3} m³</b></span>
        <span>Spalanie <b>{offer.loadedLitresPer100Km} l/100</b></span>
      </div>
      <div className="pv-car-condition"><div style={{width:`${offer.conditionPercent}%`,background:offer.conditionPercent<35?'#d97a59':'#8fbf92'}}/></div>
      <div className="pv-car-purchase"><strong>{money(offer.priceGrosze)}</strong>
        <button disabled={!canPay||owned} onClick={()=>onBuy(offer.id)}>{owned?'PARKING ZAJĘTY':canPay?'KUP POJAZD':'BRAK ŚRODKÓW'}</button>
      </div>
    </div>
  </article>;
}
export function BaseParking({state,cityName,onBuy,onHire,onShowMap,money}:Props){
  const [building,setBuilding]=useState<Building|null>(null);
  const [tab,setTab]=useState<GarageTab>('flota');
  const parkingReady=!!state.van;
  const driverReady=state.driverHiredAt!==null;
  useEffect(()=>{if(parkingReady)setTab('flota');},[parkingReady]);
  const isUnlocked=(b:Building)=>b==='parking'||b==='kadry'&&parkingReady||b==='spedycja'&&driverReady;
  const available=listUsedVans(state);
  const tutorial= !parkingReady ? 'KROK 1/3 · Wybierz PARKING, następnie GIEŁDA i kup pierwszy furgon.' :
    !driverReady ? 'KROK 2/3 · Pojazd zakupiony! Kliknij budynek KADRY i zatrudnij kierowcę.' :
    'KROK 3/3 · Załoga gotowa! Kliknij SPEDYCJA i przyjmij pierwszy transport.';
  return <div className="pv-base-root">
    <div className="pv-tutorial"><span className="pv-tutorial-led"/> <strong>SAMOUCZEK</strong><span>{tutorial}</span></div>
    <div className="pv-base-heading"><div><span>BAZA POZIOM 1 · {cityName.toUpperCase()}</span><strong>{state.company?.name}</strong></div>
      <span className="pv-base-hint">KLIKNIJ BUDYNEK, ABY OTWORZYĆ JEGO OPCJE</span></div>
    <div className="pv-base-yard" role="group" aria-label="Interaktywna baza firmy">
      <div className="pv-yard-grid"/>
      <div className="pv-yard-road pv-yard-road-one"/><div className="pv-yard-road pv-yard-road-two"/>
      <div className="pv-yard-skyline"/>
      {BUILDINGS.map(b=>{
        const active=isUnlocked(b.id);
        return <button key={b.id} style={{left:`${b.x}%`,top:`${b.y}%`}}
          className={`pv-base-building ${active?'is-open':'is-locked'} ${building===b.id?'is-selected':''}`}
          disabled={!active} onClick={()=>setBuilding(b.id)}
          aria-label={`${b.name}, poziom 1, ${active?'otwarty':'zablokowany'}`}>
          <PixelBuilding variant={b.variant} lit={active}/>
          <span className="pv-building-label">{b.name} <small>LV 1</small></span>
          {!active&&<span className="pv-building-locked">ZAMKNIĘTE</span>}
        </button>;
      })}
      <div className="pv-yard-badge">PIXELCARGO · BAZA</div>
    </div>
    <div className="pv-base-inspector">
      {building===null&&<div className="pv-empty-garage"><span className="pv-empty-symbol">⌁</span><strong>WITAJ W SWOJEJ BAZIE</strong><p>Kliknij podświetlony PARKING, aby otworzyć zarządzanie pojazdami.</p></div>}
      {building==='parking'&&<><div className="pv-base-toolbar"><div><h3>PARKING <small>LV 1</small></h3><p>1 miejsce na pojazd · {parkingReady?'1/1 zajęte':'0/1 zajętych'}</p></div>
        <div className="pv-garage-tabs" role="tablist" aria-label="Zakładki parkingu">
          <button role="tab" aria-selected={tab==='flota'} className={tab==='flota'?'is-active':''} onClick={()=>setTab('flota')}>FLOTA</button>
          <button role="tab" aria-selected={tab==='dealer'} className={tab==='dealer'?'is-active':''} onClick={()=>setTab('dealer')}>DEALER</button>
          <button role="tab" aria-selected={tab==='gielda'} className={tab==='gielda'?'is-active':''} onClick={()=>setTab('gielda')}>GIEŁDA</button>
        </div>
      </div>
      {tab==='flota'&&<div className="pv-garage-body">{state.van?.specs?<OfferCard offer={state.van.specs} canPay={false} owned onBuy={onBuy} money={money}/>:
        state.van?<div className="pv-empty-garage"><VehiclePixel/><strong>TWÓJ FURGON</strong><p>Przebieg: {(state.van.mileageMeters/1000).toFixed(0)} km. Samochód z wcześniejszego zapisu gry.</p></div>:
        <div className="pv-empty-garage"><span className="pv-empty-symbol">▧</span><strong>TWOJA FLOTA JEST PUSTA</strong><p>Otwórz GIEŁDĘ i wybierz używany samochód. Ceny zaczynają się od 5 000 zł.</p><button onClick={()=>setTab('gielda')}>PRZEJDŹ NA GIEŁDĘ</button></div>}</div>}
      {tab==='dealer'&&<div className="pv-empty-garage pv-dealer-locked"><span className="pv-empty-symbol">▧</span><strong>DEALER NOWYCH AUT</strong><p>Nowe samochody będą dostępne po rozbudowie parkingu do poziomu 2. Na razie sprawdź giełdę używanych.</p><button disabled>WYMAGA PARKINGU LV 2</button></div>}
      {tab==='gielda'&&<div className="pv-garage-body"><div className="pv-market-head">GIEŁDA UŻYWANYCH · {available.length} OFERT <span>Oferty przypisane do Twojej firmy · nie zmieniają się po odświeżeniu</span></div>
        <div className="pv-used-list">{available.map(v=><OfferCard key={v.id} offer={v} owned={parkingReady}
          canPay={!!state.company&&state.company.balanceGrosze>=v.priceGrosze} onBuy={onBuy} money={money}/>)}
          {!available.length&&<p>Brak ofert na giełdzie.</p>}</div></div>}
      </>}
      {building==='kadry'&&<div className="pv-garage-body"><div className="pv-base-toolbar"><div><h3>KADRY <small>LV 1</small></h3><p>Zatrudnij pierwszego kierowcę z kategorią B</p></div></div>
        <div className="pv-empty-garage"><div className="pv-portrait-card"><DriverPortrait/></div>
        <strong>{driverReady?'KIEROWCA ZATRUDNIONY':'KIEROWCA · POZIOM 1'}</strong>
        <p>{driverReady?'Twoja załoga jest gotowa do realizacji kursów.':'Stawka kierowcy: 25 zł/h. Po zatrudnieniu odblokujesz Spedycję.'}</p>
        {!driverReady&&<button onClick={onHire}>ZATRUDNIJ KIEROWCĘ</button>}</div></div>}
      {building==='spedycja'&&<div className="pv-garage-body"><div className="pv-base-toolbar"><div><h3>SPEDYCJA <small>LV 1</small></h3><p>Twoje pierwsze zlecenia transportowe</p></div></div>
        <div className="pv-empty-garage"><span className="pv-empty-symbol">↗</span><strong>GOTOWI DO DROGI</strong>
        <p>Otwórz Rynek zleceń po lewej, przyjmij kurs i obserwuj transport na mapie.</p>
        <button onClick={onShowMap}>PRZEJDŹ DO MAPY TRANSPORTU</button></div></div>}
    </div>
  </div>;
}
