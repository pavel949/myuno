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
          // Group large, commonly-shared vendor libs into stable chunks.
          // Libraries that must preserve tree-shaking (lucide-react) or are
          // already lazy-loaded from specific pages (exceljs, jspdf, html2canvas)
          // are intentionally NOT listed here — Vite will auto-split them.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.match(/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)\//)) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui/')) return 'vendor-radix';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@react-google-maps')) return 'vendor-map';
            if (id.match(/(react-hook-form|@hookform|zod)\//)) return 'vendor-form';
            if (id.match(/(date-fns|papaparse|dompurify)/)) return 'vendor-utils';
            if (id.includes('@supabase')) return 'vendor-supabase';
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
