import { createRoot } from "react-dom/client";
import { GameRuntime } from "./core/runtime";
import { App } from "./ui/App";
import { PreviewApp } from "./preview/PreviewApp";
import { PreviewSession } from "./preview/session";
import "./ui/styles.css";
import "./preview/preview.css";
import "./preview/base.css";
const runtime = new GameRuntime();
const preview = new PreviewSession(runtime,window.localStorage);
const detachPreview=preview.attach(window);
runtime.start();
createRoot(document.getElementById("root")!).render(
  new URLSearchParams(window.location.search).has("dev")
    ? <App runtime={runtime} />
    : <PreviewApp runtime={runtime} session={preview} />,
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    detachPreview();
    preview.close();
    void runtime.close();
  });
