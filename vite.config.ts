import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['mapbox-gl'],
          'feature-admin': [
            './src/pages/admin/AdminDashboard.tsx',
            './src/pages/admin/AcquisitionMetrics.tsx',
          ],
          'feature-vendor': [
            './src/pages/vendor/VendorDashboard.tsx',
            './src/pages/vendor/VendorAnalytics.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
