import { defineConfig } from '@playwright/test';

// Synthetic, network-contained checks only. No production seed/setup hooks.
export default defineConfig({
  testDir: './e2e/operational',
  workers: 1, retries: 0, timeout: 120_000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:8098', launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 8098 --strictPort',
    url: 'http://127.0.0.1:8098', timeout: 180_000, reuseExistingServer: false,
    env: { VITE_BYPASS_COMING_SOON: 'true', VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'isolated-test-placeholder' },
  },
});
