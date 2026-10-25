import { createRoot } from "react-dom/client";
import { GameRuntime } from "./core/runtime";
import { App } from "./ui/App";
import { PreviewApp } from "./preview/PreviewApp";
import "./ui/styles.css";
import "./preview/preview.css";
import "./preview/base.css";
const runtime = new GameRuntime();
runtime.start();
createRoot(document.getElementById("root")!).render(
  new URLSearchParams(window.location.search).has("preview")
    ? <PreviewApp runtime={runtime} />
    : <App runtime={runtime} />,
);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    void runtime.close();
  });
