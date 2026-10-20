// Real moderation queue/dashboard components and router/query provider; synthetic reads.
// --bundle-only compiles JS/CSS/HTML without a browser or application server.
// The browser runner fulfills local fixture assets and blocks every other request.
import { build } from 'esbuild';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// These paths also enter generated import strings; avoid Windows escape sequences.
const root = process.cwd().replaceAll('\\', '/');
const output = path.join(process.env.TEMP || '/tmp', 'browser', 'moderation-queue-isolated');
await mkdir(output, { recursive: true });

const virtual = {
  // New complex queue has its own real-form, synthetic-write fixture.
  '@/components/admin/operations/ManagedComplexReviewQueue': `export const ManagedComplexReviewQueue=()=>null;`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-admin'},isLoading:false});`,
  '@/hooks/useAdmin': `export const useAdminCheck=()=>({isAdmin:true,isLoading:false});`,
  '@/hooks/useAdminDashboardStats': `
    const data={
      providers:0,services:0,activeProviders:0,pendingProviders:0,
      yachts:0,tours:0,properties:0,restaurants:0,salons:0,clinics:0,gyms:0,
      vehicles:0,events:0,education:0,pets:0,cleaning:0,babysitters:0,flowers:0,
      pharmacies:0,stores:0,insurance:0,waterActivities:0,totalUsers:0,unoTeamMembers:0,
      totalBookings:0,pendingBookings:0,pendingProperties:0,pendingContent:null,
      openTickets:0,openDisputes:0,pendingPartnerApplications:0,pendingManualPayments:0,unpaidOrders24h:0,
    };
    export const useAdminDashboardStats=()=>{window.fixtureDashboardReads++;return {data,isLoading:false,isError:false};};`,
  '@/hooks/useAdminAnalytics': `
    const summary={totalUsers:0,totalProviders:0,totalBookings:0,totalGMV:0,totalRevenue:0,userGrowth:0,providerGrowth:0,bookingGrowth:0,revenueGrowth:0};
    export const useAdminAnalytics=()=>{window.fixtureAnalyticsReads++;return {summary,isLoading:false,error:null,metrics:[],revenueChartData:[],userChartData:[],bookingChartData:[]};};`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{}; export const isTypingKey=()=>false;`,
  'sonner': `export const toast={error:()=>{},success:()=>{},info:()=>{}};`,
  '@/integrations/supabase/client': `
    const read=()=>{window.fixtureDataCalls++;throw Error('Unexpected database read in moderation fixture');};
    const write=()=>{window.fixtureWrites++;throw Error('Mutations are forbidden in moderation fixture');};
    export const supabase={
      from:()=>{window.fixtureClientCalls++;return {select:read,insert:write,update:write,delete:write,upsert:write};},
      rpc:read,functions:{invoke:write},storage:{from:read},
    };`,
  '@/lib/adminModeration': `
    // Preserve real formatting/routing helpers; replace only the asynchronous read.
    export * from '${root}/src/lib/adminModeration.ts';
    const row=(id,type,name_en,name_ru,category,extra={})=>({
      id,type,name_en,name_ru,category,created_at:'2026-10-18T09:00:00Z',
      approval_status:'pending',updated_at:'2026-10-18T09:00:00Z',provider_name:null,provider_id:null,vertical:null,...extra,
    });
    const items=[
      row('fixture-property-a','property','Harbor villa with an unusually long descriptive title','Вилла Гавань с длинным описательным названием для проверки переноса','villa'),
      row('fixture-property-b','property','Town apartment','Городская квартира','apartment',{created_at:null,updated_at:null}),
      row('fixture-listing-a','listing','Synthetic restaurant','Тестовый ресторан','dining',{vertical:'restaurant',provider_id:'fixture-provider',provider_name:'Synthetic provider with a deliberately long name / Тестовый провайдер с длинным названием'}),
      row('fixture-listing-b','listing','Synthetic clinic without a direct editor','Тестовая клиника без прямого редактора',null,{vertical:'clinic'}),
      row('fixture-service-a','service','Transfer service','Услуга трансфера',null,{approval_status:'approved',provider_id:'fixture-provider',provider_name:'Synthetic provider'}),
      row('fixture-service-b','service','Cleaning service','Услуга уборки',null,{approval_status:'rejected'}),
      row('fixture-product-a','product','Local coffee','Местный кофе','groceries',{approval_status:'draft'}),
      row('fixture-product-b','product','Beach towel','Пляжное полотенце','accessories',{approval_status:null,created_at:null}),
    ];
    const unknown=()=>({listing:null,property:null,service:null,product:null});
    export async function fetchModerationQueue(options){
      window.fixtureReadCalls++;
      if(!options) throw Error('Source/page/query options are required');
      window.fixtureReadOptions.push({...options});
      const {source,page=0,queue='pending',search='',category='all'}=options;
      if(!['listing','property','service','product'].includes(source)) throw Error('Unknown fixture source');
      if((queue==='inactive')!==['service','product'].includes(source)) throw Error('Invalid source/state fixture request');
      const scenario=new URLSearchParams(location.search).get('case')||'default';
      if(scenario==='loading') return await new Promise(()=>{});
      const unavailable={items:[],totals:unknown(),errors:[source]};
      if(scenario==='error'||(scenario==='retry'&&window.fixtureReadCalls===1)||(scenario==='partial'&&source==='listing')) return unavailable;
      let candidates=items.filter(item=>item.type===source);
      if(queue==='draft') candidates=candidates.filter(item=>item.type==='listing'||item.type==='property').map(item=>({...item,approval_status:'draft'}));
      if(scenario==='capped') candidates=Array.from({length:source==='listing'?240:source==='property'?8:2},(_,i)=>row('fixture-'+source+'-'+i,source,'Synthetic '+source+' '+i,'Тестовая запись '+i,source==='property'?'villa':null,{vertical:source==='listing'?'restaurant':null}));
      if(scenario==='empty') candidates=[];
      const term=search.trim().replace(/[,%()_*\\"]/g,' ').trim().slice(0,120).toLowerCase();
      if(term) candidates=candidates.filter(item=>[item.name_en,item.name_ru].some(name=>name?.toLowerCase().includes(term))||item.id===term);
      if(category&&category!=='all') candidates=candidates.filter(item=>(source==='listing'?item.vertical:item.category)===category);
      const totals=unknown();totals[source]=candidates.length;
      const offset=Math.max(0,page)*50;
      return {items:candidates.slice(offset,offset+50),totals,errors:[]};
    }

  `,
};

if (process.argv.includes('--verify-read-model')) {
  // Exercise only the synthetic boundary; no DOM, browser, DB client or mutation.
  const fixtureWindow = { fixtureReadCalls: 0, fixtureReadOptions: [] };
  const fixtureLocation = { search: '' };
  const source = virtual['@/lib/adminModeration'].replace(/^\s*export \* from .*;$/m, '').replace('export async function', 'async function');
  const read = new Function('window', 'location', source + '\nreturn fetchModerationQueue;')(fixtureWindow, fixtureLocation);
  const options = { source: 'listing', page: 0, queue: 'pending', search: '', category: 'all' };
  let result = await read(options);
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.totals, { listing: 2, property: null, service: null, product: null });
  assert(result.items.every(item => item.type === 'listing' && item.approval_status === 'pending'));
  assert.equal((await read({ ...options, search: 'Synthetic provider' })).items.length, 0);
  fixtureLocation.search = '?case=capped';
  result = await read(options);
  assert.equal(result.items.length, 50);
  assert.equal(result.totals.listing, 240);
  assert.equal((await read({ ...options, page: 1 })).items[0].id, 'fixture-listing-50');
  result = await read({ ...options, page: 4 });
  assert.equal(result.items.length, 40);
  assert.equal(result.items.at(-1).id, 'fixture-listing-239');
  result = await read({ ...options, search: 'Synthetic listing 239' });
  assert.equal(result.totals.listing, 1);
  assert.equal(result.items[0].id, 'fixture-listing-239');
  result = await read({ ...options, source: 'property', category: 'villa' });
  assert.deepEqual(result.totals, { listing: null, property: 8, service: null, product: null });
  fixtureLocation.search = '';
  assert((await read({ ...options, queue: 'draft' })).items.every(item => item.approval_status === 'draft'));
  result = await read({ ...options, source: 'service', queue: 'inactive' });
  assert(result.items.every(item => item.type === 'service' && item.approval_status !== 'pending'));
  fixtureLocation.search = '?case=partial';
  assert.deepEqual((await read(options)).errors, ['listing']);
  result = await read({ ...options, source: 'property' });
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(fixtureWindow.fixtureReadOptions.at(-1), { ...options, source: 'property' });
  console.log('Source-specific synthetic read model passed; browser and database were not used.');
  process.exit(0);
}

const bundle = await build({
  stdin: {
    contents: `
      import React from 'react';
      import {createRoot} from 'react-dom/client';
      import {MemoryRouter,useLocation} from 'react-router-dom';
      import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
      import {OperationsModerationTab} from '${root}/src/components/admin/operations/OperationsModerationTab.tsx';
      import {AdminOperationalAlerts} from '${root}/src/components/admin/dashboard/AdminOperationalAlerts.tsx';
      import {AdminKPIGrid} from '${root}/src/components/admin/dashboard/AdminKPIGrid.tsx';
      window.fixtureWrites=0;window.fixtureDataCalls=0;window.fixtureClientCalls=0;window.fixtureReadCalls=0;window.fixtureReadOptions=[];window.fixtureNetworkCalls=0;window.fixtureDashboardReads=0;window.fixtureAnalyticsReads=0;
      const denyNetwork=()=>{window.fixtureNetworkCalls++;throw Error('Network forbidden in isolated moderation fixture');};
      window.fetch=denyNetwork;window.XMLHttpRequest=class{constructor(){denyNetwork();}};window.WebSocket=class{constructor(){denyNetwork();}};
      document.documentElement.lang=new URLSearchParams(location.search).get('lang')||'en';
      const fixtureParams=new URLSearchParams(location.search);
      const isDashboard=fixtureParams.get('case')==='dashboard-unknown';
      const initialRoute=fixtureParams.get('route')||'/admin/operations?tab=moderation';
      const client=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false},mutations:{retry:false}}});
      function Probe(){const route=useLocation();return <output data-testid="fixture-route" hidden>{route.pathname}{route.search}</output>;}
      createRoot(document.getElementById('root')).render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[isDashboard?'/admin':initialRoute]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
            <main style={{padding:16,maxWidth:1440,margin:'0 auto',minWidth:0}}>
              {isDashboard?<div style={{display:'grid',gap:24,minWidth:0}}>
                <section data-testid="fixture-dashboard-alerts"><AdminOperationalAlerts/></section>
                <section data-testid="fixture-dashboard-kpis"><AdminKPIGrid/></section>
              </div>:<OperationsModerationTab/>}
            </main>
            <Probe/>
          </MemoryRouter>
        </QueryClientProvider>
      );`,
    loader: 'tsx', resolveDir: root,
  },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false', 'import.meta.env.VITE_SUPABASE_URL': '"http://127.0.0.1:54321"' },
  plugins: [{
    name: 'isolated-moderation-data',
    setup(b) {
      b.onResolve({ filter: /.*/ }, args => {
        if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
        if (args.path.startsWith('@/')) {
          const base = path.join(root, 'src', args.path.slice(2));
          const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
            .find(candidate => existsSync(candidate) && statSync(candidate).isFile());
          if (!resolved) throw Error('Unresolved fixture import: ' + args.path);
          return { path: resolved };
        }
      });
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
    },
  }],
});

const realInputs = Object.keys(bundle.metafile.inputs).filter(input => !input.startsWith('fixture:'));
if (realInputs.some(input => /integrations\/supabase\/client|node_modules\/@supabase\//.test(input))) {
  throw Error('A production database client entered the isolated fixture bundle');
}
if (realInputs.some(input => /hooks\/(useAdminDashboardStats|useAdminAnalytics)\.ts$/.test(input))) {
  throw Error('A production dashboard data hook entered the isolated fixture bundle');
}
for (const component of ['AdminOperationalAlerts', 'AdminKPIGrid']) {
  if (!realInputs.some(input => input.endsWith('/' + component + '.tsx'))) {
    throw Error('The real dashboard component is missing from the fixture: ' + component);
  }
}
if (!Object.keys(bundle.metafile.inputs).includes('fixture:@/lib/adminModeration')) {
  throw Error('The moderation component did not use the isolated helper read boundary');
}
await writeFile(path.join(output, 'bundle-inputs.json'), JSON.stringify(realInputs, null, 2));
const css = await postcss([postcssImport(), tailwindcss(), autoprefixer()])
  .process(await readFile(path.join(root, 'src/index.css'), 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output, 'fixture.css'), css.css);
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');

if (process.argv.includes('--bundle-only')) {
  console.log('Moderation queue fixture compiled; browser was not launched. Output: ' + output);
} else {
  const result = spawnSync('python3', [path.join(root, 'scripts/qa/moderation-queue-ui.py'), output], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
