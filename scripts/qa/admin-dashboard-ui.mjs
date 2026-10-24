// Actual task-first dashboard UI. Reads/auth are synthetic; no production transport.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sourceRoot = root.replaceAll('\\', '/');
const output = process.env.ADMIN_DASHBOARD_OUTPUT || '/tmp/browser/admin-dashboard-isolated';
await mkdir(output, { recursive: true });
await rm(path.join(output, 'fixture.css'), { force: true });
const statsSource = await readFile(path.join(root, 'src/hooks/useAdminDashboardStats.ts'), 'utf8');
const keys = [...statsSource.split('export const DASHBOARD_COUNT_KEYS = [')[1].split('] as const;')[0].matchAll(/'([^']+)'/g)].map(match => match[1]);
if (keys.length < 30) throw Error('Dashboard count contract missing');

const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key});`,
  '@/hooks/useUserRoles': `export const useUserRoles=()=>{const role=new URLSearchParams(location.search).get('role')||'admin';return{roles:role==='unauthorized'?[]:[{role}],isLoading:false}};`,
  '@/components/admin/AdminStaffOverview': `export const AdminStaffOverview=()=> <p data-testid="staff-boundary">Synthetic staff overview boundary</p>;`,
  // Selective barrel avoids unrelated dashboard blocks; these exports remain real.
  '@/components/admin/dashboard': `export{AdminOperationalAlerts}from'${sourceRoot}/src/components/admin/dashboard/AdminOperationalAlerts.tsx';export{AdminRevenueBlock}from'${sourceRoot}/src/components/admin/dashboard/AdminRevenueBlock.tsx';export{AdminQuickActionsGrid}from'${sourceRoot}/src/components/admin/dashboard/AdminQuickActionsGrid.tsx';`,
  '@/hooks/useAdminDashboardStats': `import{useQuery}from'@tanstack/react-query';
export const DASHBOARD_COUNT_KEYS=${JSON.stringify(keys)};
export const useAdminDashboardStats=()=>{window.fixtureHookCalls.stats++;return useQuery({queryKey:['admin-dashboard-stats','synthetic-admin'],staleTime:Infinity,retry:false,queryFn:async()=>{
window.fixtureAssertAdmin();window.fixtureReads.stats++;await window.fixtureDelay();
const scenario=window.fixtureScenario,values=Object.fromEntries(DASHBOARD_COUNT_KEYS.map(key=>[key,0]));
Object.assign(values,{pendingListings:7,pendingProperties:4,pendingContent:11,pendingProviders:3,pendingOrders:5,pendingOrders24h:2,openTickets:6,pendingManualPayments:2,openDisputes:1,pendingPartnerApplications:4});
const updated=Date.now()-(scenario==='stale'?120000:0),sourceUpdatedAt=Object.fromEntries(DASHBOARD_COUNT_KEYS.map(key=>[key,updated])),sourceErrors={};
if(scenario==='one-source-failure'){values.pendingProviders=null;sourceErrors.pendingProviders='unavailable';delete sourceUpdatedAt.pendingProviders;}
return{...values,sourceUpdatedAt,sourceErrors,ordersCreatedBefore:'2026-10-19T00:00:00.000Z'};}})};`,
  '@/hooks/useAdminDashboardEvidence': `import{useQuery}from'@tanstack/react-query';import{dashboardSnapshotPeriod,summarizeDashboardSnapshots}from'${sourceRoot}/src/lib/adminDashboardEvidence.ts';
export const useAdminPlatformStatus=()=>{window.fixtureHookCalls.health++;return useQuery({queryKey:['admin-dashboard','health','synthetic-admin'],staleTime:Infinity,retry:false,queryFn:async()=>{window.fixtureAssertAdmin();window.fixtureReads.health++;await window.fixtureDelay();return[{key:'stripe_mode',status:'not_configured'},{key:'admin_emails',status:'configured'},{key:'admin_whatsapp',status:'configured'},{key:'reconciliation',status:'unknown'},{key:'verticals',status:'unknown'}]}})};
export const useAdminDashboardSnapshots=days=>{window.fixtureHookCalls.snapshots++;const period=dashboardSnapshotPeriod(days);const query=useQuery({queryKey:['admin-dashboard','snapshots','synthetic-admin',days],staleTime:Infinity,retry:false,queryFn:async()=>{window.fixtureAssertAdmin();window.fixtureReads.snapshots++;await window.fixtureDelay();const rows=window.fixtureScenario==='no-snapshots'?[]:period.dates.map(date=>({date,gmv:120,platform_revenue:12,completed_bookings:2}));return summarizeDashboardSnapshots(rows,period.dates)}});return{...query,period,checkingAccess:false}};`,
  '@/integrations/supabase/client': `throw Error('Production database transport forbidden in isolated dashboard fixture');`,
};

const entry = `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation,useNavigate}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
import AdminDashboard from'${sourceRoot}/src/pages/admin/AdminDashboard.tsx';
const params=new URLSearchParams(location.search);document.documentElement.lang=params.get('lang')||'en';window.fixtureScenario=params.get('scenario')||'full';window.fixtureReads={stats:0,health:0,snapshots:0};window.fixtureHookCalls={stats:0,health:0,snapshots:0};window.fixtureForbidden=[];window.fixtureDelay=()=>window.fixtureScenario==='loading'?new Promise(()=>{}):new Promise(resolve=>setTimeout(resolve,180));window.fixtureAssertAdmin=()=>{if((params.get('role')||'admin')!=='admin'){window.fixtureForbidden.push('admin read without admin role');throw Error('Admin read forbidden')}};
function Fixture(){const loc=useLocation(),navigate=useNavigate();return <><div data-testid="fixture-disclosure" className="border-b p-2 text-xs">Synthetic read-only dashboard evidence. Sidebar is a layout boundary.</div><div className="fixture-admin-workspace"><aside data-testid="sidebar-boundary" className="border-r p-4">Synthetic sidebar boundary</aside><main data-testid="dashboard-work-area"><AdminDashboard/></main></div><output hidden data-testid="fixture-location">{loc.pathname+loc.search}</output><button data-testid="fixture-back" hidden onClick={()=>navigate(-1)}>Fixture Back</button><button data-testid="fixture-forward" hidden onClick={()=>navigate(1)}>Fixture Forward</button></>}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}})}><MemoryRouter initialEntries={['/admin']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter></QueryClientProvider>);`;
const result = await build({
  stdin: { contents: entry, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'isolated-admin-dashboard', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(file => existsSync(file) && statSync(file).isFile());
        if (!resolved) throw Error('Unresolved import: ' + args.path);
        return { path: resolved };
      }
    });
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const inputs = Object.keys(result.metafile.inputs).map(file => file.replaceAll('\\', '/'));
for (const required of ['pages/admin/AdminDashboard.tsx', 'admin/dashboard/AdminWorkQueues.tsx', 'admin/dashboard/AdminOperationalAlerts.tsx', 'admin/dashboard/DashboardCount.tsx', 'admin/GoLiveChecklist.tsx', 'admin/dashboard/AdminRevenueBlock.tsx', 'admin/dashboard/AdminQuickActionsGrid.tsx', 'page/PageShell.tsx', 'lib/adminDashboardEvidence.ts']) {
  if (!inputs.some(file => !file.startsWith('fixture:') && file.endsWith(required))) throw Error('Actual component missing: ' + required);
}
if (inputs.some(file => !file.startsWith('fixture:') && /integrations\/supabase\/client|hooks\/useAdmin(DashboardStats|DashboardEvidence|Analytics|Content)\.ts|contexts\/AuthContext/.test(file))) throw Error('Production data module included');
await writeFile(path.join(output, 'bundle-inputs.json'), JSON.stringify({ inputs, boundaries: ['synthetic read hooks', 'role hook', 'staff overview', 'sidebar frame'], countKeys: keys }, null, 2));
if (process.argv.includes('--bundle-only')) process.exit(0);
const response = await fetch('http://localhost:8080/src/index.css?direct');
if (!response.ok) throw Error('Production CSS unavailable');
let css = await response.text();
if (existsSync(path.join(output, 'fixture.css'))) css += '\n' + await readFile(path.join(output, 'fixture.css'), 'utf8');
css += '\n.fixture-admin-workspace{display:block}.fixture-admin-workspace>aside{display:none}.fixture-admin-workspace>main{min-width:0}@media(min-width:768px){.fixture-admin-workspace{display:grid;grid-template-columns:240px minmax(0,1fr)}.fixture-admin-workspace>aside{display:block}}';
await writeFile(path.join(output, 'fixture.css'), css);
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if (process.argv.includes('--build-only')) process.exit(0);
if (!process.env.CI || process.env.GITHUB_ACTIONS !== 'true') throw Error('Browser execution is remote GitHub CI-only; local use is --bundle-only');
const run = spawnSync('python3', [path.join(root, 'scripts/qa/admin-dashboard-ui.py'), output], { stdio: 'inherit' });
process.exitCode = run.status ?? 1;
