import { useRef, useState } from "react";
import type { GameRuntime } from "../core/runtime";
import { MAX_SAVE_BYTES } from "../persistence/schema";
export function SaveControls({
  runtime,
  active,
}: {
  runtime: GameRuntime;
  active: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const perform = async (
    operation: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy(true);
    setFeedback("Trwa operacja…");
    try {
      await operation();
      setFeedback(success);
    } catch (e) {
      setFeedback(
        e instanceof Error ? e.message : "Operacja nie powiodła się.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Zarządzanie zapisem">
      <h2>Zapis lokalny</h2>
      <p>
        Dane są przechowywane w tej przeglądarce. Eksportuj kopię przed
        usunięciem danych witryny.
      </p>
      <div className="save-actions">
        <button
          disabled={!active || busy}
          onClick={() => void perform(runtime.save, "Zapisano pomyślnie.")}
        >
          Zapisz
        </button>
        <button
          disabled={!active || busy}
          onClick={() =>
            void perform(async () => {
              const text = await runtime.exportSave();
              const url = URL.createObjectURL(
                new Blob([text], { type: "application/json" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "pixelcargo-zapis.json";
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }, "Wyeksportowano zapis do pliku.")
          }
        >
          Eksportuj
        </button>
        <button
          disabled={!active || busy}
          onClick={() => input.current?.click()}
        >
          Importuj
        </button>
      </div>
      <label className="file-input">
        Plik zapisu
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          disabled={!active || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file)
              void perform(async () => {
                if (file.size > MAX_SAVE_BYTES)
                  throw new Error(
                    "Plik zapisu jest zbyt duży (maksymalnie 2 MB).",
                  );
                await runtime.importSave(await file.text());
              }, "Zaimportowano zapis.");
          }}
        />
      </label>
      <p role="status" className="feedback">
        {feedback}
      </p>
      <p>
        Automatyczny zapis co 10 sekund. Po powrocie odtwarzamy ostatni zapis —
        bez postępu offline. Import zastępuje bieżącą sesję; wcześniej
        wyeksportuj kopię.
      </p>
    </section>
  );
}
