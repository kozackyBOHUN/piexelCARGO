import { formatGameTime } from "../core/engine";
import { PixelIcon } from "./PixelIcon";
export function Timeline({ time }: { time: number }) {
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
