/** Browser-managed lifetime lock: closed/crashed owners release automatically.
 * Never fall back to an unsafe localStorage warning or expiring background lease. */
export class SaveOwnership {
  private abort = new AbortController();
  private release: (() => void) | null = null;
  private task: Promise<void> | null = null;
  owned = false;
  acquire(onAcquire: () => Promise<void>, onError: (error: unknown) => void) {
    if (!navigator.locks) {
      onError(
        new Error(
          "Przeglądarka nie obsługuje bezpiecznej blokady Web Locks. Użyj aktualnego Chrome, Firefox lub Edge w bezpiecznym kontekście.",
        ),
      );
      return;
    }
    this.task = navigator.locks
      .request(
        "pixelcargo-current-save",
        { mode: "exclusive", signal: this.abort.signal },
        async () => {
          const held = new Promise<void>((resolve) => {
            this.release = resolve;
          });
          this.owned = true;
          try {
            await onAcquire();
            await held;
          } finally {
            this.owned = false;
            this.release = null;
          }
        },
      )
      .then(() => undefined)
      .catch((error) => {
        if (!this.abort.signal.aborted) onError(error);
      });
  }
  async close() {
    this.abort.abort();
    this.release?.();
    await this.task;
  }
}
