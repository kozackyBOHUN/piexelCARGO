import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { GameRuntime } from '../core/runtime';
import { formatGameTime } from '../core/engine';
import {
  buyUsedVan, establishCompany,
  hireDriver, refuelAtCity, repayLoan,
  type PreviewState, type TransportRoute,
} from './gameplay';
import { BaseParking } from './BaseParking';
import { CargoPixel } from './PixelSprites';
import {ensureMarket,acceptOrder,startOrder,cargoFits} from './market';
import { PreviewSession } from './session';
import { mapState, PHASE_LABELS } from './transport';
import { PolandMap } from '../ui/PolandMap';
import { Timeline } from '../ui/Timeline';

/** This preview is independent of the unreleased full-country market and road graph. */
const CITIES: Record<string,string> = {
  'geonames:3094802': 'Kraków', 'geonames:757026': 'Tarnów',
  'geonames:3080866': 'Zakopane', 'geonames:775758': 'Bochnia',
};
const price = (grosze: number) => `${(grosze / 100).toLocaleString('pl-PL', {minimumFractionDigits: 2, maximumFractionDigits: 2})} zł`;
const city = (id: string) => CITIES[id] ?? id;
const duration = (secs: number) => `${Math.floor(secs / 3600)} h ${Math.round((secs % 3600) / 60)} min`;
function isRoute(v: unknown): v is TransportRoute {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<TransportRoute>;
  return typeof r.id === 'string' && typeof r.fromCityId === 'string' && typeof r.toCityId === 'string'
    && Number.isFinite(r.meters) && (r.meters ?? 0) > 0 && Number.isFinite(r.seconds) && (r.seconds ?? 0) > 0
    && Array.isArray(r.geometry) && r.geometry.length > 1
    && r.geometry.every(c => Array.isArray(c) && c.length === 2 && c.every(Number.isFinite));
}
function routeKey(r: TransportRoute) { return `${r.fromCityId}|${r.toCityId}`; }
export function PreviewApp({runtime,session}: {runtime: GameRuntime;session:PreviewSession}) {
  const status = useSyncExternalStore(runtime.subscribe, runtime.getStatus);
  // Do not read/write preview state before ownership and IndexedDB restoration.
  if (status.mode !== 'active') return <div className="pv-app"><p role="status">{status.message}</p></div>;
  return <ActivePreviewApp runtime={runtime} session={session} />;
}
function ActivePreviewApp({runtime,session}: {runtime: GameRuntime;session:PreviewSession}) {
  const state=useSyncExternalStore(session.subscribe,session.getSnapshot);
  const status=useSyncExternalStore(runtime.subscribe,runtime.getStatus);
  const previewTime=state.time;
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loadError,setLoadError] = useState('');
  const [error,setError] = useState('');
  const [name,setName] = useState('');
  const [view,setView] = useState<'base'|'map'|'fleet'|'market'|'timeline'>(()=>{
    const value=new URLSearchParams(window.location.search).get('view');
    return value==='base'||value==='fleet'||value==='market'||value==='timeline'?value:'map';
  });
  useEffect(()=>{const url=new URL(window.location.href);url.searchParams.set('view',view);window.history.replaceState(null,'',url);},[view]);
  const [base,setBase] = useState('');
  useEffect(()=>{
    // Resuming a transport stays on the map even after the cargo arrives.
    if(state.active) setView('map');
  },[Boolean(state.active)]);
  useEffect(()=>{
    let active = true;
    fetch(`${import.meta.env.BASE_URL}roads/preview/routes.json`).then(async response=>{
      if(!response.ok) throw new Error('Nie znaleziono zestawu zatwierdzonych tras preview.');
      const json: unknown = await response.json();
      if (!Array.isArray(json) || !json.every(isRoute) || json.length===0) throw new Error('Dane tras mają nieprawidłowy format.');
      const keys = new Set<string>();
      for(const route of json) {const key=routeKey(route);if(keys.has(key))throw new Error(`Powtarzający się kierunek: ${key}`);keys.add(key);}
      if(active) {setRoutes(json); setBase(json[0].fromCityId);}
    }).catch(err=>{if(active)setLoadError(String(err instanceof Error?err.message:err));});
    return ()=>{active=false;};
  },[]);
  const options = useMemo(()=>[...new Set(routes.map(r=>r.fromCityId))], [routes]);
  useEffect(()=>{if(state.company&&!state.market&&routes.length)session.update(s=>ensureMarket(s,routes));},[state.company,state.market,routes,session]);
  const [origin,setOrigin]=useState('');
  const [size,setSize]=useState('all');
  const [sort,setSort]=useState('expiry');
  const offers=useMemo(()=>[...(state.market?.offers??[])].filter(o=>(!origin||o.fromCityId===origin)&&(size==='all'||(size==='fits'?cargoFits(state,o):size==='small'?o.massKg<=500&&o.volumeM3<=5&&o.pallets<=2:!cargoFits(state,o)))).sort((a,b)=>sort==='price'?b.payoutGrosze-a.payoutGrosze:sort==='size'?a.massKg-b.massKg: a.expiresAt-b.expiresAt),[state.market,state.van,origin,size,sort]);
  const remaining=(end:number)=>{const minutes=Math.max(0,Math.ceil((end-state.time)/60000));return `${Math.floor(minutes/1440)} d ${Math.floor(minutes%1440/60)} h ${minutes%60} min`;};
  const canReach=(from:string)=>!!state.van&&(state.van.cityId===from||routes.some(r=>r.fromCityId===state.van!.cityId&&r.toCityId===from));
  const active = state.active;
  const percent = active ? Math.min(100,Math.max(0,active.phaseProgressMs / (active.phase==='empty' ? active.routeEmpty.seconds*1000||1 : active.phase==='loaded' ? active.routeLoaded.seconds*1000||1 : 900_000) * 100)) : 0;
  const locationLabel = active ? `${city(active.offer.fromCityId)} → ${city(active.offer.toCityId)}` : state.van ? city(state.van.cityId) : 'Brak pojazdu';
  function action(fn: (state: PreviewState)=>PreviewState) {
    if(status.mode!=='active') {setError('Ta sesja jest nieaktywna. Zamknij inne karty gry.');return;}
    try{session.update(fn);setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}
  }
  function reset(){
    if(!window.confirm('Zrestartować firmę? Utracisz firmę, pojazdy, kierowcę, pieniądze, zlecenia i historię. Tej operacji nie można cofnąć.')) return;
    session.restart();
    setView('base');
    setName('');
    setBase(routes[0]?.fromCityId??'');
    setError('');
  }
  const overlay=mapState(state,routes);
  const market=<><h2>02 / RYNEK ZLECEŃ</h2><div className="pv-section">
    <p>Tylko zatwierdzone trasy OSM. Suche towary do furgonu. Przyjęcie rezerwuje zlecenie; kolejność przewozów wybierasz samodzielnie.</p>
    <h3>Przyjęte zlecenia ({state.market?.orders.filter(o=>o.completedAt===null).length??0}/3)</h3>
    {state.market?.orders.filter(o=>o.completedAt===null).map(o=><article className="pv-job" key={o.offer.id} data-order-id={o.offer.id}>
      <strong>{city(o.offer.fromCityId)} → {city(o.offer.toCityId)}</strong><span>{o.offer.cargo} · {price(o.offer.payoutGrosze)}</span>
      <span>{state.active?.offer.id===o.offer.id?PHASE_LABELS[state.active.phase]:'Oczekuje na realizację'} · Termin: dzień {formatGameTime(o.deadline).dayNumber}, {formatGameTime(o.deadline).hour} · {state.time>o.deadline?'PO TERMINIE — zlecenie pozostaje aktywne':remaining(o.deadline)}</span>
      {o.penalized&&<span>Kara naliczona: {price(o.penaltyGrosze)}</span>}
      <button disabled={!!state.active||state.driverHiredAt===null||!canReach(o.offer.fromCityId)} onClick={()=>action(s=>startOrder(s,o.offer.id,routes))}>ROZPOCZNIJ KURS</button>
      {!canReach(o.offer.fromCityId)&&<small>Brak zatwierdzonego dojazdu z obecnej lokalizacji.</small>}
    </article>)}
    <h3>Dostępne oferty</h3>
    <label>Miejsce nadania<select aria-label="Miejsce nadania" value={origin} onChange={e=>setOrigin(e.target.value)}><option value="">Wszystkie miasta</option>{options.map(id=><option key={id} value={id}>{city(id)}</option>)}</select></label>
    <label>Wielkość ładunku<select aria-label="Wielkość ładunku" value={size} onChange={e=>setSize(e.target.value)}><option value="all">Wszystkie</option><option value="small">Do 500 kg, 5 m³, 2 palet</option><option value="fits">Mieści się w moim furgonie</option><option value="large">Nie mieści się w moim furgonie</option></select></label>
    <label>Sortowanie<select aria-label="Sortowanie" value={sort} onChange={e=>setSort(e.target.value)}><option value="expiry">Czas do wygaśnięcia</option><option value="price">Cena malejąco</option><option value="size">Masa rosnąco</option></select></label>
    <p>{offers.length} ofert · wyświetlane maksymalnie 30</p>
    {offers.slice(0,30).map(offer=>{const route=routes.find(r=>r.fromCityId===offer.fromCityId&&r.toCityId===offer.toCityId)!;const fits=cargoFits(state,offer);return <article className="pv-job" key={offer.id} data-offer-id={offer.id}>
      <strong>{city(offer.fromCityId)} → {city(offer.toCityId)}</strong>
      <div className="pv-cargo-row"><CargoPixel cargo={offer.cargo}/><span>{offer.cargo}<small>{offer.massKg} kg · {offer.volumeM3} m³ · {offer.pallets?`${offer.pallets} palety`:'palety: nie dotyczy (paczki)'}</small></span></div>
      <span>{((route?.meters??0)/1000).toFixed(1)} km · {duration(route?.seconds??0)} · wygasa za {remaining(offer.expiresAt)}</span>
      <small>{!state.van?'Kup furgon, aby sprawdzić pojemność.':fits?'Ładunek mieści się we furgonie.':'Za duży: wymaga innego furgonu lub kilku kursów (nieobsługiwane).'} {!canReach(offer.fromCityId)&&state.van?'Brak zatwierdzonego dojazdu pustego.':''}</small>
      <div><b>{price(offer.payoutGrosze)}</b><button disabled={!fits||!canReach(offer.fromCityId)||(state.market?.orders.filter(o=>o.completedAt===null).length??0)>=3||offer.expiresAt<=state.time} onClick={()=>action(s=>acceptOrder(s,offer.id))}>PRZYJMIJ</button></div>
    </article>})}
    {!offers.length&&<p>Brak ofert spełniających filtry.</p>}
  </div></>;
  return <div className="pv-app">
    <header className="pv-header"><div><a href={`${import.meta.env.BASE_URL}?dev=1`}>WIDOK DEVELOPERSKI</a><h1>PIXELCARGO <span>0.1 • GRAJ</span></h1><small>JEDEN FURGON • RZECZYWISTE DROGI • WERSJA PREVIEW</small></div>
      <div className="pv-clock" data-testid="canonical-clock" data-time={state.time}><button type="button" className="pv-restart-button" onClick={reset} aria-label="RESTART FIRMY">↺ RESTART FIRMY</button><span>{formatGameTime(previewTime).day} · DZIEŃ {formatGameTime(previewTime).dayNumber}</span><strong>{formatGameTime(previewTime).hour}</strong><small>1 sekunda = 1 minuta gry</small></div></header>
    <nav className="pv-game-nav" aria-label="Widoki gry">{([['map','Mapa Polski'],['base','Baza firmy'],['fleet','Flota / parking'],['market','Rynek zleceń'],['timeline','Harmonogram']] as const).map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}</nav>
    <div className="pv-summary">
      <div><small>FIRMA</small><strong>{state.company?.name ?? 'Nieutworzona'}</strong></div>
      <div><small>SALDO</small><strong>{state.company ? price(state.company.balanceGrosze) : '—'}</strong></div>
      <div><small>KREDYT</small><strong>{state.company ? price(state.company.debtGrosze) : '—'}</strong></div>
      <div><small>FURGON</small><strong>{locationLabel}</strong><small>{state.van ? `${(state.van.fuelMillilitres/1000).toFixed(1)} l paliwa` : 'Brak auta'}</small></div>
    </div>
    {loadError ? <div className="pv-alert" role="alert">BRAK ZATWIERDZONYCH TRAS: {loadError} Gra nie uruchomi fikcyjnych przejazdów.</div> : null}
    {error ? <div className="pv-alert" role="alert">{error}</div> : null}
    <div className="pv-columns">
      <section className="pv-panel" aria-label="Zarządzanie firmą">
        <h2>01 / TWOJA FIRMA</h2>
        {!state.company ? <div className="pv-section">
          <label>Nazwa firmy<input value={name} placeholder="Moja Firma Transportowa" maxLength={64} onChange={(e: {target:{value:string}})=>setName(e.target.value)} /></label>
          <label>Miasto pierwszej bazy<select value={base} onChange={(e: {target:{value:string}})=>setBase(e.target.value)}>{options.map(id=><option key={id} value={id}>{city(id)}</option>)}</select></label>
          <p>Otrzymasz 20 000 zł kredytu. Startujesz bez furgonu i kierowcy.</p>
          <button disabled={!options.length||!name.trim()||status.mode!=='active'} onClick={()=>{action(s=>establishCompany(s,name,base));setView('base');}}>ZAŁÓŻ FIRMĘ</button>
        </div> : <div className="pv-section">
          <div className="pv-stat">Baza: <strong>{city(state.company.baseCityId)} · poziom 1</strong></div>
          <div className="pv-stat">Parking: <strong>{state.van?'1/1 zajęte':'0/1 pojazdów'}</strong></div>
          <div className="pv-stat">Kierowca: <strong>{state.driverHiredAt!==null?'Zatrudniony':'Brak'}</strong></div>
          {state.van&&<div className="pv-stat">Pojazd: <strong>{state.van.specs?.model??'Furgon'} · {(state.van.mileageMeters/1000).toLocaleString('pl-PL',{maximumFractionDigits:0})} km</strong></div>}
          <div className="pv-actions">
            <button className="pv-menu-link" onClick={()=>setView('base')}>◈ WRÓĆ DO BAZY</button>
            {state.driverHiredAt!==null&&<button onClick={()=>setView('map')}>MAPA</button>}
            {state.van&&<button disabled={!!state.active} onClick={()=>action(s=>refuelAtCity(s,10))}>TANKUJ 10 L</button>}
            <button disabled={!!state.active} onClick={()=>action(repayLoan)}>SPŁAĆ 1 000 ZŁ</button>
          </div>
        </div>}
        {view!=='market'&&market}

      </section>
      <section className="pv-panel pv-world" aria-label="Transport i historia">
        <h2>03 / {view==='base'?'BAZA TWOJEJ FIRMY':view==='fleet'?'FLOTA / PARKING':view==='market'?'RYNEK ZLECEŃ':view==='timeline'?'HARMONOGRAM':'MAPA POLSKI'}</h2>
        <div className="pv-map unified-map" hidden={view!=='map'}><PolandMap game={overlay}/>
          {active?<div className="pv-section"><div className="pv-stat">Aktywny kurs: <strong>{city(active.offer.fromCityId)} → {city(active.offer.toCityId)}</strong></div><div className="pv-stat">Etap: <strong data-testid="transport-phase">{PHASE_LABELS[active.phase]}</strong></div><div className="pv-progress"><div style={{width:`${percent}%`}}/></div><small>{percent.toFixed(0)}% bieżącego etapu</small></div>:<div className="pv-section"><strong>MAPA GOTOWA</strong><p>{state.van?'Pojazd oczekuje na następny kurs.':'Załóż firmę i kup furgon na giełdzie.'}</p></div>}
        </div>
        {(view==='base'||view==='fleet')&&(state.company?<BaseParking key={view} initialBuilding={view==='fleet'?'parking':undefined} state={state} cityName={city(state.company.baseCityId)} onBuy={id=>action(s=>buyUsedVan(s,id))} onHire={()=>action(hireDriver)} onShowMap={()=>setView('map')} money={price}/>:<div className="pv-section">Załóż firmę w panelu po lewej.</div>)}
        {view==='market'&&market}
        <div hidden={view!=='map'&&view!=='timeline'}><Timeline time={previewTime} state={state}/></div>
        <h2>04 / HISTORIA OPERACJI</h2>
        <div className="pv-events">{[...state.events].reverse().map(event=><div key={event.id}><span>{formatGameTime(event.at).hour}</span><span>{event.message}</span><strong>{event.changeGrosze ? price(event.changeGrosze) : '—'}</strong></div>)}
          {!state.events.length && <p>Brak operacji.</p>}
        </div>
        <div className="pv-foot"><span>Jeden zapis firmy i wspólny czas gry we wszystkich widokach. RESTART FIRMY rozpoczyna nową rozgrywkę.</span></div>
      </section>
    </div>
    <footer className="pv-footer">PIXELCARGO • PREVIEW • NIEPEŁNA WERSJA 0.1 · ŹRÓDŁO DRÓG: © OPENSTREETMAP CONTRIBUTORS</footer>
  </div>;
}
