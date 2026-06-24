import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Lucide icon strategy:
// We tried tiered chunking (core/extended/rare) — it didn't reduce the entry
// preload because lucide-react's barrel re-exports every icon, so Rollup
// links the entry to *all* tier chunks regardless of `manualChunks` returns
// (see /mnt/documents/perf-report-lucide-split.md). Single `vendor-icons`
// chunk + isolated `vendor-icons-dynamic-map` for `<DynamicIcon>` lazy loads
// gives one preload file instead of three.

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const buildTimestamp = new Date().toISOString();

  // Public Supabase config — safe to ship in client bundle (anon key + URL).
  // Hardcoded fallback ensures the app boots on every host (myuno.app,
  // Capacitor native shells, custom deployments) even when build-time env
  // vars aren't injected by the hosting platform.
  const SUPABASE_URL_FALLBACK = "https://kakkwibljrjsawxgnupk.supabase.co";
  const SUPABASE_ANON_KEY_FALLBACK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtha2t3aWJsanJqc2F3eGdudXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDM3MDAsImV4cCI6MjA4MzQ3OTcwMH0.0UOwpxLxDdxh_hpS_KXf_xnArkJjKCMmMXh_s5y5Cmk";
  const SUPABASE_PROJECT_ID_FALLBACK = "kakkwibljrjsawxgnupk";

  const supabaseUrl = process.env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY_FALLBACK;
  const supabaseProjectId = process.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_PROJECT_ID_FALLBACK;

  return {
    server: {
      // `true` is more reliable than `::` on Windows / embedded browser previews (Cursor Simple Browser).
      host: true,
      port: 8080,
      // When 8080 is taken Vite picks the next free port. Embedded previews (Cursor / Lovable)
      // often probe :8080 first — if something else is bound there you get a blank iframe while
      // Vite is actually on :8081+. Free 8080 or stop the other process.
      //
      // Avoid timing-out clients while Vite is still pre-bundling on first hit.
      // The Lovable iframe preview and Playwright otherwise see HTTP 504 from
      // the dev server middleware on cold start with our large module graph.
      hmr: {
        overlay: false,
      },
      // OneDrive-synced folders can miss file events; polling avoids stale HMR and odd Vite cache behavior.
      watch: {
        usePolling: true,
        interval: 1000,
      },
      // Warm common entry points at startup so the first request doesn't pay
      // the entire transform cost. Keep this list short — only top-of-graph.
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/pages/Index.tsx',
        ],
      },
    },
    preview: {
      host: true,
      port: 8080,
    },
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(supabaseProjectId),
    },
    // Bible-v2 §00 H14: no console in production. Strip console.* + debugger
    // statements at build time; dev server keeps them for local debugging.
    esbuild: command === "build" ? { drop: ["console", "debugger"] } : undefined,
    plugins: [
      react(),
      // Cursor / VS Code Simple Browser loads URLs inside an iframe; CSP
      // frame-ancestors 'none' in index.html blocks that and yields a blank preview.
      // Applies to `vite` and `vite preview` (both command === "serve"), not to `vite build`
      // so production artifacts in dist/ keep the strict meta tag.
      command === "serve" && {
        name: "csp-allow-embedded-dev-preview",
        transformIndexHtml(html: string) {
          // Replace the whole CSP for dev/preview: partial connect-src patches miss
          // `host: true` (LAN IP) + alternate ports, which leaves Simple Browser / iframes blank.
          return html.replace(
            /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/>/i,
            '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://maps.googleapis.com https://maps.gstatic.com; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; img-src \'self\' data: https: blob:; font-src \'self\' https://fonts.gstatic.com; connect-src * blob: data:; worker-src \'self\' blob:; frame-ancestors *; base-uri \'self\'; form-action \'self\';" />',
          );
        },
      },
      mode === "development" && componentTagger(),
      VitePWA({
        // Auto-updating Workbox service worker. Two jobs:
        //  1. Installability — a SW with a fetch handler + the manifest below
        //     satisfies Chrome/Edge install criteria so `beforeinstallprompt`
        //     fires and the in-app "Install" button is a genuine one-tap install.
        //  2. Auto-update without reinstall — each deploy ships a new precache
        //     revision; the SW installs it in the background, `skipWaiting` +
        //     `clientsClaim` activate it immediately, and `cleanupOutdatedCaches`
        //     evicts the old shell. The next reload (driven by VersionWatcher /
        //     PWAUpdatePrompt) serves the fresh build — no app-store reinstall,
        //     and the same flow updates the Capacitor WebView shells.
        // Registered manually in src/main.tsx (production host only).
        registerType: 'autoUpdate',
        injectRegister: false,

        manifest: {
          name: 'myUNO — Phuket SuperApp',
          short_name: 'myUNO',
          description: 'Digital infrastructure for foreigners in Phuket: rentals, services, legal help and real estate deals in one app.',
          // PWA manifest spec (https://www.w3.org/TR/appmanifest/#theme_color-member)
          // requires literal CSS color strings; CSS variables are not resolved at
          // install time. Synced 2026-06-18 with DS 2.1 navy palette.
          // eslint-disable-next-line no-restricted-syntax
          theme_color: '#0A2240',
          // eslint-disable-next-line no-restricted-syntax
          background_color: '#0A2240',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/?source=pwa',
          // IMPORTANT: keep id stable — changing it makes browsers treat the PWA as a new app,
          // breaking updates for users who already installed myUNO.
          id: '/myuno-pwa-2025',
          scope: '/',
          lang: 'ru',
          dir: 'ltr',
          categories: ['lifestyle', 'travel', 'productivity'],
          prefer_related_applications: false,
          icons: [
            { src: '/icons/icon-72x72.png',      sizes: '72x72',   type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-120x120.png',    sizes: '120x120', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-152x152.png',    sizes: '152x152', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-180x180.png',    sizes: '180x180', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-192x192.png',    sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512x512.png',    sizes: '512x512', type: 'image/png', purpose: 'any' },
            // Maskable variants — drawn with safe zone so Android launchers
            // don't crop the logo when applying their adaptive icon mask.
            { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // Screenshots trigger Chrome's richer install UI (looks like Play Store)
          screenshots: [
            {
              src: '/screenshots/mobile-home.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'myUNO — главный экран',
            },
            {
              src: '/screenshots/mobile-services.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Все сервисы в одном приложении',
            },
          ],
          // Quick actions from long-press on app icon
          shortcuts: [
            {
              name: 'Property Search',
              short_name: 'Property',
              url: '/property',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Newbuilds',
              short_name: 'Newbuilds',
              url: '/newbuilds',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Discover',
              short_name: 'Discover',
              url: '/discover',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        
        includeAssets: ['favicon.ico', 'icons/*.png'],

        workbox: {
          // Precache only the app shell (HTML/CSS/icons/manifest) so install
          // stays light — the 557-route JS graph is cached at runtime on demand
          // (see runtimeCaching) instead of force-downloading every chunk up front.
          globPatterns: ['**/*.{css,html,ico,svg,webmanifest}', 'icons/**/*.png'],
          // Old precache revisions are content-hashed; remove them on activate so
          // a stale shell can never be served after a deploy.
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          // SPA: serve the cached index.html for navigations (incl. offline launch),
          // which is also what makes the app installable.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/auth\//,
            /^\/functions\//,
            /\/version\.json$/,
          ],
          runtimeCaching: [
            {
              // Hashed JS/CSS/worker chunks — safe to cache, revalidate in the
              // background so a new deploy's chunks are picked up without a wipe.
              urlPattern: ({ request }) =>
                request.destination === 'script' ||
                request.destination === 'style' ||
                request.destination === 'worker',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'myuno-assets',
                expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'myuno-images',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === 'https://fonts.googleapis.com' ||
                url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },

        devOptions: {
          enabled: false,
        },
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    optimizeDeps: {
      // Eagerly pre-bundle the heavy hitters used across hundreds of files.
      // Without this, Vite discovers them lazily on the first request to each
      // route and clients (incl. Playwright + Lovable preview) hit 504 because
      // the dev server is busy esbuild-bundling 1000+ modules mid-request.
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router-dom',
        'react-helmet-async',
        '@tanstack/react-query',
        
        '@supabase/supabase-js',
        '@lovable.dev/cloud-auth-js',
        'framer-motion',
        'lucide-react',
        'date-fns',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
        'sonner',
        'zod',
        'react-hook-form',
        '@hookform/resolvers/zod',
        'dompurify',
        '@sentry/react',
        '@react-google-maps/api',
        '@radix-ui/react-accordion',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-label',
        '@radix-ui/react-popover',
        '@radix-ui/react-progress',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        '@radix-ui/react-separator',
        '@radix-ui/react-slider',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-visually-hidden',
      ],
      // Tell esbuild to crawl the actual entry once at startup so most deps
      // are discovered up-front, not lazily on first request per route.
      entries: ['./index.html', './src/main.tsx'],
      // Increase esbuild's concurrency budget on large graphs.
      esbuildOptions: {
        target: 'es2020',
      },
    },
    build: {
      // Terser produces ~25-30% smaller output than esbuild on barrel re-exporting
      // libraries like lucide-react (vendor-icons chunk was flagged by Lighthouse
      // `unminified-javascript` at 30% wasted bytes with esbuild). 2026-06-18.
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true, passes: 2 },
        format: { comments: false },
      },
      // Selective modulePreload: by default Vite injects <link rel="modulepreload">
      // for ALL dynamic-import dependencies discovered in the graph, which means
      // the home page eagerly downloads vendor-pdf/charts/map/excel even though
      // they're only needed on lazy routes. Strip those preload hints so the
      // chunks are fetched only when the user navigates to the consuming route.
      // (Lighthouse `unused-javascript` dropped from ~600KB to expected ~50KB.)
      modulePreload: {
        resolveDependencies: (_filename, deps) => {
          const skip = /(vendor-(pdf|charts|html2canvas|excel|map|sentry|sanitize)|MapView|Calendar|DeveloperAnalytics|OwnerRevenueDashboard)/i;
          return deps.filter((d) => !skip.test(d));
        },
      },
      rollupOptions: {
        output: {
          /**
           * Code-splitting strategy:
           *  - Heavy 3rd-party libs go into named `vendor-*` chunks for stable long-term caching.
           *  - Lazy-only deps (jspdf, exceljs, html2canvas) get their own chunks so they
           *    are NEVER bundled into the initial App graph or any route chunk.
           *  - Unbucketed node_modules are left to Rollup (no catch-all `vendor-misc`).
           *    A single misc bucket created circular chunk graphs with `vendor-radix`
           *    in production → runtime "is not a function" from bad import order.
           *  - Application code (`src/**`) is left to Rollup's automatic splitting,
           *    which respects per-route lazy() boundaries from pageRegistry.ts.
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;

            // Heavy lazy-only libs — kept fully separate so they never bloat
            // the initial graph or any route chunk.
            if (id.includes('jspdf-autotable')) return 'vendor-pdf';
            if (id.includes('node_modules/jspdf')) return 'vendor-pdf';
            if (id.includes('html2canvas')) return 'vendor-html2canvas';
            if (id.includes('exceljs')) return 'vendor-excel';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@react-google-maps')) return 'vendor-map';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('dompurify')) return 'vendor-sanitize';

            // Stable cache groups — change rarely → long-lived browser cache.
            // IMPORTANT: react-core stays as ONE chunk together with scheduler
            // and jsx-runtime to avoid TDZ / circular-init errors in prod.
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime')
            ) {
              return 'vendor-react';
            }
            if (id.includes('react-router') || id.includes('@remix-run/router') || id.includes('history')) {
              return 'vendor-router';
            }
            if (id.includes('@supabase') || id.includes('@lovable.dev/cloud-auth-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Radix UI + overlay stack must live in ONE Rollup chunk. A 3-way split
            // (overlays vs core vs forms) created circular chunk edges per Rollup:
            //   vendor-radix-overlays → vendor-radix-core → vendor-misc → overlays
            // which surfaced in production as minified "… is not a function" crashes
            // (broken live graph import order).
            if (
              id.includes('@radix-ui') ||
              id.includes('react-remove-scroll') ||
              id.includes('aria-hidden') ||
              id.includes('@floating-ui')
            ) {
              return 'vendor-radix';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              // NOTE: tiered split (core/extended/rare) was abandoned because
              // lucide-react's barrel re-exports all icons through a single
              // module graph: Rollup ends up co-locating every used icon
              // regardless of the manualChunks return value, while the
              // entry chunk gains a static import of *all three* tier
              // chunks → triple preload on the home page (see
              // perf-report-lucide-split.md). Keeping a single
              // `vendor-icons` chunk preloads exactly one file. Routes that
              // need on-demand icons should use `<DynamicIcon>` (lazy via
              // `vendor-icons-dynamic-map`) — that path is preserved.
              if (/lucide-react\/dist\/esm\/dynamicIconImports\.js$/.test(id)) {
                return 'vendor-icons-dynamic-map';
              }
              return 'vendor-icons';
            }
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('node_modules/zod/')
            ) {
              return 'vendor-forms';
            }
            if (
              id.includes('date-fns') ||
              id.includes('node_modules/clsx/') ||
              id.includes('class-variance-authority') ||
              id.includes('tailwind-merge')
            ) {
              return 'vendor-utils';
            }

            return undefined;
          },
        },
      },
      // Hidden sourcemaps: generated to dist/ so Sentry & error-reporters can
      // de-minify stacks, but no //# sourceMappingURL comment — files are not
      // linked from public JS, so casual visitors don't see them. (Lighthouse
      // best-practices `valid-source-maps` now passes.)
      sourcemap: 'hidden',
      // Real warning limit — chunks above 800KB deserve attention
      chunkSizeWarningLimit: 800,
    },
  };
});
