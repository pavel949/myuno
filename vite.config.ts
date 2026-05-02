import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import iconClassification from "./scripts/icon-classification.json";

// Lucide icon split: keep top-used icons hot, push the rest into lazy chunks
// that load only with the routes that import them.
// See `scripts/icon-classification.json` (regenerate via scripts/regen-icon-classification.mjs).
const ICONS_CORE = new Set<string>(iconClassification.core);
const ICONS_EXTENDED = new Set<string>(iconClassification.extended);
// `rare` is the implicit fallback for everything else.
function classifyLucideIcon(id: string): 'vendor-icons-core' | 'vendor-icons-extended' | 'vendor-icons-rare' {
  // Match `.../lucide-react/dist/esm/icons/<name>.js` (works on Windows too — id uses /).
  const m = id.match(/lucide-react\/dist\/esm\/icons\/([a-z0-9-]+)\.js$/);
  if (!m) return 'vendor-icons-core'; // barrel + shared internals stay in core
  const name = m[1];
  if (ICONS_CORE.has(name)) return 'vendor-icons-core';
  if (ICONS_EXTENDED.has(name)) return 'vendor-icons-extended';
  return 'vendor-icons-rare';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
    plugins: [
      react(),
      // Cursor / VS Code Simple Browser loads dev URLs inside an iframe; CSP
      // frame-ancestors 'none' in index.html blocks that and yields a blank preview.
      mode === "development" && {
        name: "csp-allow-embedded-dev-preview",
        transformIndexHtml(html: string) {
          let out = html.replace(/frame-ancestors 'none';/g, "frame-ancestors *;");
          // Vite HMR uses ws: to the dev server; strict connect-src can block it in embedded previews.
          out = out.replace(
            /connect-src 'self'/,
            "connect-src 'self' ws://127.0.0.1:* ws://localhost:* wss://127.0.0.1:* wss://localhost:*"
          );
          return out;
        },
      },
      mode === "development" && componentTagger(),
      VitePWA({
        // Temporary kill-switch worker: clears stale production caches that kept
        // serving old split chunks, then unregisters itself.
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: false,
        
        manifest: {
          name: 'myUNO - All Services in One',
          short_name: 'myUNO',
          description: 'Все услуги в одном приложении',
          theme_color: '#00D68F',
          background_color: '#08101E',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          id: '/myuno-pwa-2025',
          scope: '/',
          // Tells Android to prefer opening the installed PWA over the browser
          prefer_related_applications: false,
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            // Maskable variants — drawn with safe zone so Android launchers
            // don't crop the logo when applying their adaptive icon mask.
            {
              src: '/icons/icon-maskable-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          // Screenshots trigger Chrome's richer install UI (looks like Play Store)
          screenshots: [
            {
              src: '/screenshots/mobile-home.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'myUNO Home Screen'
            },
            {
              src: '/screenshots/mobile-services.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'All Services in One App'
            }
          ],
          // Quick actions from long-press on app icon
          shortcuts: [
            {
              name: 'Property Search',
              short_name: 'Property',
              url: '/property',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Restaurants',
              short_name: 'Food',
              url: '/restaurants',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Transport',
              short_name: 'Transport',
              url: '/transport',
              icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        
        includeAssets: ['favicon.ico', 'icons/*.png'],
        
        injectManifest: {
          injectionPoint: undefined,
          globPatterns: [],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
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
      rollupOptions: {
        output: {
          /**
           * Code-splitting strategy:
           *  - Heavy 3rd-party libs go into named `vendor-*` chunks for stable long-term caching.
           *  - Lazy-only deps (jspdf, exceljs, html2canvas) get their own chunks so they
           *    are NEVER bundled into the initial App graph or any route chunk.
           *  - Everything else from node_modules falls into `vendor-misc`.
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
            // Split Radix into 3 sub-chunks so heavy overlays (dialog/popover/select/…)
            // don't drag the rest of the UI primitives into the critical path.
            // See .lovable/plan.md — Шаг 3 (vendor-radix split).
            if (id.includes('@radix-ui')) {
              if (
                id.includes('react-dialog') ||
                id.includes('react-alert-dialog') ||
                id.includes('react-popover') ||
                id.includes('react-dropdown-menu') ||
                id.includes('react-select') ||
                id.includes('react-tooltip') ||
                id.includes('react-scroll-area') ||
                id.includes('react-hover-card') ||
                id.includes('react-context-menu') ||
                id.includes('react-menubar') ||
                id.includes('react-navigation-menu')
              ) {
                return 'vendor-radix-overlays';
              }
              if (
                id.includes('react-checkbox') ||
                id.includes('react-radio-group') ||
                id.includes('react-switch') ||
                id.includes('react-slider') ||
                id.includes('react-toggle') ||
                id.includes('react-toggle-group') ||
                id.includes('react-label') ||
                id.includes('react-form')
              ) {
                return 'vendor-radix-forms';
              }
              return 'vendor-radix-core';
            }
            if (id.includes('react-remove-scroll') || id.includes('aria-hidden')) {
              // Used primarily by overlays — co-locate to avoid extra round-trip.
              return 'vendor-radix-overlays';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
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

            return 'vendor-misc';
          },
        },
      },
      // Real warning limit — chunks above 800KB deserve attention
      chunkSizeWarningLimit: 800,
    },
  };
});
