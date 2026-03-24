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
      host: "::",
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
          theme_color: '#d4af37',
          background_color: '#0a0a0b',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          id: '/myuno-pwa-2025',
          scope: '/',
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
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
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
