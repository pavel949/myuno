import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildTimestamp = new Date().toISOString();

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
    },
    plugins: [
      react(),
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
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],

            // ── Heavy third-party libs ────────────────────────────────────
            'vendor-motion': ['framer-motion'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-charts': ['recharts'],
            'vendor-map': ['@react-google-maps/api'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'exceljs'],
            'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],

          },
        },
      },
      // Real warning limit — chunks above 800KB deserve attention
      chunkSizeWarningLimit: 800,
    },
  };
});
