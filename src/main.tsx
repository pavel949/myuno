import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validatePublicEnv } from "./lib/env";
import { reportWebVitals } from "./lib/webVitals";
import { EnvFatalScreen } from "./components/boot/EnvFatalScreen";
import { APP_VERSION } from "./lib/appVersion";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

function setupChunkRecovery() {
  const reloadKey = `myuno_chunk_reload_${APP_VERSION}`;

  const trySingleHardReload = () => {
    if (sessionStorage.getItem(reloadKey)) return;
    sessionStorage.setItem(reloadKey, "1");
    window.location.reload();
  };

  window.addEventListener("error", (event) => {
    const target = event.target as HTMLScriptElement | HTMLLinkElement | null;
    const src = target && ("src" in target ? target.src : "href" in target ? target.href : "");
    if (typeof src === "string" && src.includes("/assets/")) {
      trySingleHardReload();
      return;
    }
    const msg = event.message || "";
    if (/ChunkLoadError|Failed to fetch dynamically imported module/i.test(msg)) {
      trySingleHardReload();
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = String(event.reason || "");
    if (/ChunkLoadError|Failed to fetch dynamically imported module|Loading chunk \d+ failed/i.test(reason)) {
      trySingleHardReload();
    }
  });
}

try {
  validatePublicEnv();
  setupChunkRecovery();
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
