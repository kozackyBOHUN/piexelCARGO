import {useState} from 'react';
import type {PreviewState} from './gameplay';
import {mapState,scheduleActivities} from './transport';
const phaseDurationLabel=(ms:number)=>`${(ms/60000).toFixed(1)} min`;
import {cityName} from './interfaceModel';
import {formatGameTime} from '../core/engine';
export function VehicleSchedule({state}:{state:PreviewState}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
 const vehicle=mapState(state,[]).vehicle,activities=scheduleActivities(state),end=activities.filter(a=>a.phase!=='waiting').at(-1)?.end;
 const model=vehicle?.name??'',matches=!!vehicle&&model.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||(filter==='active')===!!state.active);
 return <section className="pc-schedule" data-testid="game-timeline" data-time={state.time} aria-label="Harmonogram samochodów">
 <header><h2>Harmonogram samochodów</h2><select aria-label="Filtr samochodów" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Wszystkie samochody ({state.van?1:0})</option><option value="active">W trakcie kursu</option><option value="idle">Postój</option></select><input aria-label="Szukaj samochodu" placeholder="Szukaj modelu…" value={query} onChange={e=>setQuery(e.target.value)}/></header>
 <div className="pc-table-scroll"><table><thead><tr>{['Numer i model auta','Kierowca','Lokalizacja','Aktualna czynność','Postęp','Przewidywany koniec','Status / działanie'].map(v=><th key={v}>{v}</th>)}</tr></thead><tbody>{matches?<tr data-testid="schedule-vehicle"><td>01 · {model}</td><td>{state.driverHiredAt===null?'Brak kierowcy':'Kierowca 01 · kat. B'}</td><td>{state.active?`${cityName(state.active.offer.fromCityId)} → ${cityName(state.active.offer.toCityId)}`:cityName(state.van!.cityId)}</td><td data-testid="transport-phase">{vehicle!.status}</td><td><progress max="1" value={vehicle!.progress}/>{Math.round(vehicle!.progress*100)}%</td><td>{state.active&&end?`D${formatGameTime(end).dayNumber} ${formatGameTime(end).hour}`:'—'}</td><td>{state.active?'W realizacji':state.driverHiredAt===null?'Zatrudnij kierowcę':state.van!.fuelMillilitres<10000?'Sprawdź paliwo':'Postój'}</td></tr>:<tr><td colSpan={7}>{state.van?'Brak pojazdów pasujących do filtrów.':'Brak pojazdów. Kup pierwszy furgon na giełdzie.'}</td></tr>}</tbody></table></div>
 <footer><span className="pc-good">● W realizacji</span><span>● Obsługa ładunku</span><span>● Postój</span><time data-testid="timeline-clock">D{formatGameTime(state.time).dayNumber} {formatGameTime(state.time).hour}</time></footer>
 <details><summary>Plan czynności i czasy</summary><div className="pc-plan">{activities.map((a,i)=><div key={i} className={`phase-${a.phase}`} data-phase={a.phase} data-start={a.start} data-end={a.end} data-progress={a.progress}>{a.label}: D{formatGameTime(a.start).dayNumber} {formatGameTime(a.start).hour} – {a.ongoing&&a.phase==='waiting'?'teraz':formatGameTime(a.end).hour} · {phaseDurationLabel(a.end-a.start)} · {Math.round(a.progress*100)}%</div>)}</div></details>
 </section>;
}
