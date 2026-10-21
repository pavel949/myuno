/**
 * Actual Index/IndexV2 + changed Home components + production CSS.
 * Data hooks and unrelated lower-page surfaces are synthetic. No server, login,
 * production client, production requests, or business mutations are permitted.
 *
 * node scripts/qa/compact-personal-home-ui.mjs --build-only
 * node scripts/qa/compact-personal-home-ui.mjs --list-cases
 * Browser validation is a separate, explicit gate in an authorized environment:
 * node scripts/qa/compact-personal-home-ui.mjs --run-browser
 * Default is the bounded representative smoke; append --exhaustive for the
 * full matrix. Listing cases does not build, import Playwright, or use a browser.
 */
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = process.cwd();
const output = '/tmp/browser/compact-personal-home-isolated';
const startedAt = Date.now();
const flags = new Set(process.argv.slice(2));
const allowedFlags = new Set(['--build-only', '--run-browser', '--list-cases', '--exhaustive']);
for (const flag of flags) if (!allowedFlags.has(flag)) throw new Error(`Unknown argument: ${flag}`);
const exhaustive = flags.has('--exhaustive');
const python = path.join(root, 'scripts/qa/compact-personal-home-ui.py');
if (flags.has('--list-cases') && flags.has('--run-browser')) throw new Error('--list-cases cannot launch a browser.');
if (process.argv.includes('--build-only') && process.argv.includes('--run-browser')) {
  throw new Error('Choose either --build-only or --run-browser.');
}
const manifestRun = spawnSync('python3', [python, '--list-cases', ...(exhaustive ? ['--exhaustive'] : [])], { encoding: 'utf8', timeout: 5000 });
if (manifestRun.status !== 0) throw new Error(`Case manifest validation failed: ${manifestRun.error || manifestRun.stderr}`);
const manifest = JSON.parse(manifestRun.stdout);
if (flags.has('--list-cases')) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}
await mkdir(output, { recursive: true });
await writeFile(path.join(output, 'case-manifest.json'), JSON.stringify(manifest, null, 2));
await rm(path.join(output, 'fixture.css'), { force: true });
// Do not leave a previous successful browser result next to a newly built bundle.
await rm(path.join(output, 'results.json'), { force: true });

// Reuse the actual option arrays without executing or bundling their data hook.
const personaSource = ts.createSourceFile('useUserPersonas.ts', await readFile(path.join(root, 'src/hooks/useUserPersonas.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const optionNames = ['PERSONA_OPTIONS_PRIMARY', 'PERSONA_OPTIONS_LIFESTYLE', 'PERSONA_OPTIONS'];
const optionSource = personaSource.statements.flatMap(statement => {
  if (!ts.isVariableStatement(statement)) return [];
  return statement.declarationList.declarations.flatMap(declaration => {
    if (!ts.isIdentifier(declaration.name) || !optionNames.includes(declaration.name.text)) return [];
    if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) throw new Error('Persona options are no longer static arrays.');
    for (const element of declaration.initializer.elements) {
      if (ts.isStringLiteral(element)) continue;
      if (ts.isSpreadElement(element) && ts.isIdentifier(element.expression) && optionNames.includes(element.expression.text)) continue;
      throw new Error('Unexpected executable expression in persona options.');
    }
    return [`export const ${declaration.name.text}=${declaration.initializer.getText(personaSource)};`];
  });
}).join('\n');
if (optionSource.split('export const ').length !== optionNames.length + 1) throw new Error('Missing canonical persona options.');

const virtual = {
  'compact-fixture-state': `
    import React,{createContext,useContext,useState} from 'react';
    const params=new URLSearchParams(location.search);
    export let current;
    const Context=createContext(null);
    export const telemetry={retries:0,notificationMutations:0,forbiddenCalls:[],orderReads:[]};
    export function deny(action){telemetry.forbiddenCalls.push(action);throw Error('Forbidden fixture operation: '+action);}
    export function FixtureProvider({children}){
      const [state,setState]=useState(()=>({
        language:params.get('lang')||'ru',role:params.get('role')||'resident',account:params.get('account')||'a',
        state:params.get('state')||'live',orders:params.get('orders')||'empty',notifications:params.get('notifications')||'empty',
        contextLoading:params.get('context-loading')==='1',ownerTypeLoading:params.get('owner-loading')==='1',
        ownerPortal:params.get('owner-portal')!=='0',surface:params.get('surface')||'legacy',
        personas:params.get('topics')==='none'?[]:params.get('topics')==='business'?['local_services_provider']:['pet_owner','family','couple'],
      }));
      const user=state.role==='guest'?null:{id:'synthetic-'+state.account,email:'synthetic@example.invalid',user_metadata:{full_name:params.get('long-name')==='1'?'SyntheticVeryLongUnbrokenDisplayNameForNarrowScreenRegressionTesting Account':'Synthetic Long Display Name'}};
      current={...state,user};
      window.fixture={getState:()=>current,telemetry,setState:patch=>setState(old=>({...old,...patch}))};
      return <Context.Provider value={{...current,setState}}>{children}</Context.Provider>;
    }
    export function useFixture(){const value=useContext(Context);if(!value)throw Error('Missing fixture provider');return value;}
  `,
  '@/contexts/LanguageContext': `import{useFixture}from'compact-fixture-state';export const useLanguage=()=>({language:useFixture().language});`,
  '@/contexts/AuthContext': `import{useFixture}from'compact-fixture-state';export const useAuth=()=>({user:useFixture().user});`,
  '@/hooks/useUserContext': `
    import{useFixture}from'compact-fixture-state';
    export function useUserContext(){const f=useFixture();const roles={guest:[],resident:['client'],admin:['admin','vendor'],owner:['property_owner'],vendor:['vendor'],employee:['uno_team'],staff:['staff'],property_manager:['property_manager'],investor:['investor']};return{availableRoles:roles[f.role],activeRole:f.role==='employee'?'uno_team':f.role,isLoading:f.contextLoading};}
  `,
  '@/hooks/useOwnerType': `import{useFixture}from'compact-fixture-state';export function useOwnerType(){const f=useFixture();return{isMCPortal:f.ownerPortal,isLoading:f.ownerTypeLoading};}`,
  '@/hooks/useFeatureFlag': `import{useFixture}from'compact-fixture-state';export const useFeatureFlag=()=>useFixture().surface==='v2';`,
  '@/hooks/useIsAdmin': `import{useFixture}from'compact-fixture-state';export const useIsAdmin=()=>({isAdmin:useFixture().role==='admin',isLoading:false});`,
  '@/hooks/useLifeOS': `import{useFixture}from'compact-fixture-state';export function useLifeOSRole(){const role=useFixture().role;return({admin:'mc',employee:'resident',staff:'resident',property_manager:'mc'})[role]||role;}`,
  '@/hooks/useUserPersonas': `
    import{useFixture}from'compact-fixture-state';
    ${optionSource}
    export function useUserPersonas(){const f=useFixture();return{
      personas:f.personas,effectivePersonas:f.personas,
      togglePersona:p=>f.setState(old=>({...old,personas:old.personas.includes(p)?old.personas.filter(x=>x!==p):[...old.personas,p]})),
      setPersonas:personas=>f.setState(old=>({...old,personas})),
      isLoading:f.state==='preferences-loading',isToggling:false,isSetting:false,error:f.state==='preferences-error'?new Error('Synthetic preference read failed'):null,
    };}
  `,
  '@/hooks/useRoleSignals': `
    import{useFixture,telemetry}from'compact-fixture-state';
    export function useRoleSignals(personas){
      const f=useFixture();const live=!!f.user&&['live','partial-error'].includes(f.state);
      const record={lead:'Synthetic scheduled service with a long title',leadRu:'Синтетическая услуга с длинным названием',leadTh:'บริการตัวอย่างที่มีชื่อยาวสำหรับทดสอบ',value:'13:20',tail:'Synthetic provider · intentionally long service description for narrow screens',tailRu:'Тестовый исполнитель · длинное описание услуги для проверки узкого экрана',tailTh:'ผู้ให้บริการตัวอย่าง · รายละเอียดบริการยาวสำหรับทดสอบหน้าจอขนาดเล็ก',state:'live',isLive:true};
      const available=personas.filter(p=>p!=='local_services_provider');
      return{signals:live?Object.fromEntries(available.slice(0,1).map(p=>[p,record])):{},
        isLoading:!!f.user&&f.state==='loading',hasError:!!f.user&&['partial-error','error'].includes(f.state),
        unavailablePersonas:personas.filter(p=>p==='local_services_provider'),isAuthenticated:!!f.user,
        retry:()=>{telemetry.retries+=1;}};
    }
  `,
  '@/hooks/useNotificationActions': `
    import{useFixture,telemetry,deny}from'compact-fixture-state';
    export function useNotificationActions(){const f=useFixture();const unread=!!f.user&&f.notifications==='unread';
      const mutation=()=>{telemetry.notificationMutations+=1;deny('notification mutation');};
      return{notifications:unread?[{id:'synthetic-unread',is_read:false}]:[],unreadCount:unread?2:0,isLoading:!!f.user&&f.notifications==='loading',markAsRead:mutation,markAllAsRead:mutation,deleteNotification:mutation};}
  `,
  '@/integrations/supabase/client': `
    import{current,telemetry,deny}from'compact-fixture-state';
    export const supabase=new Proxy({from(table){
      if(table!=='orders')return deny('unexpected table '+table);
      const snapshot={...current};const calls=[];
      const allowed={select(...args){calls.push(['select',...args]);return query;},eq(...args){calls.push(['eq',...args]);return query;},is(...args){calls.push(['is',...args]);return query;},in(...args){calls.push(['in',...args]);return query;},then(resolve,reject){
        const expected=[['select','id',{count:'exact',head:true}],['eq','customer_user_id',snapshot.user?.id],['is','deleted_at',null],['in','status',['pending','awaiting_client_payment','pending_deposit']]];
        if(JSON.stringify(calls)!==JSON.stringify(expected))return deny('unexpected or unscoped pending-order read '+JSON.stringify(calls));
        telemetry.orderReads.push({actor:snapshot.user?.id,calls});
        if(snapshot.orders==='loading')return new Promise(()=>{}).then(resolve,reject);
        const result={data:null,count:snapshot.orders==='unknown'?null:snapshot.orders==='live'?2:0,error:snapshot.orders==='error'?new Error('Synthetic pending-order error'):null};
        return Promise.resolve(result).then(resolve,reject);
      }};
      const query=new Proxy(allowed,{get(target,key){if(key in target)return target[key];return()=>deny('database '+String(key));}});return query;
    }},{get(target,key){if(key in target)return target[key];return()=>deny('client '+String(key));}});
  `,
  '@/components/layout/AppLayout': `export const AppLayout=({children})=><main data-testid="fixture-home" className="min-h-screen bg-background text-foreground">{children}</main>;`,
  '@/components/nav/AppDrawer': `export const AppDrawer=({open})=>open?<aside data-testid="synthetic-app-drawer">Synthetic app drawer; drawer behavior is outside this fixture.</aside>:null;`,
  '@/components/onboarding/Coachmarks': `export const Coachmarks=()=>null;`,
};
for (const [module, name] of [
  ['home/NowInPhuket', 'NowInPhuket'], ['home/OfficialNews', 'OfficialNews'],
  ['home/LifecycleSmartTip', 'LifecycleSmartTip'], ['home/ClusterGridCards', 'ClusterGridCards'],
  ['superapp/PersonalGrid', 'PersonalGrid'], ['superapp/ClusterRail', 'ClusterRail'],
]) {
  virtual[`@/components/${module}`] = `export const ${name}=()=> <section data-testid="synthetic-${name}" className="mx-4 my-3 border-t border-border py-3 text-xs text-muted-foreground">Synthetic lower content: ${name}</section>;`;
}

const result = await build({
  stdin: { contents: `
    import React from 'react';import{createRoot}from'react-dom/client';
    import{MemoryRouter,useLocation}from'react-router-dom';
    import{QueryClient,QueryClientProvider}from'@tanstack/react-query';
    import{FixtureProvider,useFixture}from'compact-fixture-state';
    import Index from '${root}/src/pages/Index.tsx';import IndexV2 from '${root}/src/pages/IndexV2.tsx';
    function Fixture(){const f=useFixture();const loc=useLocation();document.documentElement.lang=f.language;
      return <>{f.surface==='v2'?<IndexV2/>:<Index/>}<output hidden data-testid="selection">{JSON.stringify(f.personas)}</output><output hidden data-testid="location">{loc.pathname+loc.search}</output><output hidden data-testid="actor">{f.user?.id||'guest'}</output></>;}
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false,gcTime:0}}});
    window.fixtureQueryClient=queryClient;
    createRoot(document.getElementById('root')).render(<QueryClientProvider client={queryClient}><FixtureProvider><MemoryRouter initialEntries={['/']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter></FixtureProvider></QueryClientProvider>);
  `, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'isolated-compact-home', setup(b) {
    b.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const resolved = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(p => existsSync(p) && statSync(p).isFile());
        if (!resolved) throw new Error(`Unresolved fixture import ${args.path}`);
        return { path: resolved };
      }
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const inputs = Object.keys(result.metafile.inputs);
const forbidden = inputs.filter(p => !p.startsWith('fixture:') && /(?:^|\/)src\/(?:hooks|contexts|integrations|services)\/|(?:^|\/)node_modules\/@supabase\//.test(p));
if (forbidden.length) throw new Error(`Production data modules leaked into fixture: ${forbidden.join(', ')}`);
const required = ['src/pages/Index.tsx', 'src/pages/IndexV2.tsx', ...['HeroGreeting', 'HomeTopBar', 'WorkspaceHomeBanner', 'PersonalHomeActions', 'PendingPaymentsChip', 'SignalStack', 'HomePreferencesEntry', 'RoleSheet'].map(name => `src/components/home/${name}.tsx`)];
for (const file of required) if (!inputs.some(input => input.endsWith(file))) throw new Error(`Actual component missing from fixture: ${file}`);

// Compile all production styles locally. No Vite server or CSS network fetch.
const cssPath = path.join(output, 'production.css');
const cssBuild = spawnSync(process.execPath, [path.join(root, 'scripts/qa/compile-application-css.mjs'), '--write-application-css', cssPath], { cwd: root, encoding: 'utf8', timeout: 30000 });
if (cssBuild.status !== 0) throw new Error(`Production CSS compilation failed: ${cssBuild.stderr || cssBuild.stdout}`);
let css = await readFile(cssPath, 'utf8');
if (/^\s*@import\s/m.test(css)) throw new Error('Production CSS still contains unresolved imports.');
const componentCss = path.join(output, 'fixture.css');
if (existsSync(componentCss)) css += `\n${await readFile(componentCss, 'utf8')}`;
await writeFile(componentCss, css);
await writeFile(path.join(output, 'fixture.html'), `<!doctype html><html lang="en" class="light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Isolated compact personal home QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>`);
const report = {
  build: 'pass', browserValidation: 'not-run', productionDataModules: 0,
  mode: manifest.mode, planned: manifest.counts, runtimeStatus: manifest.runtimeStatus,
  actualComponents: required, syntheticModules: Object.keys(virtual),
  stylesheet: 'src/index.css compiled by repository Tailwind v4 PostCSS plugin',
  fonts: 'Network fonts intentionally excluded; system fallbacks only. A production-font visual gate remains separate.',
  surfaceScope: 'Actual Index (legacy gate) and IndexV2, actual compact personal components and pending-order query. AppLayout, drawer, onboarding and lower ancillary sections are synthetic.',
  dataScope: 'Synthetic hooks test presentation only; not evidence of production authorization, notification delivery or preference persistence.',
};
await writeFile(path.join(output, 'build-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, build: report.build, browserValidation: report.browserValidation, productionDataModules: 0 }));
if (process.argv.includes('--run-browser')) {
  // Leave headroom for process startup/cleanup under the external 180s CI cap.
  // Timeout or an incomplete plan is a failure, never a shortened success.
  const budgetSeconds = exhaustive ? 1200 : Math.min(150, Math.floor((170000 - (Date.now() - startedAt)) / 1000));
  if (budgetSeconds <= 0) throw new Error('Fixture compilation exhausted the smoke runtime budget.');
  const run = spawnSync('python3', [python, output, '--run-browser', '--timeout-seconds', String(budgetSeconds), ...(exhaustive ? ['--exhaustive'] : [])], { stdio: 'inherit', timeout: (budgetSeconds + 5) * 1000, killSignal: 'SIGKILL' });
  if (run.error) {
    report.browserValidation = run.error.code === 'ETIMEDOUT' ? 'timed-out' : 'failed';
    report.browserError = run.error.message;
    await writeFile(path.join(output, 'build-report.json'), JSON.stringify(report, null, 2));
    console.error(`Browser gate ${report.browserValidation}: ${run.error.message}`);
  }
  process.exitCode = run.status ?? 1;
}
