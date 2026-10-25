import { useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import type { GameRuntime } from "../core/runtime";
import { formatGameTime } from "../core/engine";
import { SaveControls } from "./SaveControls";
import { PixelIcon, type IconName } from "./PixelIcon";
import { Timeline } from "./Timeline";
import { PolandMap } from "./PolandMap";
const tabs: {
  id: string;
  label: string;
  icon: IconName;
  description: string;
  stage: string;
}[] = [
  {
    id: "jobs",
    label: "Zlecenia",
    icon: "cargo",
    description:
      "Tutaj znajdziesz oferty i przyjęte zlecenia. Rynek transportowy nie został jeszcze uruchomiony.",
    stage: "08",
  },
  {
    id: "vehicle",
    label: "Pojazd",
    icon: "vehicle",
    description:
      "Nie posiadasz pojazdu. Zakup furgonu i zarządzanie flotą pojawią się po uruchomieniu firmy.",
    stage: "07",
  },
  {
    id: "driver",
    label: "Kierowca",
    icon: "driver",
    description:
      "Nie zatrudniono kierowcy. Rekrutacja i zarządzanie pracą będą dostępne po uruchomieniu firmy.",
    stage: "07",
  },
  {
    id: "base",
    label: "Baza",
    icon: "base",
    description:
      "Firma i baza nie zostały utworzone. Wybór siedziby będzie częścią rozpoczęcia rozgrywki.",
    stage: "06",
  },
  {
    id: "finance",
    label: "Finanse",
    icon: "finance",
    description:
      "Brak danych finansowych. Sesja techniczna nie zakłada firmy, nie przyznaje pieniędzy i nie zaciąga kredytu.",
    stage: "15",
  },
  {
    id: "history",
    label: "Historia zdarzeń",
    icon: "history",
    description: "",
    stage: "",
  },
  {
    id: "settings",
    label: "Ustawienia",
    icon: "settings",
    description: "",
    stage: "",
  },
];
export function App({ runtime }: { runtime: GameRuntime }) {
  const state = useSyncExternalStore(
    runtime.session.subscribe,
    runtime.session.getSnapshot,
  );
  const status = useSyncExternalStore(runtime.subscribe, runtime.getStatus);
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const time = formatGameTime(state.time);
  const tab = tabs[selected];
  const keyboard = (event: KeyboardEvent, index: number) => {
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  };
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#main">
          <span className="brand-symbol">
            <PixelIcon name="vehicle" size={32} />
          </span>
          <span>
            <h1>
              PixelCargo <small>0.1</small>
            </h1>
            <span className="brand-caption">
              TRANSPORT • LOGISTYKA • PLANOWANIE
            </span>
          </span>
        </a>
        <div className="environment-badge">
          <span className="status-light" />
          FAZA II<span className="badge-divider">/</span>MAPA 04C
        </div>
        <div className="topbar-note" aria-label="Alerty sesji">
          {status.mode === "active" && !status.saveError
            ? "BRAK ALERTÓW SESJI"
            : "SESJA WYMAGA UWAGI"}
          <span>
            {status.mode === "active"
              ? "Lokalna sesja techniczna"
              : "Sprawdź komunikat statusu poniżej"}
          </span>
        </div>
      </header>
      <div className="summary" aria-label="Stan sesji">
        <div className="summary-cell company">
          <PixelIcon name="base" />
          <div>
            <span className="eyebrow">FIRMA</span>
            <strong>Nieutworzona</strong>
          </div>
          <span className="subtle-tag">ETAP 06</span>
        </div>
        <div className="summary-cell finance">
          <div>
            <span className="eyebrow">SALDO</span>
            <strong aria-label="Saldo: brak danych">
              — <small>PLN</small>
            </strong>
          </div>
          <div>
            <span className="eyebrow">ZADŁUŻENIE</span>
            <strong aria-label="Zadłużenie: brak danych">
              — <small>PLN</small>
            </strong>
          </div>
        </div>
        <div className="summary-cell clock">
          <PixelIcon name="clock" />
          <div>
            <span className="eyebrow">
              {time.day} · DZIEŃ {time.dayNumber}
            </span>
            <time data-testid="game-clock">{time.hour}</time>
          </div>
          <span className="clock-rate">
            1 s = 1 min
            <br />
            czasu gry
          </span>
        </div>
        <div
          className={`summary-cell save-summary ${status.mode === "error" || status.saveError ? "has-error" : ""}`}
        >
          <span
            className={`status-light ${status.mode !== "active" || status.saveError ? "muted" : ""}`}
          />
          <div>
            <span className="eyebrow">ZAPIS LOKALNY</span>
            <strong>
              {status.mode === "active"
                ? status.saveError
                  ? "Błąd zapisu"
                  : status.savedAt
                    ? "Zapisano"
                    : "Sesja aktywna"
                : status.mode === "waiting"
                  ? "Oczekiwanie na dostęp"
                  : "Sesja zablokowana"}
            </strong>
            <span className="saved-time">
              {status.savedAt
                ? `Ostatni zapis: ${new Date(status.savedAt).toLocaleTimeString("pl-PL")}`
                : "Autosave co 10 sekund"}
            </span>
          </div>
        </div>
      </div>
      <main id="main" className="workspace">
        <aside className="management panel" aria-label="Zarządzanie">
          <header className="panel-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Centrum zarządzania</h2>
            </div>
          </header>
          <div role="tablist" aria-label="Panele zarządzania" className="tabs">
            {tabs.map((item, i) => (
              <button
                key={item.id}
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                role="tab"
                id={`tab-${item.id}`}
                aria-controls={`panel-${item.id}`}
                aria-selected={selected === i}
                tabIndex={selected === i ? 0 : -1}
                onKeyDown={(event) => keyboard(event, i)}
                onClick={() => setSelected(i)}
              >
                <PixelIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <section
            className="tab-content"
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            tabIndex={0}
          >
            <div className="content-title">
              <PixelIcon name={tab.icon} size={24} />
              <h2>{tab.label}</h2>
            </div>
            {tab.id === "settings" ? (
              <SaveControls
                runtime={runtime}
                active={status.mode === "active"}
              />
            ) : tab.id === "history" ? (
              <>
                <p className="section-intro">
                  Zdarzenia bieżącej sesji technicznej.
                </p>
                <ol className="event-list">
                  {state.events.map((event) => (
                    <li key={event.id}>
                      <span className="event-dot" />
                      <div>
                        <span className="eyebrow">
                          {formatGameTime(event.at).day} ·{" "}
                          {formatGameTime(event.at).hour}
                        </span>
                        <p>Uruchomiono sesję techniczną.</p>
                        <small>
                          Firma i mechaniki transportowe pozostają nieaktywne.
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <PixelIcon name={tab.icon} size={32} />
                </span>
                <h3>Dostępne w kolejnej fazie</h3>
                <p>{tab.description}</p>
                <span className="module-tag">PLANOWANY ETAP {tab.stage}</span>
              </div>
            )}
          </section>
          <div className="management-foot">
            <span className="tiny-square" />
            {status.mode === "active"
              ? "Silnik czasu i zapisu aktywny"
              : "Symulacja w tej karcie nie jest uruchomiona"}
          </div>
        </aside>
        <div className="world-column">
          <PolandMap />
          <Timeline time={state.time} />
        </div>
      </main>
      <footer className="footer">
        <span>
          <span className="tiny-square" />
          PixelCargo 0.1 · Faza II / 04C
        </span>
        <span>
          Zegar działa podczas otwartej sesji. Po powrocie — ostatni zapis, bez
          postępu offline.
        </span>
      </footer>
      <div
        className={`session-notice ${status.mode === "error" || status.saveError ? "error-notice" : ""}`}
      >
        <span className="notice-label">
          {status.mode === "active" ? "STATUS" : "UWAGA"}
        </span>
        <span data-testid="save-status">{status.message}</span>
        {status.mode === "waiting" && (
          <span role="alert">
            Inna karta może prowadzić tę sesję. Ta karta czeka i nie nalicza
            czasu ani nie zapisuje.
          </span>
        )}
      </div>
    </div>
  );
}
