import { createRoot } from "react-dom/client";
import { GameRuntime } from "./core/runtime";
import { App } from "./ui/App";
import "./ui/styles.css";
const runtime = new GameRuntime();
runtime.start();
createRoot(document.getElementById("root")!).render(<App runtime={runtime} />);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    void runtime.close();
  });
