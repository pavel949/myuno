// Actual yacht/flower catalogues, filters and public header; synthetic reads and shell only.
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
const output = process.env.YACHTS_FLOWERS_OUTPUT || path.join(root, 'artifacts/design-system/yachts-flowers');
await mkdir(output, { recursive: true });
await rm(path.join(output, 'results.json'), { force: true });
for (const file of await readdir(output)) if (/^(ru|en|th)-(390|1440)-FAIL\.png$/.test(file)) await rm(path.join(output, file));
const hookSource = await readFile('src/hooks/useExperiences.ts', 'utf8');
const durationFormatter = hookSource.match(/export const formatDuration = [\s\S]*?\n};/)?.[0];
if (!durationFormatter) throw Error('Actual pure duration formatter was not found');
const virtual = {
  // This fixture exercises rendered links, not speculative loads of unrelated pages.
  '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
  '@/hooks/useExperiences': `import {useSyncExternalStore} from 'react';
    const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};
    const base={currency:'THB',price_per:'person',cover_image:'/fixture-experience.svg',images:[],rating:4,review_count:2,duration_minutes:60,is_featured:false,location_name:'Synthetic Phuket',is_active:true};
    const rows=[{...base,id:'island-tour',experience_type:'tour',category:'islands',title_en:'Synthetic island tour',title_ru:'Тестовая экскурсия на остров',price:3000},{...base,id:'culture-tour',experience_type:'tour',category:'culture',title_en:'Synthetic culture tour',title_ru:'Тестовая культурная экскурсия',price:1500},{...base,id:'diving-activity',experience_type:'activity',category:'diving',title_en:'Synthetic diving activity',title_ru:'Тестовый дайвинг',price:2000},{...base,id:'unknown-price',experience_type:'tour',category:'nature',title_en:'Synthetic unknown price',title_ru:'Тестовое предложение без цены',price:null}];
    export const useExperiences=options=>{useSyncExternalStore(subscribe,()=>retry);window.fixtureReadOptions=options;const mode=new URLSearchParams(location.search).get('mode');const error=mode==='error'&&retry===0;let data=rows.filter(r=>(!options.type||r.experience_type===options.type)&&(!options.category||r.category===options.category)&&(!options.search||(r.title_en+' '+r.title_ru).toLocaleLowerCase().includes(options.search.toLocaleLowerCase())));return{experiences:error||mode==='loading'?[]:data,isLoading:mode==='loading',error:error?new Error('Synthetic read failure'):null,refetch:()=>{retry++;window.fixtureReadRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};
    ${durationFormatter}`,
  '@/hooks/useExperienceCategories': `import {useSyncExternalStore} from 'react';
    const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};
    const categories=[['islands','Islands','Острова','tour'],['culture','Culture','Культура','tour'],['diving','Diving','Дайвинг','activity'],['nature','Nature','Природа','tour'],['kayaking','Kayaking','Каякинг','activity'],['family','Family','Семейный отдых','all'],['food','Food','Кухня','tour'],['adventure','Adventure','Приключения','activity'],['wellness','Wellness','Оздоровление','all']].map(([slug,name_en,name_ru,experience_type],index)=>({id:'synthetic-category-'+index,slug,name_en,name_ru,experience_type,is_active:true,sort_order:index,icon:'Compass'}));
    export const useExperienceCategories=()=>{useSyncExternalStore(subscribe,()=>retry);const error=new URLSearchParams(location.search).get('mode')==='category-error'&&retry===0;return{data:error?[]:categories,isLoading:false,isError:error,refetch:()=>{retry++;window.fixtureCategoryRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};`,
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',t:key=>key});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:value=>'฿'+new Intl.NumberFormat('en').format(value)});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:null});`,
  '@/components/layout/AppLayout': `import {ConsumerHeader} from '${root}/src/components/nav/ConsumerHeader.tsx';export const AppLayout=({children})=><div data-canvas><ConsumerHeader/><main>{children}</main></div>;`,
  '@/components/uno/GlobalPreferencesControls': `export const GlobalPreferencesControls=()=>null;`,
  '@/components/layout/UserAvatarMenu': `export const UserAvatarMenu=()=>null;`,
  '@/components/market/MiniCart': `export const MiniCart=()=>null;`,
  '@/components/miniapp': `export {MiniAppLayout} from '${root}/src/components/miniapp/MiniAppLayout.tsx';export {CatalogCard} from '${root}/src/components/miniapp/CatalogCard.tsx';`,

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
  '@/integrations/supabase/client': `export const supabase=new Proxy({}, {get(){throw Error('Hosted backend forbidden in experiences journey fixture')}});`,
};
Object.assign(virtual, {
 '@/hooks/useYachts': `import {useSyncExternalStore} from 'react';const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};const base={currency:'THB',cover_image:'/fixture-experience.svg',capacity:8,yacht_type:'catamaran',price_full_day:20000};const rows=[{...base,id:'boat-a',name_en:'Synthetic Lagoon',name_ru:'Тестовая Lagoon',price_full_day:10000},{...base,id:'boat-b',name_en:'Synthetic Horizon',name_ru:'Тестовая Horizon',capacity:12},{...base,id:'boat-c',name_en:'Synthetic Motor',name_ru:'Тестовая Motor',yacht_type:'motor_yacht',capacity:4}];export const useYachts=type=>{useSyncExternalStore(subscribe,()=>retry);const error=new URLSearchParams(location.search).get('mode')==='error'&&retry===0;return{yachts:error?[]:rows.filter(r=>!type||r.yacht_type===type),isLoading:false,error:error?new Error('Synthetic read failure'):null,refetch:()=>{retry++;window.fixtureReadRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};`,
 '@/hooks/useBouquets': `import {useSyncExternalStore} from 'react';const listeners=new Set();let retry=0;const subscribe=f=>{listeners.add(f);return()=>listeners.delete(f)};const base={image:'/fixture-experience.svg',price:1500,colors:['red'],flowers:['roses'],category:'roses',style:'classic'};const rows=[{...base,id:'rose-a',name_en:'Synthetic Ruby',name_ru:'Тестовый Ruby',is_popular:true,scarcity_level:'high',social_proof_badge:'Customer favorite'},{...base,id:'rose-b',name_en:'Synthetic Pearl',name_ru:'Тестовый Pearl',colors:['white']},{...base,id:'flower-c',name_en:'Synthetic Tropical',name_ru:'Тестовый Tropical',category:'tropical',colors:['yellow']}];export const useBouquets=options=>{useSyncExternalStore(subscribe,()=>retry);const error=new URLSearchParams(location.search).get('mode')==='error'&&retry===0;return{bouquets:error?[]:rows.filter(r=>!options.category||r.category===options.category),isLoading:false,error:error?new Error('Synthetic read failure'):null,refetch:()=>{retry++;window.fixtureReadRetries++;listeners.forEach(f=>f());return Promise.resolve()}}};`,
 '@/hooks/usePersonaFilter': `export const usePersonaFilter=()=>({personaSlug:null,personaTags:[],applyFilter:x=>x,clearPersona:()=>{}});`,
 '@/hooks/useDynamicFilterOptions': `export const useFlowerFilterOptions=()=>({categoryRibbon:[{id:'all',labelRu:'Все',labelEn:'All'},{id:'roses',labelRu:'Розы',labelEn:'Roses'},{id:'tropical',labelRu:'Тропические',labelEn:'Tropical'}],filterConfig:{sections:[{id:'colorPalette',titleRu:'Цветовая гамма',titleEn:'Color palette',type:'multi',options:[{id:'red',labelRu:'Красный',labelEn:'Red'},{id:'white',labelRu:'Белый',labelEn:'White'}]}]}});`,
 '@/contexts/CartContext': `export const useCart=()=>({getItemsByType:()=>[]});`,
 'react-helmet-async': `export const Helmet=()=>null;`,
});
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Routes,Route,useLocation,useNavigate} from 'react-router-dom';import Page from '${root}/src/pages/yachts/YachtsIndex.tsx';import Flowers from '${root}/src/pages/flowers/FlowersIndex.tsx';window.fixtureReadRetries=0;window.fixtureCategoryRetries=0;function Navigation(){const l=useLocation(),nav=useNavigate();return <aside aria-label="Synthetic history controls" className="border-t p-4"><output data-testid="fixture-location">{l.pathname+l.search}</output><output hidden data-testid="fixture-state">{JSON.stringify(l.state)}</output><button onClick={()=>nav(-1)} data-testid="history-back">QA history back</button><button onClick={()=>nav(1)} data-testid="history-forward">QA history forward</button></aside>}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={[new URLSearchParams(location.search).get('entry')||'/yachts?ref=synthetic']}><Routes><Route path="/flowers" element={<Flowers/>}/><Route path="/yachts/:id" element={<h1>Synthetic detail boundary</h1>}/><Route path="/flowers/bouquet/:id" element={<h1>Synthetic detail boundary</h1>}/><Route path="/yachts" element={<Page/>}/></Routes><Navigation/></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
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
const actual = ['src/pages/yachts/YachtsIndex.tsx','src/pages/flowers/FlowersIndex.tsx','src/components/services/MarketplaceRequestSteps.tsx','src/components/filters/UniversalFilter.tsx','src/components/layout/FeatureLayout.tsx','src/components/shared/UnifiedHeader.tsx','src/components/nav/ConsumerHeader.tsx','src/components/miniapp/CatalogCard.tsx'];
for (const file of actual) if (!inputs.some(input => input.endsWith(file))) throw Error('Actual component missing: ' + file);
if (inputs.some(input => !input.startsWith('synthetic:') && /integrations\/supabase\/client|hooks\/useYachts\.ts$|hooks\/useBouquets\.ts$|hooks\/useExperiences\.ts$|hooks\/useExperienceCategories\.ts$/.test(input))) throw Error('Production data module included');
const routeCss = await readFile(path.join(output, 'fixture.css'), 'utf8');
const css = await postcss([postcssImport(), tailwindcss(path.join(root, 'tailwind.config.ts')), autoprefixer()]).process(await readFile('src/index.css', 'utf8'), { from: path.join(root, 'src/index.css') });
await writeFile(path.join(output, 'fixture.css'), css.css + '\n' + routeCss);
await writeFile(path.join(output, 'fixture-experience.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><path fill="#d9e3df" d="M0 0h640v480H0z"/><path fill="#103552" d="M0 310h640v170H0z"/><text x="24" y="80" font-size="22">SYNTHETIC CATALOGUE QA</text></svg>');
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const sourceFiles = [...actual, 'src/lib/nav/navigationModel.ts', 'src/hooks/useYachts.ts', 'src/hooks/useBouquets.ts', 'src/lib/discovery/yachtCatalogue.ts', 'src/lib/discovery/flowerCatalogue.ts', 'src/lib/adapters/catalogCardAdapters.ts', 'src/styles/public-commerce.css', 'src/index.css', 'src/styles/tokens.css', 'src/styles/consumer-system.css', 'tailwind.config.ts', 'scripts/qa/yachts-flowers-ui.mjs', 'scripts/qa/yachts-flowers-ui.py'];
await writeFile(path.join(output, 'source-provenance.json'), JSON.stringify({
  actualComponents: actual, syntheticBoundaries: Object.keys(virtual),
  sourceHashes: Object.fromEntries(await Promise.all(sourceFiles.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')]))),
  fixtureReadOnly: true, actualPureDurationFormatterFromHook: true,
  limits: 'Synthetic yacht/bouquet offers and read retries, language/currency/auth/persona and AppLayout frame. Actual public header, FeatureLayout, native catalogue controls, UniversalFilter, cards and request steps. No bottom navigation, real map, actual detail, booking, availability, payment or notification acceptance.',
}, null, 2) + '\n');
if (process.argv.includes('--build-only')) process.exit(0);
const run = spawnSync(process.env.PYTHON || 'python3', ['scripts/qa/yachts-flowers-ui.py', output], { stdio: 'inherit', timeout: 480000 });
process.exitCode = run.status ?? 1;
