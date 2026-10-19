// Real UI components; synthetic records; browser assets are local-only.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/ui-backlog-isolated';
await mkdir(output, { recursive: true });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#cbd5df"/><path d="M0 470L280 240 510 420 790 160 1200 450V600H0Z" fill="#7c8d9e"/><rect x="390" y="230" width="440" height="270" fill="#e8e5de"/><path d="M420 270H800M420 340H800M420 410H800" stroke="#263b50" stroke-width="30"/><text x="35" y="55" fill="#263b50" font-size="26">SYNTHETIC PROJECT IMAGE — NO REAL LISTING</text></svg>`;
const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const virtual = {
  '@/contexts/LanguageContext': `const language=new URLSearchParams(location.search).get('lang')||'ru';export const useLanguage=()=>({language,setLanguage:value=>{window.fixtureLanguage=value},t:key=>({'auth.showPassword':language==='ru'?'Показать пароль':'Show password','auth.hidePassword':language==='ru'?'Скрыть пароль':'Hide password'}[key]||key)});`,
  '@/contexts/ThemeContext': `export const useTheme=()=>({theme:'light',setTheme:value=>{window.fixtureTheme=value}});`,
  '@/contexts/CurrencyContext': `export const currencies={THB:{code:'THB',symbol:'฿',name:'Thai baht',nameRu:'Тайский бат'}};export const useCurrency=()=>({currency:'THB',currencyInfo:currencies.THB,setCurrency:()=>{}});`,
  '@/hooks/useUserCollections': `import {useSyncExternalStore} from 'react';let saved=false;const listeners=new Set();export function useUserCollections(){useSyncExternalStore(cb=>{listeners.add(cb);return()=>listeners.delete(cb)},()=>saved);return{isInWishlist:()=>saved,toggleWishlist:async id=>{window.fixtureWishlist.push(id);saved=!saved;listeners.forEach(cb=>cb())}};}`,
  '@/hooks/useNewbuildProjects': `export const useNewbuildProject=()=>({isLoading:false,data:{id:'synthetic-project',name_en:'Synthetic coastal project',name_ru:'Тестовый проект у моря',landing_enabled:true,project_status:'under_construction',description_ru:'Синтетическое описание для проверки оформления. Это не предложение недвижимости.',description_en:'Synthetic description for visual verification. This is not a property offer.',tagline:'Synthetic fixture · Тестовые данные',location_area:'Synthetic area',price_from:7234567,construction_progress:37,cover_image:${JSON.stringify(image)},amenities:['Synthetic amenity A','Synthetic amenity B'],developer_name:'Synthetic developer'}});`,
  '@/hooks/useProjectUnits': `export const useProjectUnits=()=>({data:[{id:'synthetic-unit',name:'Synthetic unit / Тестовый юнит',bedrooms:2,area_sqm:64.5,price:7234567}]});`,
  '@/integrations/supabase/client': `const forbidden=action=>{window.fixtureForbiddenWrites.push(action);throw Error('Production data forbidden: '+action)};export const supabase={auth:{getSession:async()=>({data:{session:{user:{id:'synthetic-user'}}}}),setSession:()=>forbidden('auth.setSession'),updateUser:()=>forbidden('auth.updateUser'),signOut:()=>forbidden('auth.signOut')},from:table=>table==='analytics_events'?{insert:async value=>{window.fixtureAnalytics.push(value);return{error:null}}}:forbidden('from:'+table)};`,
  '@/lib/newbuilds/attribution': `export const recordAttribution=async()=>{window.fixtureForbiddenWrites.push('recordAttribution');throw Error('Attribution writes forbidden')};`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});`,
};
const result = await build({
  stdin: { contents: `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,Route,Routes,useLocation} from 'react-router-dom';import {HelmetProvider} from 'react-helmet-async';
import ProjectMicrosite from '${root}/src/pages/microsite/ProjectMicrosite.tsx';import ResetPassword from '${root}/src/pages/auth/ResetPassword.tsx';import {WishlistButton} from '${root}/src/components/market/WishlistButton.tsx';import {NbLightbox} from '${root}/src/components/newbuilds/NbLightbox.tsx';import {DealPriorityStars} from '${root}/src/components/owner/sales/DealPriorityStars.tsx';import {CategoryPicker} from '${root}/src/components/vendor/onboarding/CategoryPicker.tsx';import {Button} from '${root}/src/components/ui/button.tsx';
const params=new URLSearchParams(location.search),lang=params.get('lang')||'ru',scene=params.get('scene')||'microsite',isRu=lang==='ru';document.documentElement.lang=lang;
window.fixtureWishlist=[];window.fixtureForbiddenWrites=[];window.fixtureAnalytics=[];
function Controls(){const [priority,setPriority]=useState(2),[open,setOpen]=useState(false),[category,setCategory]=useState('');return <main className="mx-auto w-full max-w-3xl space-y-6 p-4"><h1 className="text-h2">{isRu?'Проверка элементов интерфейса':'Interface controls check'}</h1><p className="text-body-sm text-muted-foreground">Synthetic fixture / Тестовые данные</p><section aria-label="Wishlist" className="space-y-3 border border-border bg-card p-4"><h2 className="text-h4">{isRu?'Избранное':'Wishlist'}</h2><div className="flex flex-wrap items-center gap-4"><WishlistButton productId="synthetic-product"/><WishlistButton productId="synthetic-product" variant="full"/></div></section><section aria-label="Priority" className="space-y-3 border border-border bg-card p-4"><h2 className="text-h4">{isRu?'Приоритет':'Priority'}</h2><DealPriorityStars priority={priority} onChange={setPriority}/><output hidden data-testid="priority-boundary">{priority}</output></section><section aria-label="Gallery" className="nb-theme space-y-3 border border-border bg-card p-4"><Button onClick={()=>setOpen(true)}>{isRu?'Открыть галерею':'Open gallery'}</Button>{open&&<NbLightbox images={[${JSON.stringify(image)},${JSON.stringify(image)}]} captions={['Synthetic image 1','Synthetic image 2']} onClose={()=>setOpen(false)}/>}</section><section aria-label="Vendor category" className="space-y-3 border border-border bg-card p-4"><h2 className="text-h4">{isRu?'Категория бизнеса':'Business category'}</h2><CategoryPicker value={category} onChange={value=>setCategory(value)}/><output hidden data-testid="category-boundary">{category}</output></section></main>}
function Boundary(){return <output hidden data-testid="route-boundary">{useLocation().pathname}</output>}
createRoot(document.getElementById('root')).render(<HelmetProvider><MemoryRouter initialEntries={[scene==='microsite'?'/p/synthetic-slug':scene==='reset'?'/auth/reset-password':'/fixture-controls']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Routes><Route path="/p/:slug" element={<ProjectMicrosite/>}/><Route path="/auth/reset-password" element={<ResetPassword/>}/><Route path="/fixture-controls" element={<Controls/>}/><Route path="*" element={<p>Synthetic destination boundary</p>}/></Routes><Boundary/></MemoryRouter></HelmetProvider>);`, loader:'tsx',resolveDir:root },
  bundle:true,outfile:path.join(output,'app.js'),jsx:'automatic',format:'esm',metafile:true,
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'isolated-ui-backlog-data',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved)throw Error('Unresolved import: '+args.path);
        return{path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
const inputs=Object.keys(result.metafile.inputs);
if(inputs.some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useNewbuildProjects|useProjectUnits|useUserCollections)\.ts$|lib\/newbuilds\/attribution/.test(p)))throw Error('Production data module included');
// This stylesheet must come from the actual standalone ProjectMicrosite import,
// never from a fixture-only import or a preceding visit to another lazy route.
if(!inputs.some(p=>p.endsWith('src/styles/newbuilds-theme.css')))throw Error('Standalone microsite theme import missing');
if(!existsSync(path.join(output,'app.css')))throw Error('Component stylesheet output missing');
if(process.argv.includes('--bundle-only'))process.exit(0);
const response=await fetch('http://localhost:8080/src/index.css?direct');
if(!response.ok)throw Error('Preview CSS unavailable');
await writeFile(path.join(output,'fixture.css'),await response.text());
// Preserve esbuild's app.css alongside global Tailwind CSS; do not overwrite it.
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/ui-backlog-salvage.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
