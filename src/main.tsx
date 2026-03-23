import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validatePublicEnv } from "./lib/env";
import { reportWebVitals } from "./lib/webVitals";

validatePublicEnv();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Report Web Vitals for performance monitoring
reportWebVitals(undefined, { debug: import.meta.env.DEV });
