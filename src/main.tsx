import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import { reportWebVitals } from "./lib/webVitals";

function renderBootstrapError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;

  const outer = document.createElement("div");
  outer.setAttribute("style", "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#fafaf9;color:#1a1a19;font-family:'DM Sans',system-ui,-apple-system,sans-serif;");

  const card = document.createElement("div");
  card.setAttribute("style", "max-width:560px;width:100%;background:#fff;border:1px solid #e5e5e4;border-radius:14px;padding:20px;");

  const heading = document.createElement("h1");
  heading.setAttribute("style", "font-size:18px;line-height:1.3;margin:0 0 10px;");
  heading.textContent = "App configuration error";

  const msgEl = document.createElement("p");
  msgEl.setAttribute("style", "margin:0 0 12px;line-height:1.5;");
  msgEl.textContent = message;

  const hint = document.createElement("p");
  hint.setAttribute("style", "margin:0;line-height:1.5;");
  hint.textContent = "Create .env from .env.example and restart npm run dev.";

  card.append(heading, msgEl, hint);
  outer.append(card);
  root.replaceChildren(outer);
}

// Initialize Sentry for production error monitoring
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: `myuno@${document.querySelector('meta[name="version"]')?.getAttribute('content') ?? 'unknown'}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (import.meta.env.DEV) return null;
      return event;
    },
  });
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  renderBootstrapError(
    "Missing required env vars: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
} else {
  reportWebVitals(undefined, { debug: import.meta.env.DEV });
  void import("./App.tsx")
    .then(({ default: App }) => {
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    })
    .catch((err: unknown) => {
      renderBootstrapError(
        `Failed to load application: ${err instanceof Error ? err.message : String(err)}`
      );
    });
}
