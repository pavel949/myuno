// Real public surfaces and cards. Only reads/closed peripheral tools are synthetic.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { propertyFilterOptions } from './combined-layout-fixture-data.mjs';
const root = process.cwd().replaceAll('\\', '/');
const output = process.env.PUBLIC_WIDE_OUTPUT || '/tmp/browser/public-wide-isolated';
await mkdir(output, { recursive: true });
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',setLanguage:()=>{},t:key=>key});`,
 '@/contexts/AuthContext': `export const useAuth=()=>({user:null,signOut:()=>{}});`,
 '@/contexts/ThemeContext': `export const useTheme=()=>({theme:'light',resolvedTheme:'light',setTheme:()=>{}});`,
 '@/contexts/CurrencyContext': `export const currencies={THB:{code:'THB',symbol:'฿',name:'Thai baht',nameRu:'Бат',nameTh:'บาท'}};export const useCurrency=()=>({currency:'THB',currencyInfo:currencies.THB,setCurrency:()=>{},formatPrice:n=>'฿'+n});`,
 '@/contexts/CartContext': `export const useCart=()=>({getItemsByType:()=>[],getItemCount:()=>0,removeItem:()=>{}});`,
 '@/contexts/GoogleMapsContext': `export const useGoogleMaps=()=>({hasKey:false,isLoaded:false,loadError:null});`,
 '@/contexts/PlatformViewAsContext': `export const usePlatformViewAs=()=>({enter:()=>{}});`,
 '@/hooks/useUserContext': `export const useUserContext=()=>({availableRoles:['guest'],activeRole:'guest',switchContext:()=>{}});`,
 '@/hooks/useNotifications': `export const useNotifications=()=>({unreadCount:0});`,
 '@/hooks/useIsAdmin': `export const useIsAdmin=()=>({isAdmin:false});`,
 '@/hooks/useOwnerType': `export const useOwnerType=()=>({isMCPortal:false,isLoading:false});`,
 '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
 '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
 '@/components/layout/AllAppsDrawer': `export const AllAppsDrawer=()=>null;`,
 '@/components/search/GlobalSearchModal': `export const GlobalSearchModal=()=>null;`,
 '@/components/nav/SideRail': `export const SideRail=()=>{throw Error('Unexpected workspace shell')};`,
 '@/components/nav/ContextualFAB': `export const ContextualFAB=()=>null;`,
 '@/components/layout/AppLayout': `import React from 'react';import{NavShell}from'${root}/src/components/nav/NavShell.tsx';import{useNavShellActive}from'${root}/src/components/nav/NavShellContext.tsx';import{ECOSYSTEM_PAGE_CONTAINER}from'${root}/src/design-system/ecosystemLayout.ts';export const AppLayout=({children,showHeader=true,usePageContainer=true})=>useNavShellActive()?<>{children}</>:<NavShell role="guest" showHeader={showHeader}>{usePageContainer?<div data-fixture-auto-frame className={ECOSYSTEM_PAGE_CONTAINER}>{children}</div>:children}</NavShell>;`,
 '@/hooks/useProperties': `const p=new URLSearchParams(location.search),state=p.get('state');const image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#ddd"/><text x="40" y="240" fill="#123">SYNTHETIC LAYOUT FIXTURE</text></svg>');const rows=Array.from({length:8},(_,i)=>({id:'synthetic-'+i,title_en:'Synthetic layout home '+i,title_ru:'Тестовый объект '+i,property_type:'villa',listing_type:'rent',approval_status:'approved',is_active:true,price_per_night:1000,price:1000,price_period:'night',currency:'THB',bedrooms:2,bathrooms:1,area_sqm:100,max_guests:6,cover_image:image,images:[image],lat:7.9+i*.001,lng:98.3+i*.001,created_at:'2026-10-20',updated_at:'2026-10-20'}));export const usePropertiesInfinite=()=>({data:{pages:[{properties:state==='empty'||state==='error'?[]:rows}]},isLoading:state==='loading',isError:state==='error',hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{},refetch:()=>{}});`,
 '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>(${JSON.stringify(propertyFilterOptions)});`,
 '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[],quickFilters:[],projects:[]});`,
 '@/hooks/useServiceMarketplace': `export const useMarketplaceServices=()=>({data:[],isLoading:false,isError:false,refetch:()=>{}});`,
 '@/hooks/usePersonaFilter': `export const usePersonaFilter=()=>({applyFilter:rows=>rows});`,
 '@/hooks/useSearchPropertyAvailability': `export const useSearchPropertyAvailability=()=>({enabled:false,pending:false,failed:false,availableIds:new Set(),retry:()=>{}});`,
 '@/components/services': `export{ServiceFunctionCard}from'${root}/src/components/services/ServiceFunctionCard.tsx';`,
 './ServiceBookingSheet': `export const ServiceBookingSheet=()=>null;`,
 '@/components/uno/FavoriteButton': `export const FavoriteButton=()=>null;`,
 '@/components/crosssell': `export const CrossSellSection=()=>null;`,
 '@/components/crosssell/CrossSellSection': `export const CrossSellSection=()=>null;`,
 '@/components/leads/VerticalCTA': `export const VerticalCTA=()=>null;`,
 '@/components/property/OffplanCTASection': `export const OffplanCTASection=()=>null;`,
 '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
 '@/components/seo': `export const SEOHead=()=>null;`,
 '@/lib/analytics/track': `export const trackEvent=()=>{};`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database access forbidden')}});`,
};
const result = await build({
 stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{MemoryRouter,useLocation}from'react-router-dom';import{HelmetProvider}from'react-helmet-async';import{NavShell}from'${root}/src/components/nav/NavShell.tsx';import{CompareProvider}from'${root}/src/components/property/PropertyCompare.tsx';import Services from'${root}/src/pages/services/ServicesIndex.tsx';import Search from'${root}/src/pages/property/PropertySearchPage.tsx';import Business from'${root}/src/pages/ForBusinessPage.tsx';const params=new URLSearchParams(location.search),surface=params.get('surface')||'services',start=surface==='housing'?'/property/search':surface==='business'?'/for-business':'/discover/services';function App(){const l=useLocation();return <><NavShell role="guest"><div className="border-b px-4 py-2 text-xs">Synthetic layout fixture · no live data</div>{surface==='housing'?<CompareProvider><Search/></CompareProvider>:surface==='business'?<Business/>:<Services/>}</NavShell><output hidden data-testid="fixture-route">{l.pathname+l.search}</output></>}createRoot(document.getElementById('root')).render(<HelmetProvider><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={[start+(params.get('view')==='map'?'?view=map':'')]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></MemoryRouter></QueryClientProvider></HelmetProvider>);`,loader:'tsx',resolveDir:root},
 bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
 // An empty synthetic Vite environment keeps optional integrations disabled.
 // Defining DEV alone leaves other import.meta.env reads undefined in esbuild.
 define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}','import.meta.env.DEV':'false'},
 plugins:[{name:'isolated-public-layout',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
   if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}
  });b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
 }}],
});
const inputs=Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/'));
for(const actual of ['nav/ConsumerHeader.tsx','pages/services/ServicesIndex.tsx','services/ServiceFunctionCard.tsx','pages/property/PropertySearchPage.tsx','home/HomeDiscoverySearch.tsx','property/PropertyListingCard.tsx','property/PropertyMapView.tsx','pages/ForBusinessPage.tsx'])if(!inputs.some(p=>!p.startsWith('fixture:')&&p.endsWith(actual)))throw Error('Actual surface absent: '+actual);
if(inputs.some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useProperties|usePropertyFilterOptions|usePropertyQuickFilters|useServiceMarketplace|useSearchPropertyAvailability)\.ts$/.test(p)))throw Error('Production read module bundled');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify(inputs,null,2));
if(process.argv.includes('--bundle-only'))process.exit(0);
const css=await Promise.all(['/src/index.css?direct','/src/styles/consumer-system.css?direct','/src/styles/cinematic-home.css?direct','/src/styles/property-search.css?direct','/src/styles/public-commerce.css?direct'].map(async file=>{const response=await fetch('http://localhost:8080'+file);if(!response.ok)throw Error('CSS unavailable: '+file);return response.text();}));
await writeFile(path.join(output,'fixture.css'),css.join('\n'));
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
if(!process.env.CI||process.env.GITHUB_ACTIONS!=='true')throw Error('Browser execution is remote GitHub CI-only');
const run=spawnSync('python3',[path.join(root,'scripts/qa/public-wide-layout-ui.py'),output],{stdio:'inherit'});process.exitCode=run.status??1;
