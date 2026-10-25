import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { GameRuntime } from '../core/runtime';
import { formatGameTime } from '../core/engine';
import {
  advancePreview, buyUsedVan, createPreviewState, dispatchTransport, establishCompany,
  hireDriver, refuelAtCity, repayLoan,
  type PreviewOffer, type PreviewState, type TransportRoute,
} from './gameplay';
import { BaseParking } from './BaseParking';
import { CargoPixel } from './PixelSprites';

/** This preview is independent of the unreleased full-country market and road graph. */
const STORAGE = 'pixelcargo-0.1-preview-v1';
const CITIES: Record<string,string> = {
  'geonames:3094802': 'Kraków', 'geonames:757026': 'Tarnów',
  'geonames:3080866': 'Zakopane', 'geonames:775758': 'Bochnia',
};
const GOODS = ['Książki', 'Odzież', 'Zabawki', 'Elektronika', 'Karma dla zwierząt'];
const price = (grosze: number) => `${(grosze / 100).toLocaleString('pl-PL', {minimumFractionDigits: 2, maximumFractionDigits: 2})} zł`;
const city = (id: string) => CITIES[id] ?? id;
const duration = (secs: number) => `${Math.floor(secs / 3600)} h ${Math.round((secs % 3600) / 60)} min`;
function loadSaved(time: number): PreviewState {
  try {
    const raw = window.localStorage.getItem(STORAGE);
    if (raw) {
      const saved: PreviewState = JSON.parse(raw);
      if (Number.isSafeInteger(saved.time) && saved.time >= 0 && Array.isArray(saved.events)
          && (!saved.company || typeof saved.company.name === 'string')) return saved;
    }
  } catch { /* stale or invalid preview save: use a clean preview session */ }
  return createPreviewState(time);
}
function isRoute(v: unknown): v is TransportRoute {
  if (!v || typeof v !== 'object') return false;
  const r = v as Partial<TransportRoute>;
  return typeof r.id === 'string' && typeof r.fromCityId === 'string' && typeof r.toCityId === 'string'
    && Number.isFinite(r.meters) && (r.meters ?? 0) > 0 && Number.isFinite(r.seconds) && (r.seconds ?? 0) > 0
    && Array.isArray(r.geometry) && r.geometry.length > 1
    && r.geometry.every(c => Array.isArray(c) && c.length === 2 && c.every(Number.isFinite));
}
function routeKey(r: TransportRoute) { return `${r.fromCityId}|${r.toCityId}`; }
/** A stationary vehicle has a real snap coordinate, not a fabricated road connection. */
function stationaryRoute(at: string, starting: readonly [number, number]): TransportRoute {
  return { id: `stationary:${at}`, fromCityId: at, toCityId: at,
    meters: 0, seconds: 0, geometry: [starting] };
}
function availableOffer(r: TransportRoute, s: PreviewState): PreviewOffer {
  const completedCount = s.completedOfferIds.filter(id => id.startsWith(`preview:${r.id}:`)).length;
  const index = completedCount % GOODS.length;
  return { id: `preview:${r.id}:${completedCount + 1}`, fromCityId: r.fromCityId, toCityId: r.toCityId,
    cargo: GOODS[index], massKg: 300 + index * 110, volumeM3: 2.5 + index, pallets: index % 3,
    payoutGrosze: Math.max(30_000, Math.round(r.meters * 0.8)), expiresAt: s.time + 5 * 86_400_000 };
}
function pointAt(route: TransportRoute, fraction: number): readonly [number,number] {
  const points = route.geometry;
  if (!points.length) return [19.94,50.06];
  if (fraction <= 0 || points.length === 1) return points[0];
  if (fraction >= 1) return points[points.length-1];
  const distances = [0];
  let total = 0;
  for (let i=1; i<points.length; i++) {
    const a = points[i-1], b = points[i];
    const dy = (b[1]-a[1])*111195, dx = (b[0]-a[0])*111195*Math.cos((a[1]+b[1])*Math.PI/360);
    total += Math.hypot(dx,dy); distances.push(total);
  }
  const target = fraction * total;
  let i = 1;
  while (i < distances.length-1 && distances[i] < target) i++;
  const segment = distances[i]-distances[i-1], t = segment === 0 ? 0 : (target-distances[i-1])/segment;
  return [points[i-1][0] + (points[i][0]-points[i-1][0])*t,
    points[i-1][1] + (points[i][1]-points[i-1][1])*t];
}
function PreviewRouteMap({ route, fraction }: { route: TransportRoute; fraction: number }) {
  const points = route.geometry;
  let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity;
  for(const p of points){minLon=Math.min(minLon,p[0]);maxLon=Math.max(maxLon,p[0]);minLat=Math.min(minLat,p[1]);maxLat=Math.max(maxLat,p[1]);}
  const x = (lon:number) => 25 + (lon-minLon)/Math.max(0.001,maxLon-minLon)*690;
  const y = (lat:number) => 275 - (lat-minLat)/Math.max(0.001,maxLat-minLat)*240;
  const truck = pointAt(route,fraction);
  return <div className="pv-map" aria-label="Rzeczywista geometria trasy OSM">
    <div className="pv-map-title">TRASA DROGOWA OSM • {city(route.fromCityId)} → {city(route.toCityId)}</div>
    <svg viewBox="0 0 740 310" role="img" aria-label="Schemat rzeczywistej trasy przejazdu i pozycji furgonu">
      <defs><pattern id="pv-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#34404c" strokeWidth="0.6" /></pattern></defs>
      <rect width="740" height="310" fill="url(#pv-grid)" />
      <polyline points={points.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke="#576778" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points.map(p=>`${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke="#f3ba62" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points[0][0])} cy={y(points[0][1])} r="6" fill="#86c7ad" />
      <circle cx={x(points[points.length-1][0])} cy={y(points[points.length-1][1])} r="6" fill="#ef9573" />
      <rect x={x(truck[0])-8} y={y(truck[1])-6} width="16" height="12" rx="2" fill="#f3ba62" stroke="#10161d" strokeWidth="2" />
    </svg>
    <div className="pv-map-footer"><span>● POCZĄTEK</span><span>■ FURGON</span><span>● KONIEC</span></div>
  </div>;
}
export function PreviewApp({runtime}: {runtime: GameRuntime}) {
  const status = useSyncExternalStore(runtime.subscribe, runtime.getStatus);
  // Do not read/write preview state before ownership and IndexedDB restoration.
  if (status.mode !== 'active') return <div className="pv-app"><p role="status">{status.message}</p></div>;
  return <ActivePreviewApp runtime={runtime} />;
}
function ActivePreviewApp({runtime}: {runtime: GameRuntime}) {
  const game = useSyncExternalStore(runtime.session.subscribe, runtime.session.getSnapshot);
  const status = useSyncExternalStore(runtime.subscribe, runtime.getStatus);
  const [state, setState] = useState<PreviewState>(()=>loadSaved(game.time));
  // Both saves have different cadences. Resume the preview exactly at its own
  // saved instant, then use deltas from the shared clock; never add offline time.
  const clockOffset = useRef(state.time - game.time);
  const previewTime = game.time + clockOffset.current;
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loadError,setLoadError] = useState('');
  const [error,setError] = useState('');
  const [name,setName] = useState('');
  const [view,setView] = useState<'base'|'map'>(state.active ? 'map' : 'base');
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
  useEffect(()=>{
    if(status.mode!=='active')return;
    setState(s=>previewTime >= s.time ? advancePreview(s,previewTime) : s);
  },[previewTime,status.mode]);
  // The game updates every 250ms; debouncing by 500ms never fires while
  // the clock is running. Persist periodically using the latest snapshot,
  // and flush on navigation/unmount to avoid losing recently accepted jobs.
  const latestState = useRef(state);
  latestState.current = state;
  useEffect(()=>{
    const save = () => {
      try{window.localStorage.setItem(STORAGE, JSON.stringify(latestState.current));}
      catch{/* storage full: simulation continues; never interrupt the game */}
    };
    const timer = window.setInterval(save, 1000);
    window.addEventListener('pagehide', save);
    return ()=>{
      window.clearInterval(timer);
      window.removeEventListener('pagehide', save);
      save();
    };
  },[]);
  const options = useMemo(()=>[...new Set(routes.map(r=>r.fromCityId))], [routes]);
  const offers = useMemo(()=>routes.filter(r=>r.fromCityId===state.van?.cityId && routes.some(back=>back.fromCityId===r.toCityId)).map(r=>({route:r,offer:availableOffer(r,state)})),[routes,state]);
  const active = state.active;
  const activeRoute = active ? (active.phase==='empty' ? active.routeEmpty : active.routeLoaded) : null;
  const percent = active ? Math.min(100,Math.max(0,active.phaseProgressMs / (active.phase==='empty' ? active.routeEmpty.seconds*1000||1 : active.phase==='loaded' ? active.routeLoaded.seconds*1000||1 : 900_000) * 100)) : 0;
  const locationLabel = state.van ? city(state.van.cityId) : 'Brak pojazdu';
  function action(fn: (state: PreviewState)=>PreviewState) {
    if(status.mode!=='active') {setError('Ta sesja jest nieaktywna. Zamknij inne karty gry.');return;}
    try{const next = fn(state);setState(next);setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}
  }
  function reset(){if(window.confirm('Usunąć zapis wersji preview i rozpocząć od nowa?')){window.localStorage.removeItem(STORAGE);setState(createPreviewState(previewTime));setView('base');setError('');}}
  return <div className="pv-app">
    <header className="pv-header"><div><a href={import.meta.env.BASE_URL}>← MAPA / PANEL TECHNICZNY</a><h1>PIXELCARGO <span>0.1 • GRAJ</span></h1><small>JEDEN FURGON • RZECZYWISTE DROGI • WERSJA PREVIEW</small></div>
      <div className="pv-clock"><span>{formatGameTime(previewTime).day} · DZIEŃ {formatGameTime(previewTime).dayNumber}</span><strong>{formatGameTime(previewTime).hour}</strong><small>1 sekunda = 1 minuta gry</small></div></header>
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
        <h2>02 / RYNEK ZLECEŃ</h2>
        <div className="pv-section">{state.driverHiredAt===null ?
          <div className="pv-gate-hint">🔒 SPEDYCJA ZABLOKOWANA. {!state.van?'Kup pierwszy pojazd w bazie: PARKING → GIEŁDA.':'Zatrudnij kierowcę w budynku KADRY.'}</div> :
          <><p>Wersja demonstracyjna: tylko zweryfikowane kierunki OSM. Zlecenia dostępne w bieżącym mieście furgonu.</p>
          {!offers.length && <p>Brak dostępnych kursów z tej lokalizacji.</p>}
          {offers.map(({route,offer})=><article className="pv-job" key={offer.id}>
            <strong>{city(route.fromCityId)} → {city(route.toCityId)}</strong>
            <div className="pv-cargo-row"><CargoPixel cargo={offer.cargo}/><span>{offer.cargo}<small>{offer.massKg} kg · {offer.volumeM3} m³ · {offer.pallets} palety</small></span></div>
            <span>{(route.meters/1000).toFixed(1)} km • {duration(route.seconds)}</span>
            <div><b>{price(offer.payoutGrosze)}</b><button disabled={!!state.active||!state.van||state.driverHiredAt===null||status.mode!=='active'} onClick={()=>{action(s=>dispatchTransport(s,offer,stationaryRoute(route.fromCityId,route.geometry[0]),route));setView('map');}}>PRZYJMIJ</button></div>
          </article>)}</>}
        </div>
      </section>
      <section className="pv-panel pv-world" aria-label="Transport i historia">
        <h2>03 / {state.company&&view==='base'&&!activeRoute?'BAZA TWOJEJ FIRMY':'MONITOR TRANSPORTU'}</h2>
        {state.company&&view==='base'&&!activeRoute ?
          <BaseParking state={state} cityName={city(state.company.baseCityId)}
            onBuy={(id)=>action(s=>buyUsedVan(s,id))}
            onHire={()=>action(hireDriver)}
            onShowMap={()=>setView('map')} money={price}/> :
          activeRoute ? <><PreviewRouteMap route={activeRoute} fraction={active?.phase==='loaded'? percent/100:active?.phase==='empty'? percent/100:active?.phase==='unloading'?1:0}/>
          <div className="pv-section"><div className="pv-stat">Aktywny kurs: <strong>{city(active!.offer.fromCityId)} → {city(active!.offer.toCityId)}</strong></div>
            <div className="pv-stat">Etap: <strong>{({empty:'Dojazd pusty',loading:'Załadunek',loaded:'Jazda z ładunkiem',unloading:'Rozładunek'})[active!.phase]}</strong></div>
            <div className="pv-progress"><div style={{width:`${percent}%`}} /></div><small>{percent.toFixed(0)}% bieżącego etapu</small></div></>:
          <div className="pv-placeholder"><strong>{state.company?'MAPA GOTOWA':'WITAJ W PIXELCARGO'}</strong>
            <p>{state.company?'Wybierz zlecenie lub wróć do swojej bazy.':'Załóż firmę, wybierz miasto bazy i rozpocznij samouczek. Pierwszym krokiem będzie zakup pojazdu na giełdzie.'}</p>
            {state.company&&<button onClick={()=>setView('base')}>WEJDŹ DO BAZY</button>}</div>}
        <h2>04 / HISTORIA OPERACJI</h2>
        <div className="pv-events">{[...state.events].reverse().slice(0,12).map(event=><div key={event.id}><span>{formatGameTime(event.at).hour}</span><span>{event.message}</span><strong>{event.changeGrosze ? price(event.changeGrosze) : '—'}</strong></div>)}
          {!state.events.length && <p>Brak operacji.</p>}
        </div>
        <div className="pv-foot"><span>Oddzielny zapis demonstracji. Nie modyfikuje zapisu gry głównej.</span><button onClick={reset}>RESET PREVIEW</button></div>
      </section>
    </div>
    <footer className="pv-footer">PIXELCARGO • PREVIEW • NIEPEŁNA WERSJA 0.1 · ŹRÓDŁO DRÓG: © OPENSTREETMAP CONTRIBUTORS</footer>
  </div>;
}
