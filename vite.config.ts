import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'vendor-motion': ['framer-motion'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-map': ['mapbox-gl'],
          // Feature chunks
          'feature-admin': [
            './src/pages/admin/AdminDashboard.tsx',
            './src/pages/admin/AdminAnalytics.tsx',
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
