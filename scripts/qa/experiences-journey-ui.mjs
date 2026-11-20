import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';
// Actual catalogue, native controls and public header; synthetic reads and shell only.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const root = process.cwd();
const output = process.env.EXPERIENCES_JOURNEY_OUTPUT || path.join(root, 'artifacts/ux-clarity/experiences-journey');
await mkdir(output, { recursive: true });
await rm(path.join(output, 'results.json'), { force: true });
for (const file of await readdir(output)) if (/^(ru|en|th)-(390|1440)-FAIL\.png$/.test(file)) await rm(path.join(output, file));
const hookSource = await readFile('src/hooks/useExperiences.ts', 'utf8');
const durationFormatter = hookSource.match(/export const formatDuration = [\s\S]*?\n};/)?.[0];
if (!durationFormatter) throw Error('Actual pure duration formatter was not found');
const virtual = {
  '@/hooks/useExperiences': `import {useSyncExternalStore} from 'react';
    const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};
    const base={currency:'THB',price_per:'person',cover_image:'/fixture-experience.svg',images:[],rating:4,review_count:2,duration_minutes:60,is_featured:false,location_name:'Synthetic Phuket',is_active:true};
    const rows=[{...base,id:'island-tour',experience_type:'tour',category:'islands',title_en:'Synthetic island tour',title_ru:'Тестовая экскурсия на остров',price:3000},{...base,id:'culture-tour',experience_type:'tour',category:'culture',title_en:'Synthetic culture tour',title_ru:'Тестовая культурная экскурсия',price:1500},{...base,id:'diving-activity',experience_type:'activity',category:'diving',title_en:'Synthetic diving activity',title_ru:'Тестовый дайвинг',price:2000},{...base,id:'unknown-price',experience_type:'tour',category:'nature',title_en:'Synthetic unknown price',title_ru:'Тестовое предложение без цены',price:null}];
    export const useExperiences=options=>{useSyncExternalStore(subscribe,()=>retry);window.fixtureReadOptions=options;const mode=new URLSearchParams(location.search).get('mode');const error=mode==='error'&&retry===0;let data=rows.filter(r=>(!options.type||r.experience_type===options.type)&&(!options.category||r.category===options.category)&&(!options.search||(r.title_en+' '+r.title_ru).toLocaleLowerCase().includes(options.search.toLocaleLowerCase())));return{experiences:error||mode==='loading'?[]:data,isLoading:mode==='loading',error:error?new Error('Synthetic read failure'):null,refetch:()=>{retry++;window.fixtureReadRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};
    ${durationFormatter}`,
  '@/hooks/useExperienceCategories': `import {useSyncExternalStore} from 'react';
    const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};
    const categories=[['islands','Islands','Острова','tour'],['culture','Culture','Культура','tour'],['diving','Diving','Дайвинг','activity'],['nature','Nature','Природа','tour'],['kayaking','Kayaking','Каякинг','activity'],['family','Family','Семейный отдых','all'],['food','Food','Кухня','tour'],['adventure','Adventure','Приключения','activity'],['wellness','Wellness','Оздоровление','all']].map(([slug,name_en,name_ru,experience_type],index)=>({id:'synthetic-category-'+index,slug,name_en,name_ru,experience_type,is_active:true,sort_order:index,icon:'Compass'}));
    export const useAdminExperienceCategories=()=>({categories,isLoading:false,error:null,isCreating:false,isUpdating:false,isDeleting:false,create:async value=>{window.fixturePreparedCategory=value;},update:async()=>{},remove:async()=>{},refetch:async()=>{}});\n    export const useExperienceCategories=()=>{useSyncExternalStore(subscribe,()=>retry);const error=new URLSearchParams(location.search).get('mode')==='category-error'&&retry===0;return{data:error?[]:categories,isLoading:false,isError:error,refetch:()=>{retry++;window.fixtureCategoryRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:value=>'฿'+new Intl.NumberFormat('en').format(value)});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:window.fixtureUser||null,isLoading:false});`,
  '@/components/layout/AppLayout': `import {ConsumerHeader} from '${root}/src/components/nav/ConsumerHeader.tsx';export const AppLayout=({children})=><div data-canvas><ConsumerHeader/><main>{children}</main></div>;`,
  '@/components/uno/GlobalPreferencesControls': `export const GlobalPreferencesControls=()=>null;`,
  '@/components/layout/UserAvatarMenu': `export const UserAvatarMenu=()=>null;`,
  '@/components/market/MiniCart': `export const MiniCart=()=>null;`,
  '@/components/miniapp': `export {MiniAppLayout} from '${root}/src/components/miniapp/MiniAppLayout.tsx';export {CatalogCard} from '${root}/src/components/miniapp/CatalogCard.tsx';`,
  '@/components/filters/UniversalFilter': `export const UniversalFilter=()=>null;`,
  '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
  '@/components/map/UnifiedCatalogMap': `export const UnifiedCatalogMap=()=>null;`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/components/crosssell': `export const CrossSellSection=()=>null;`,
  '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
  '@/components/experiences/PropertyTourPromo': `export const PropertyTourPromo=()=>null;`,
  '@/components/vertical/VerticalContextBanner': `export const VerticalContextBanner=()=>null;`,
  '@/components/vertical/VerticalInsightPanel': `export const VerticalInsightPanel=()=>null;`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({});`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({
    async rpc(name,args){if(name!=='submit_experience_inquiry')throw Error('Unexpected fixture RPC');window.fixtureInquiries.push(args.payload);return {data:'synthetic-experience-receipt',error:null};}
  },{get(target,key){if(key==='rpc')return target.rpc;throw Error('Hosted backend forbidden in experiences journey fixture')}});`,
};
const result = await build({
  alias: radixOverlayAliases,
  stdin: { contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
    import {MemoryRouter,Routes,Route,useLocation,useNavigate,useParams} from 'react-router-dom';
    import Page from '${root}/src/pages/experiences/ExperiencesIndex.tsx';
    import AdminCategories from '${root}/src/pages/admin/ExperienceCategoriesPage.tsx';
    import {ExperienceInquiry} from '${root}/src/components/experiences/ExperienceInquiry.tsx';
    window.fixtureReadRetries=0;
    window.fixtureCategoryRetries=0;
    window.fixtureInquiries=[];
    function Navigation(){
      const l=useLocation(),nav=useNavigate();
      return <aside aria-label="Synthetic history controls" className="border-t p-4">
        <output data-testid="fixture-location">{l.pathname+l.search}</output>
        <output hidden data-testid="fixture-state">{JSON.stringify(l.state)}</output>
        <button onClick={()=>nav(-1)} data-testid="history-back">QA history back</button>
        <button onClick={()=>nav(1)} data-testid="history-forward">QA history forward</button>
      </aside>;
    }
    function Inquiry(){
      const {id}=useParams();
      return <ExperienceInquiry open onOpenChange={()=>{}} listingId={id} listingTitle="Synthetic island tour" entryPoint="experience_discovery:concierge"/>;
    }
    function SignIn(){
      const location=useLocation();
      const navigate=useNavigate();
      return <button onClick={()=>{
        window.fixtureUser={id:'synthetic-customer',user_metadata:{full_name:'Synthetic guest',phone:'+66000000000'}};
        navigate(new URLSearchParams(location.search).get('redirect'));
      }}>Complete synthetic sign-in</button>;
    }
    createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[new URLSearchParams(location.search).get('entry')||'/experiences?ref=synthetic']}>
        <Routes>
          <Route path="/admin/experience-categories" element={<AdminCategories/>}/>
          <Route path="/experiences" element={<Page/>}/>
          <Route path="/experiences/:id" element={<h1>Synthetic detail boundary</h1>}/>
          <Route path="/experiences/:id/request-fixture" element={<Inquiry/>}/>
          <Route path="/auth" element={<SignIn/>}/>
          <Route path="/yachts" element={<h1>Synthetic yacht destination</h1>}/>
        </Routes>
        <Navigation/>
      </MemoryRouter>
    </QueryClientProvider>);`, loader: 'tsx', resolveDir: root },
  outfile: path.join(output, 'fixture.js'), bundle: true, format: 'esm', jsx: 'automatic', metafile: true,
  loader: { '.svg': 'file', '.png': 'file', '.webp': 'file' },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false', 'import.meta.env.VITE_SUPABASE_URL': '"http://127.0.0.1:54321"' },
  plugins: [{ name: 'isolated-experiences', setup(b) {
    b.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'synthetic' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const file = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(file => existsSync(file) && statSync(file).isFile());
        if (!file) throw Error('Unresolved actual module ' + args.path);
        return { path: file };
      }
    });
    b.onLoad({ filter: /.*/, namespace: 'synthetic' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const inputs = Object.keys(result.metafile.inputs);
const actual = ['src/pages/admin/ExperienceCategoriesPage.tsx', 'src/components/page/PageShell.tsx', 'src/pages/experiences/ExperiencesIndex.tsx', 'src/components/experiences/ExperienceCategoryMenu.tsx', 'src/components/experiences/ExperienceInquiry.tsx', 'src/components/services/MarketplaceDiscoveryMenu.tsx', 'src/components/services/MarketplaceFilterSheet.tsx', 'src/components/miniapp/MiniAppLayout.tsx', 'src/components/layout/FeatureLayout.tsx', 'src/components/shared/UnifiedHeader.tsx', 'src/components/nav/ConsumerHeader.tsx', 'src/components/miniapp/CatalogCard.tsx'];
for (const file of actual) if (!inputs.some(input => input.endsWith(file))) throw Error('Actual component missing: ' + file);
if (inputs.some(input => !input.startsWith('synthetic:') && /integrations\/supabase\/client|hooks\/useExperiences\.ts$|hooks\/useExperienceCategories\.ts$/.test(input))) throw Error('Production data module included');
const routeCss = await readFile(path.join(output, 'fixture.css'), 'utf8');
const css = await postcss([postcssImport(), tailwindcss(path.join(root, 'tailwind.config.ts')), autoprefixer()]).process(await readFile('src/index.css', 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output, 'fixture.css'), css.css + '\n' + routeCss);
await writeFile(path.join(output, 'fixture-experience.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><path fill="#d9e3df" d="M0 0h640v480H0z"/><path fill="#103552" d="M0 310h640v170H0z"/><text x="24" y="80" font-size="22">SYNTHETIC EXPERIENCE QA</text></svg>');
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const sourceFiles = [...actual, 'src/lib/nav/navigationModel.ts', 'src/hooks/useExperiences.ts', 'src/styles/public-commerce.css', 'src/index.css', 'src/styles/tokens.css', 'src/styles/consumer-system.css', 'tailwind.config.ts', 'scripts/qa/experiences-journey-ui.mjs', 'scripts/qa/experiences-journey-ui.py'];
await writeFile(path.join(output, 'source-provenance.json'), JSON.stringify({
  actualComponents: actual, syntheticBoundaries: Object.keys(virtual),
  sourceHashes: Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')]))),
  fixtureReadOnly: true, actualPureDurationFormatterFromHook: true,
  limits: 'Synthetic offers, categories, retries and auth/RPC for the actual experience enquiry. Actual public header and MiniAppLayout/FeatureLayout/native catalogue controls/cards. No full detail layout, real account, map, sales booking, availability, payment or delivery acceptance.',
}, null, 2) + '\n');
if (process.argv.includes('--build-only')) process.exit(0);
const run = spawnSync(process.env.PYTHON || 'python3', ['scripts/qa/experiences-journey-ui.py', output], { stdio: 'inherit', timeout: 480000 });
process.exitCode = run.status ?? 1;
