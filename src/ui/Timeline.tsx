import {formatGameTime} from '../core/engine';
import {PixelIcon} from './PixelIcon';
import {scheduleActivities} from '../preview/transport';
import type {PreviewState} from '../preview/gameplay';
/** Read-only actual transport plan; the technical view may show just its clock. */
export function Timeline({time,state}:{time:number;state?:PreviewState}){
 if(!state)return <TechnicalTimeline time={time}/>;
 const activities=state?scheduleActivities(state):[],hour=3600000;
 const first=activities[0]?.start??time;
 const start=Math.floor(Math.min(first,time)/hour)*hour;
 const end=Math.max(start+4*hour,time+hour,...activities.map(a=>a.end));
 const total=end-start,position=(at:number)=>Math.max(0,Math.min(100,(at-start)/total*100));
 const stamp=(at:number)=>`D${formatGameTime(at).dayNumber} ${formatGameTime(at).hour}`;
 return <section className="panel timeline game-timeline" aria-labelledby="timeline-title" data-testid="game-timeline" data-time={time}>
  <header className="panel-heading"><div><PixelIcon name="clock"/><h2 id="timeline-title">Harmonogram</h2></div><time data-testid="timeline-clock">{stamp(time)}</time></header>
  <div className="transport-axis" aria-label="Oś czasu harmonogramu" tabIndex={0}>
   <div className="transport-scale">{Array.from({length:Math.ceil(total/hour)+1},(_,i)=><time key={i} style={{left:`${i*hour/total*100}%`}}>{stamp(start+i*hour)}</time>)}</div>
   <div className="transport-lane" aria-label={state?.van?.specs?.model??'Furgon'}>
    {activities.map((a,i)=><div key={`${a.phase}:${i}`} className={`transport-block phase-${a.phase}`} data-phase={a.phase} data-start={a.start} data-end={a.end} data-progress={a.progress} style={{left:`${position(a.start)}%`,width:`${Math.max(.4,(a.end-a.start)/total*100)}%`}} title={`${a.label}: ${stamp(a.start)} – ${stamp(a.end)}, ${((a.end-a.start)/60000).toFixed(1)} min`}><div style={{width:`${a.progress*100}%`}}/><span>{a.label}</span></div>)}
    <span className="transport-now" style={{left:`${position(time)}%`}} aria-label={`Teraz ${stamp(time)}`}/>
    {!activities.length&&<p>Brak pojazdu. Kup furgon na giełdzie, aby zobaczyć jego działania.</p>}
   </div>
  </div>
  <div className="transport-activity-list">{activities.map((a,i)=><div key={i} className={`activity phase-${a.phase}`} aria-current={a.ongoing?'step':undefined}><strong>{a.label}</strong><time>{stamp(a.start)} – {a.ongoing&&a.phase==='waiting'?'teraz':stamp(a.end)}</time><span>{((a.end-a.start)/60000).toFixed(1)} min · {(a.progress*100).toFixed(0)}%</span></div>)}</div>
  <div className="panel-footnote">Rzeczywisty plan przewozu · wspólny czas gry · tylko do odczytu</div>
 </section>;
}

function TechnicalTimeline({ time }: { time: number }) {
  const hour = 3_600_000;
  const start = Math.floor(time / hour) * hour;
  return (
    <section className="panel timeline" aria-labelledby="timeline-title">
      <header className="panel-heading">
        <div>
          <PixelIcon name="clock" />
          <h2 id="timeline-title">Harmonogram</h2>
        </div>
        <span className="module-tag">ETAP 09</span>
      </header>
      <div
        className="timeline-scroll"
        tabIndex={0}
        aria-label="Oś czasu harmonogramu"
      >
        <div className="timeline-scale">
          <span>Czas gry</span>
          {Array.from({ length: 6 }, (_, i) => (
            <time key={i}>{formatGameTime(start + i * hour).hour}</time>
          ))}
        </div>
        <div className="timeline-rows">
          <div className="timeline-empty">
            <span
              className="now-marker"
              style={{
                left: `calc(112px + (100% - 112px) * ${(time - start) / hour / 6})`,
              }}
            />
            <p>Harmonogram — etap 09</p>
            <small>Brak pojazdów i zaplanowanych czynności.</small>
          </div>
        </div>
      </div>
      <div className="panel-footnote">
        <span className="tiny-square" />
        Oś czasu sesji technicznej. Planowanie będzie dostępne w kolejnej fazie.
      </div>
    </section>
  );
}
