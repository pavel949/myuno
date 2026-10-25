import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
export default defineConfig({ optimizeDeps: { entries: ['e2e/newbuilds/index.html'] }, plugins: [react()], resolve: { alias: [
  { find: '@/integrations/supabase/client', replacement: path.resolve('e2e/newbuilds/stubs/supabase.ts') },
  { find: '@/contexts/LanguageContext', replacement: path.resolve('e2e/newbuilds/stubs/context.ts') },
  { find: '@/contexts/AuthContext', replacement: path.resolve('e2e/newbuilds/stubs/context.ts') },
  { find: '@', replacement: path.resolve('src') },
] }, server: { host: '127.0.0.1', port: 8107 } });
