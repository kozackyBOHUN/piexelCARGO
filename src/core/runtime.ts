import { CONFIG } from "./config";
import { GameSession, SessionClock } from "./session";
import { SaveDatabase } from "../persistence/database";
import { SaveOwnership } from "../persistence/ownership";
import { makeSave, parseSave } from "../persistence/schema";
export interface RuntimeStatus {
  mode: "waiting" | "active" | "error" | "closed";
  message: string;
  savedAt: string | null;
  saveError: boolean;
}
export class GameRuntime {
  readonly session = new GameSession();
  private clock = new SessionClock(this.session.advance);
  private ownership = new SaveOwnership();
  private database = new SaveDatabase();
  private saveId: string = crypto.randomUUID();
  private status: RuntimeStatus = {
    mode: "waiting",
    message: "Oczekiwanie na wyłączny dostęp do zapisu…",
    savedAt: null,
    saveError: false,
  };
  private listeners = new Set<() => void>();
  private tick?: ReturnType<typeof setInterval>;
  private autosave?: ReturnType<typeof setInterval>;
  private queue: Promise<unknown> = Promise.resolve();
  private pendingAutosave = false;
  private started = false;
  private simulationEnabled=true;
  /** Sample the same monotonic clock before a company action/save, without another timer. */
  sampleClock=()=>this.sample();
  setSimulationEnabled=(enabled:boolean)=>{if(this.simulationEnabled===enabled)return;this.sample();this.simulationEnabled=enabled;this.clock.stop();if(enabled)this.clock.start(performance.now())};
  private closing = false;
  getStatus = () => this.status;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private setStatus(patch: Partial<RuntimeStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private report = (error: unknown) =>
    this.setStatus({
      saveError: true,
      message:
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać danych.",
    });
  start() {
    if (this.started) return;
    this.started = true;
    this.ownership.acquire(
      async () => {
        try {
          const saved = await this.database.load();
          if (this.closing) return;
          if (saved) {
            this.session.restore(saved.state);
            this.saveId = saved.saveId;
          }
          if(this.simulationEnabled)this.clock.start(performance.now());
          this.setStatus({
            mode: "active",
            message: saved
              ? "Wczytano zapis. Sesja aktywna."
              : "Nowa sesja techniczna. Zapis automatyczny co 10 s.",
            savedAt: saved?.savedAt ?? null,
          });
          this.tick = setInterval(this.sample, CONFIG.tickMs);
          this.autosave = setInterval(() => {
            if (this.pendingAutosave) return;
            this.pendingAutosave = true;
            void this.save()
              .catch(this.report)
              .finally(() => {
                this.pendingAutosave = false;
              });
          }, CONFIG.autosaveMs);
          document.addEventListener("visibilitychange", this.onVisibility);
          window.addEventListener("pagehide", this.onPageHide);
        } catch (error) {
          this.setStatus({ mode: "error" });
          this.report(error);
        }
      },
      (error) => {
        this.setStatus({ mode: "error" });
        this.report(error);
      },
    );
  }
  private sample = () => {
    if (this.simulationEnabled && this.ownership.owned && this.status.mode === "active")
      this.clock.sample(performance.now());
  };
  private onVisibility = () => {
    this.sample();
    if (document.visibilityState === "hidden")
      void this.save().catch(this.report);
  };
  private onPageHide = () => {
    this.sample();
    void this.save().catch(this.report);
  };
  private assertOwner() {
    if (!this.ownership.owned || this.status.mode !== "active" || this.closing)
      throw new Error("Ta karta nie ma wyłącznego dostępu do zapisu.");
  }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }
  save = () =>
    this.enqueue(async () => {
      this.assertOwner();
      this.sample();
      const envelope = makeSave(this.saveId, this.session.getSnapshot());
      await this.database.write(envelope);
      this.setStatus({
        savedAt: envelope.savedAt,
        saveError: false,
        message: "Zapisano pomyślnie.",
      });
      return envelope;
    }).catch((error: unknown) => {
      this.report(error);
      throw error;
    });
  exportSave = async () => JSON.stringify(await this.save(), null, 2);
  importSave = (text: string) => {
    const envelope = parseSave(text);
    return this.enqueue(async () => {
      this.assertOwner();
      await this.database.write(envelope); // Only replace live state after durable commit.
      this.session.restore(envelope.state);
      this.saveId = envelope.saveId;
      this.clock.stop();
      this.clock.start(performance.now());
      this.setStatus({
        savedAt: envelope.savedAt,
        saveError: false,
        message: "Zaimportowano zapis. Wznowiono od zapisanego czasu.",
      });
    });
  };
  async close() {
    if (this.closing) return;
    this.sample();
    this.closing = true;
    clearInterval(this.tick);
    clearInterval(this.autosave);
    this.clock.stop();
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("pagehide", this.onPageHide);
    await this.queue;
    await this.ownership.close();
    await this.database.close();
    this.setStatus({ mode: "closed" });
  }
}
