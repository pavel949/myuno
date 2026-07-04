import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { reportWebVitals } from "./lib/webVitals";
import App from "./App.tsx";

function renderBootstrapError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;

  // Bootstrap error UI — runs only when React mount fails. Uses CSS variables
  // from tokens.css (imported via index.css on line 4) so colors stay canonical.
  const outer = document.createElement("div");
  outer.setAttribute("style", "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:hsl(var(--surface-raised));color:hsl(var(--ink));font-family:'Geist','Golos Text',system-ui,-apple-system,sans-serif;");

  const card = document.createElement("div");
  card.setAttribute("style", "max-width:560px;width:100%;background:hsl(var(--surface-white));border:1px solid hsl(var(--border-strong));border-radius:14px;padding:20px;");

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

// Lazy-initialize Sentry AFTER first paint to keep ~250KB out of the critical path.
// In DEV we skip entirely. In PROD we wait for `load` + idle so LCP isn't blocked.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && import.meta.env.PROD && typeof window !== "undefined") {
  const initSentry = () => {
    import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        release: `myuno@${document.querySelector('meta[name="version"]')?.getAttribute('content') ?? 'unknown'}`,
        integrations: [
          Sentry.browserTracingIntegration(),
          // PII protection: this app renders passport/visa/bank/payment data.
          // Mask ALL text and block ALL media in session replays so those never
          // leave the browser. Do NOT set these to false.
          Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        // Defence-in-depth scrubber: strip common PII from the request URL/query
        // and known sensitive fields before any event is sent to Sentry.
        beforeSend(event) {
          try {
            if (event.request?.url) {
              event.request.url = event.request.url.replace(/([?&](email|phone|token|access_token|session_id)=)[^&]+/gi, "$1[redacted]");
            }
            if (event.user) {
              delete event.user.email;
              delete event.user.ip_address;
            }
          } catch { /* never let scrubbing break error reporting */ }
          return event;
        },
      });
    }).catch(() => { /* Sentry is non-critical — silent fail */ });
  };
  const schedule = () => {
    if ("requestIdleCallback" in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
        .requestIdleCallback(initSentry, { timeout: 3000 });
    } else {
      setTimeout(initSentry, 2000);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

// Supabase URL/key are public (anon). Hardcoded fallback ensures the app boots
// on external hosts (e.g. myuno.app, Capacitor) where build-time env vars
// might not be injected. The Lovable preview/published builds still receive
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY through the platform.
reportWebVitals(undefined, { debug: import.meta.env.DEV });

// ── Service Worker: register on production, clean up everywhere else ──
// Only myuno.app / www.myuno.app (and the Capacitor WebView, which loads them)
// should run a SW. There we register the auto-updating Workbox worker so the
// app is installable in one tap and refreshes itself across deploys without a
// reinstall. On preview, sandbox, localhost, or any iframe we proactively
// unregister stale SWs (left by previous PWA builds) and clear their caches —
// this eliminates the recurring "Failed to update a ServiceWorker ... Not
// found" errors and editor reload loops.
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

  if (!isProductionHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
    return;
  }

  // Production: register the auto-updating service worker. `registerType:
  // 'autoUpdate'` bakes skipWaiting + clientsClaim into the worker, so a new
  // build installs and activates in the background. We deliberately do NOT
  // force a reload here — VersionWatcher / PWAUpdatePrompt own the "when to
  // refresh" UX so users aren't yanked mid-action. The periodic update() keeps
  // long-lived installed sessions (PWA left open for days) current.
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
          if (!registration) return;
          const ONE_HOUR = 60 * 60 * 1000;
          setInterval(() => {
            registration.update().catch(() => {});
          }, ONE_HOUR);
        },
        onRegisterError() {
          /* SW registration failure is non-fatal — the app still works online. */
        },
      });
    })
    .catch(() => {
      /* virtual:pwa-register unavailable (e.g. dev) — non-fatal. */
    });
})();

// ── HTTP 412 recovery (auth-bridge / preview proxy) ──
// Lovable's preview proxy occasionally returns 412 for auth-bridge token
// refreshes when the bundle/manifest goes stale. We can't intercept the
// initial document 412 (React isn't mounted yet), but we CAN catch 412 on
// runtime fetches: clear SW + caches and force a one-time hard reload so
// the proxy hands us a fresh token. Guarded by sessionStorage to avoid
// reload loops.
(() => {
  if (typeof window === "undefined" || !window.fetch) return;
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
    const res = await originalFetch(...args);
    if (res.status === 412) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url ?? "";
      // Only react to preview-proxy / auth-bridge 412s, not API 412s
      if (/lovableproject\.com|lovable\.app|auth-bridge|\/auth\//.test(url)) {
        void recover();
      }
    }
    return res;
  };

  // Clear the reload guard once the app boots successfully
  window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 5000);
  });
})();

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err: unknown) {
  renderBootstrapError(
    `Failed to start application: ${err instanceof Error ? err.message : String(err)}`
  );
}
