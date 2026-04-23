import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

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
      // OneDrive-synced folders can miss file events; polling avoids stale HMR and odd Vite cache behavior.
      watch: {
        usePolling: true,
        interval: 1000,
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
        // injectManifest = full control over the service worker
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: false, // We register manually via virtual:pwa-register/react
        
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
              type: 'image/png'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
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
          // Precache ONLY hashed assets — NO html
          globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
          // Exclude admin/owner/vendor chunks from precache — not needed offline
          globIgnores: [
            '**/Admin*.js',
            '**/Owner*.js',
            '**/Vendor*.js',
            '**/MC*.js',
            '**/CRM*.js',
            '**/agent*.js',
          ],
          // Maximum file size for precache (2MB)
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
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
      include: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // ── Core React stack ──────────────────────────────────────────
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],

            // ── All Radix UI primitives in one shared chunk ───────────────
            'vendor-radix': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
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
            ],

            // ── Heavy third-party libs ────────────────────────────────────
            'vendor-motion': ['framer-motion'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-charts': ['recharts'],
            'vendor-map': ['@react-google-maps/api'],
            // jspdf, jspdf-autotable, exceljs are lazy-imported — no manual chunk needed
            'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],

          },
        },
      },
      // Real warning limit — chunks above 800KB deserve attention
      chunkSizeWarningLimit: 800,
    },
  };
});
