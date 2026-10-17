// Test-only browser bundle: never boot the SPA or import its database client.
// Run: node scripts/qa/bookings-list-ui.mjs (preview server supplies CSS only).
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const root = process.cwd();
const output = '/tmp/browser/bookings-list-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage = () => ({language: new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ru'});`,
  '@/contexts/CurrencyContext': `export const useCurrency = () => ({formatPrice: n => new Intl.NumberFormat(new URLSearchParams(location.search).get('lang') === 'en' ? 'en-US' : 'ru-RU', {style:'currency',currency:'THB'}).format(n)});`,
  '@/hooks/useCityCurrency': `export const useCityCurrency = () => ({code:'THB'});`,
  '@/hooks/usePropertyBookings': `import {bookingsListFixtures} from '${root}/src/pages/owner/__tests__/bookingsList.fixtures.ts'; export const useAllPropertyBookings = () => ({bookings:bookingsListFixtures(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ru'),isLoading:false});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic = () => {};`,
  '@/integrations/supabase/client': `window.fixtureCalls=[]; export const supabase={from: table => ({update: values => ({in: (key,ids) => {window.fixtureCalls.push({table,values,key,ids}); return Promise.resolve({error: new Error('Fixture-only rejection')});}})})};`,
  'sonner': `export const toast={error:()=>{window.fixtureError=true;}};`,
  '@/components/owner/BookingDetailSheet': `import React from 'react'; export function BookingDetailSheet({open,booking,onOpenChange}) {return open ? React.createElement('div',{role:'dialog','aria-label':'Fixture booking details'},booking.id,React.createElement('button',{onClick:()=>onOpenChange(false)},'Close fixture')) : null;}`,
};
await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom'; import Page from '${root}/src/pages/owner/MCBookingsPage.tsx'; createRoot(document.getElementById('root')).render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Page/></MemoryRouter>);`, loader:'tsx', resolveDir:root },
  bundle:true, outfile:path.join(output,'fixture.js'), jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'isolate-all-data-boundaries',setup(b) {
    b.onResolve({filter:/.*/},args => {
      if (Object.hasOwn(virtual,args.path)) return {path:args.path,namespace:'fixture'};
      if (args.path.startsWith('@/')) {
        const base = path.join(root,'src',args.path.slice(2));
        const resolved = [base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p));
        if (!resolved) throw new Error('Unresolved test import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args => ({contents:virtual[args.path],loader:'js',resolveDir:root}));
  }}],
});
// Uses the same preview-generated stylesheet, not a recreated design system.
const css = await fetch('http://localhost:8080/src/index.css?direct');
if (!css.ok) throw new Error('Preview stylesheet unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
const result = spawnSync('python3',[path.join(root,'scripts/qa/bookings-list-ui.py'),output],{stdio:'inherit'});
process.exitCode = result.status ?? 1;