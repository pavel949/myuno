// Render the real PMS booking detail with synthetic hooks; never load the app backend.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
const root = process.cwd();
const output = '/tmp/browser/pms-detail-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/hooks/useBookingStatusHistory': `export const useBookingStatusHistory=options=>{window.historyOptions=options;return {events:[],isLoading:false,error:new URLSearchParams(location.search).get('state')==='error'?new Error('Fixture denied'):null,highlightIds:new Set()};};`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/integrations/supabase/client': `throw new Error('Backend module forbidden in isolated detail');`,
};
const result = await build({
  stdin: {contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';import {BookingDetailSheet} from '${root}/src/components/owner/BookingDetailSheet.tsx';
  const params=new URLSearchParams(location.search);const state=params.get('state');
  const booking={id:'synthetic-order',order_id:'synthetic-order',property_id:'synthetic-home',owner_id:'synthetic-owner',guest_name:'Alexandra / Александра Константиновна',guest_email:'alexandra.long.synthetic.address@example.invalid',guest_phone:'+0000000000000',check_in:'2030-01-10',check_out:'2030-01-12',total_amount:0,status:state==='error'?'future_status':'checked_out',created_at:'2030-01-01T00:00:00Z',updated_at:'2030-01-01T00:00:00Z',source:'manual'};
  function App(){const [open,setOpen]=React.useState(true);const route=useLocation();return <><BookingDetailSheet open={open} onOpenChange={setOpen} booking={booking} propertyTitle="Synthetic home / Тестовый объект"/><output data-testid="destination">{route.pathname+route.search}</output></>;}
  createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/mc/bookings-list']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></MemoryRouter>);`,loader:'tsx',resolveDir:root},
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'isolate-detail-data',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return {path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved)throw Error('Unresolved import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'js',resolveDir:root}));
  }}],
});
if(Object.keys(result.metafile.inputs).some(p=>/integrations\/supabase\/client|hooks\/useBookingStatusHistory\.ts$/.test(p)))throw Error('Production data module bundled');
const css=await fetch('http://localhost:8080/src/index.css?direct');
if(!css.ok)throw Error('Preview stylesheet unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
process.exitCode=spawnSync('python3',[path.join(root,'scripts/qa/pms-detail-ui.py'),output],{stdio:'inherit'}).status??1;
