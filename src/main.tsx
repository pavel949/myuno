import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import { reportWebVitals } from "./lib/webVitals";
import App from "./App.tsx";

function renderBootstrapError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;

  const outer = document.createElement("div");
  outer.setAttribute("style", "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#fafaf9;color:#1a1a19;font-family:'Golos Text',system-ui,-apple-system,sans-serif;");

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

Sentry.addBreadcrumb({ category: "bootstrap", level: "info", message: "bootstrap.start" });

// Supabase URL/key are public (anon). Hardcoded fallback ensures the app boots
// on external hosts (e.g. myuno.app, Capacitor) where build-time env vars
// might not be injected. The Lovable preview/published builds still receive
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY through the platform.
reportWebVitals(undefined, { debug: import.meta.env.DEV });

// ── Manual kill-switch ──
// If a user gets stuck behind a stale Service Worker, instructing them to run
// `localStorage.setItem("myuno_force_unregister_sw","1")` and reload will hit
// this branch on the next boot, force-unregister all SWs and caches, and reload
// once. The flag is consumed (removed) so the next boot is clean.
(() => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("myuno_force_unregister_sw") !== "1") return;
  Sentry.addBreadcrumb({ category: "bootstrap", level: "warning", message: "bootstrap.kill_switch_triggered" });
  localStorage.removeItem("myuno_force_unregister_sw");
  (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
      }
    } finally {
      window.location.reload();
    }
  })();
})();

// ── Service Worker cleanup on non-production hosts ──
// Only myuno.app / www.myuno.app should keep a registered SW. On preview,
// sandbox, localhost, or any iframe we proactively unregister stale SWs
// (left by previous PWA builds) and clear their caches. This eliminates
// the recurring "Failed to update a ServiceWorker ... Not found" errors.
(() => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const isProductionHost = host === "myuno.app" || host === "www.myuno.app";
  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  if (isProductionHost && !isInIframe) return;

  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister().catch(() => {}));
  }).catch(() => {});

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k).catch(() => {}));
    }).catch(() => {});
  }
})();

Sentry.addBreadcrumb({ category: "bootstrap", level: "info", message: "bootstrap.sw_cleanup_done" });

// ── HTTP 412 recovery (auth-bridge / preview proxy) ──
// Lovable's preview proxy occasionally returns 412 for auth-bridge token
// refreshes when the bundle/manifest goes stale. On production myuno.app the
// proxy isn't in the path, so we skip the recovery entirely there to avoid
// catching legitimate Supabase /auth/v1/token 412s and reload-looping users.
(() => {
  if (typeof window === "undefined" || !window.fetch) return;
  const host = window.location.hostname;
  const isProductionHost = host === "myuno.app" || host === "www.myuno.app";
  if (isProductionHost) return;

  const RELOAD_KEY = "__myuno_412_reload__";
  const originalFetch = window.fetch.bind(window);

  const recover = async () => {
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
      }
    } catch {
      /* noop */
    }
    window.location.reload();
  };

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const res = await originalFetch(...args);
      if (res.status === 412) {
        const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url ?? "";
        // Only react to preview-proxy / auth-bridge 412s, never to Supabase API 412s
        if (/lovableproject\.com|lovable\.app|auth-bridge/.test(url)) {
          void recover();
        }
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 5000);
  });
})();

Sentry.addBreadcrumb({ category: "bootstrap", level: "info", message: "bootstrap.412_interceptor_installed" });

try {
  Sentry.addBreadcrumb({ category: "bootstrap", level: "info", message: "bootstrap.before_create_root" });
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  Sentry.addBreadcrumb({ category: "bootstrap", level: "info", message: "bootstrap.after_render" });
  // Marker consumed by the 15s splash-timeout fallback in index.html.
  (window as unknown as { __uno_render_marker?: boolean }).__uno_render_marker = true;
} catch (err: unknown) {
  Sentry.captureException(err, { tags: { phase: "bootstrap" } });
  renderBootstrapError(
    `Failed to start application: ${err instanceof Error ? err.message : String(err)}`
  );
}
