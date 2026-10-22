// Real anonymous Landing, public navigation, search and cards. Synthetic data only; no backend.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output =
  process.env.HOME_GALLERY_OUTPUT || '/tmp/browser/homepage-galleries-isolated';
await mkdir(output, { recursive: true });
await rm(path.join(output, 'results.json'), { force: true });
const virtual = {
  'home-fixture': `
    const params=new URLSearchParams(location.search);export const lang=params.get('lang')||'en';export const state=params.get('state')||'data';
    export const loading=state==='loading',error=state==='error';export const retry=()=>window.fixtureRetries=(window.fixtureRetries||0)+1;
    export const projects=['bang_tao','rawai','kamala','nai_harn','layan','cherng_talay'].map((district,i)=>({id:'project-'+i,name_en:'Fixture community '+(i+1),name_ru:'Тестовый комплекс '+(i+1),district,images:[],cover_image:null}));
    export const rows=state==='data'?projects:[];
  `,
  '@/contexts/LanguageContext': `import{lang}from'home-fixture';export const useLanguage=()=>({language:lang,setLanguage:()=>{}});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:null});`,
  '@/contexts/CurrencyContext': `export const currencies=[];export const useCurrency=()=>({currency:'THB',formatPrice:(n)=>'฿'+n.toLocaleString('en'),setCurrency:()=>{}});`,
  '@/contexts/ThemeContext': `export const useTheme=()=>({theme:'light',setTheme:t=>{window.fixtureTheme=t;document.documentElement.classList.toggle('dark',t==='dark')}});`,
  '@/components/layout/UserAvatarMenu': `export const UserAvatarMenu=()=>null;`,
  '@/components/market/MiniCart': `export const MiniCart=()=>null;`,
  '@/components/layout/AllAppsDrawer': `export const AllAppsDrawer=()=>null;`,
  '@/components/concierge/ConciergeHelpSheet': `export const ConciergeHelpSheet=()=>null;`,
  '@/components/seo/SEOHead': `export const SEOHead=()=>null;`,
  '@/hooks/usePWAInstall': `export const usePWAInstall=()=>({canInstall:false,isInstalled:false,isIOS:false,install:()=>{}});`,
  '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
  '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
  '@/hooks/useUserCollections': `export const useUserCollections=()=>({isInCollection:()=>false,toggleCollection:()=>{}});`,
  '@/hooks/usePropertyProjects': `import{rows,loading,error,retry}from'home-fixture';export const usePublicPropertyProjects=()=>({data:rows,isLoading:loading,isError:error,refetch:retry});`,
  '@/hooks/useProperties': `import{rows,loading,error,retry}from'home-fixture';export const useProperties=()=>({data:rows.map((p,i)=>({id:'home-'+i,title_en:'Fixture home '+(i+1),title_ru:'Тестовое жильё '+(i+1),district:p.district,property_type:'villa',listing_type:'rent',images:[],bedrooms:2,area_sqm:120,price:2000,price_period:'night',currency:'THB',created_at:'2026-10-01',updated_at:'2026-10-01'})),isLoading:loading,isError:error,refetch:retry});export const usePropertiesByProject=(id,limit,opts)=>({data:{total:opts.mode==='buy'?1:opts.propertyType==='condo'&&id==='project-0'?0:3},isSuccess:!loading&&!error,isLoading:loading,isError:error});`,
  '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>({propertyTypes:[{id:'villa',labelRu:'Вилла',labelEn:'Villa'},{id:'condo',labelRu:'Кондо',labelEn:'Condo'}],isLoading:false});`,
  '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[{id:'rawai',valueKey:'rawai',labelRu:'Равай',labelEn:'Rawai'}],isLoading:false});`,
  '@/hooks/useExperiences': `import{rows,loading,error,retry}from'home-fixture';export const useExperiences=()=>({experiences:rows.map((p,i)=>({id:'experience-'+i,title_en:'Fixture island tour '+(i+1),title_ru:'Тестовый тур '+(i+1),images:[]})),isLoading:loading,error:error?new Error('Fixture error'):null,refetch:retry});`,
  '@/hooks/useServiceMarketplace': `import{rows,loading,error,retry}from'home-fixture';export const useMarketplaceServices=()=>({data:rows.map((p,i)=>({id:'service-'+i,provider_id:'provider-'+i,name_en:'Fixture home service '+(i+1),name_ru:'Тестовая услуга '+(i+1),images:[],provider:{name:'Fixture provider '+(i+1)}})),isLoading:loading,isError:error,refetch:retry});`,
  '@/hooks/useBouquets': `import{rows,loading,error,retry}from'home-fixture';export const useBouquets=()=>({bouquets:rows.slice(0,2).map((p,i)=>({id:'bouquet-'+i,name_en:'Fixture bouquet '+(i+1),name_ru:'Тестовый букет '+(i+1),shop:{name_en:'Fixture florist',name_ru:'Тестовый флорист'}})),isLoading:loading,error:error?new Error('Fixture error'):null,refetch:retry});`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
// Optional ephemeral, allowlisted public-catalog snapshot for local visual QA.
// Never committed or used as a runtime fallback.
const snapshotArg = process.argv.find((arg) =>
  arg.startsWith('--catalog-snapshot='),
);
if (snapshotArg) {
  const snapshot = JSON.parse(
    await readFile(snapshotArg.split('=').slice(1).join('='), 'utf8'),
  );
  virtual['home-fixture'] =
    `const params=new URLSearchParams(location.search);export const lang=params.get('lang')||'en';export const state=params.get('state')||'data';export const loading=false,error=false,retry=()=>{};export const catalog=${JSON.stringify(snapshot)};export const projects=catalog.projects;export const rows=projects;`;
  virtual['@/hooks/useProperties'] =
    `import{catalog}from'home-fixture';export const useProperties=()=>({data:catalog.homes,isLoading:false,isError:false,refetch:()=>{}});export const usePropertiesByProject=()=>({data:{total:0},isSuccess:true,isLoading:false,isError:false});`;
  virtual['@/hooks/useExperiences'] =
    `import{catalog}from'home-fixture';export const useExperiences=()=>({experiences:catalog.experiences,isLoading:false,error:null,refetch:()=>{}});`;
  virtual['@/hooks/useServiceMarketplace'] =
    `import{catalog}from'home-fixture';export const useMarketplaceServices=()=>({data:catalog.services,isLoading:false,isError:false,refetch:()=>{}});`;
  virtual['@/hooks/useBouquets'] =
    `import{catalog}from'home-fixture';export const useBouquets=()=>({bouquets:catalog.flowers,isLoading:false,error:null,refetch:()=>{}});`;
}
const result = await build({
  stdin: {
    contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,useLocation}from'react-router-dom';import Landing from'${root}/src/pages/Landing.tsx';import{UnifiedChatFAB}from'${root}/src/components/chat/UnifiedChatFAB.tsx';function Fixture(){const loc=useLocation();return <><Landing/><UnifiedChatFAB/><output hidden data-testid="location">{loc.pathname+loc.search}</output></>;}createRoot(document.getElementById('root')).render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter>);`,
    loader: 'tsx',
    resolveDir: root,
  },
  bundle: true,
  outfile: path.join(output, 'fixture.js'),
  jsx: 'automatic',
  format: 'esm',
  metafile: true,
  loader: { '.webp': 'file', '.png': 'file', '.svg': 'file' },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env.DEV': 'false',
    'import.meta.env.VITE_SUPABASE_URL': '"http://127.0.0.1:54321"',
  },
  plugins: [
    {
      name: 'isolated-home',
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) => {
          if (Object.hasOwn(virtual, args.path))
            return { path: args.path, namespace: 'fixture' };
          if (args.path.startsWith('@/')) {
            const base = path.join(root, 'src', args.path.slice(2));
            const resolved = [
              base,
              base + '.ts',
              base + '.tsx',
              path.join(base, 'index.ts'),
              path.join(base, 'index.tsx'),
            ].find((p) => existsSync(p) && statSync(p).isFile());
            if (!resolved) throw Error('Unresolved ' + args.path);
            return { path: resolved };
          }
        });
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (args) => ({
          contents: virtual[args.path],
          loader: 'tsx',
          resolveDir: root,
        }));
      },
    },
  ],
});
if (
  Object.keys(result.metafile.inputs).some(
    (p) =>
      !p.startsWith('fixture:') && /integrations\/supabase\/client/.test(p),
  )
)
  throw Error('Production client included');
const css = await Promise.all(
  ['/src/index.css?direct', '/src/styles/cinematic-home.css?direct'].map(
    async (file) => {
      const r = await fetch('http://localhost:8080' + file);
      if (!r.ok) throw Error('Missing CSS ' + file);
      return r.text();
    },
  ),
);
await writeFile(path.join(output, 'fixture.css'), css.join('\n'));
await writeFile(
  path.join(output, 'fixture.html'),
  '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
);
if (!process.argv.includes('--build-only')) {
  const r = spawnSync(
    'python3',
    [path.join(root, 'scripts/qa/homepage-galleries-ui.py'), output],
    { stdio: 'inherit' },
  );
  process.exitCode = r.status ?? 1;
}
