import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validatePublicEnv } from "./lib/env";
import { reportWebVitals } from "./lib/webVitals";
import { EnvFatalScreen } from "./components/boot/EnvFatalScreen";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

try {
  validatePublicEnv();
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  createRoot(rootEl).render(
    <StrictMode>
      <EnvFatalScreen message={message} />
    </StrictMode>
  );
}

// Report Web Vitals for performance monitoring
reportWebVitals(undefined, { debug: import.meta.env.DEV });
