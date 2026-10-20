// Actual consumer shell, headers, browse sticky region and marketing pages.
// Only account/data reads and unrelated closed overlays are synthetic.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { propertyFilterOptions } from './combined-layout-fixture-data.mjs';
const root = process.cwd();
const output = '/tmp/browser/combined-layout-isolated';
await mkdir(output, { recursive: true });
await rm(path.join(output, 'fixture.css'), { force: true });
const virtual = {
 '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en',setLanguage:()=>{},t:key=>key});`,
 '@/contexts/AuthContext': `export const useAuth=()=>({user:new URLSearchParams(location.search).get('auth')==='guest'?null:{id:'synthetic',email:'fixture@example.invalid',user_metadata:{full_name:'Fixture Account'}},signOut:()=>{}});`,
 '@/contexts/ThemeContext': `export const useTheme=()=>({theme:'light',resolvedTheme:'light',setTheme:()=>{}});`,
 '@/contexts/CurrencyContext': `export const currencies={THB:{code:'THB',symbol:'฿',name:'Thai baht',nameRu:'Бат',nameTh:'บาท'}};export const useCurrency=()=>({currency:'THB',currencyInfo:currencies.THB,setCurrency:()=>{},formatPrice:n=>'฿'+n});`,
 '@/contexts/CartContext': `export const useCart=()=>({getItemsByType:()=>[],getItemCount:()=>0,removeItem:()=>{}});`,
 '@/contexts/PlatformViewAsContext': `export const usePlatformViewAs=()=>({enter:()=>{}});`,
 '@/hooks/useUserContext': `export const useUserContext=()=>({availableRoles:['guest'],activeRole:'guest',switchContext:()=>{}});`,
 '@/hooks/useNotifications': `export const useNotifications=()=>({unreadCount:0});`,
 '@/hooks/useIsAdmin': `export const useIsAdmin=()=>({isAdmin:false});`,
 '@/hooks/useOwnerType': `export const useOwnerType=()=>({isMCPortal:false,isLoading:false});`,
 '@/hooks/useReferral': `export const useReferral=()=>({referralCode:'synthetic-only',isLoading:false,getShareLink:()=>'/fixture',copyReferralCode:()=>{},copyShareLink:()=>{}});`,
 '@/hooks/usePrefetch': `export const usePrefetchRoute=()=>({prefetchRoute:()=>{}});`,
 '@/lib/prefetchRoute': `export const prefetchRoute=()=>{};`,
 '@/components/layout/AllAppsDrawer': `export const AllAppsDrawer=()=>null;`,
 '@/components/search/GlobalSearchModal': `export const GlobalSearchModal=()=>null;`,
 '@/components/nav/SideRail': `export const SideRail=()=>{throw Error('Unexpected workspace shell')};`,
 '@/components/nav/ContextualFAB': `export const ContextualFAB=()=>null;`,
 '@/components/layout/AppLayout': `import React from 'react';import{NavShell}from'${root.replaceAll('\\','/')}/src/components/nav/NavShell.tsx';import{useNavShellActive}from'${root.replaceAll('\\','/')}/src/components/nav/NavShellContext.tsx';export const AppLayout=({children,showHeader=true})=>useNavShellActive()?<>{children}</>:<NavShell role="guest" showHeader={showHeader}>{children}</NavShell>;`,
 '@/hooks/useProperties': `export const usePropertiesInfinite=()=>({data:{pages:[{properties:[]}]},isLoading:false,isError:false,hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{},refetch:()=>{}});`,
 '@/hooks/useRecentlyViewed': `export const useRecentlyViewed=()=>({items:[]});`,
 '@/hooks/usePropertyFilterOptions': `export const usePropertyFilterOptions=()=>(${JSON.stringify(propertyFilterOptions)});`,
 '@/hooks/usePropertyQuickFilters': `export const usePropertyQuickFilters=()=>({districts:[],quickFilters:[],projects:[]});`,
 '@/hooks/usePersonaFilter': `export const usePersonaFilter=()=>({applyFilter:rows=>rows});`,
 '@/components/seo': `export const SEOHead=()=>null;`,
 '@/components/property/PropertyMapView': `export const PropertyMapView=()=>null;`,
 '@/components/property/PropertyListingCard': `export const PropertyListingCard=()=>null;`,
 '@/components/crosssell': `export const CrossSellSection=()=>null;`,
 '@/components/vertical/VerticalContextBanner': `export const VerticalContextBanner=()=>null;`,
 '@/components/vertical/VerticalInsightPanel': `export const VerticalInsightPanel=()=>null;`,
 '@/components/landings/PersonaFilterChip': `export const PersonaFilterChip=()=>null;`,
 'fixture:PropertyHub': `export const PropertyHubTabs=()=>null;`,
 '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database access forbidden')}});`,
};
const sourceRoot = root.replaceAll('\\','/');
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter,useLocation} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {NavShell} from '${sourceRoot}/src/components/nav/NavShell.tsx';
import {MeShellLayout} from '${sourceRoot}/src/components/layout/MeShellLayout.tsx';
import PropertyIndex from '${sourceRoot}/src/pages/property/PropertyIndex.tsx';
import Local from '${sourceRoot}/src/pages/ForLocalServices.tsx';
import Developers from '${sourceRoot}/src/pages/ForDevelopers.tsx';
import Management from '${sourceRoot}/src/pages/ForManagementCompanies.tsx';
import Owners from '${sourceRoot}/src/pages/ForOwners.tsx';
import Business from '${sourceRoot}/src/pages/ForBusinessPage.tsx';
const params=new URLSearchParams(location.search);
document.documentElement.lang=params.get('lang')||'en';
const surface=params.get('surface')||'property';
const start=surface==='property'?'/property/browse':surface==='account'?'/me/requests':'/for-'+surface;
function Fixture(){const loc=useLocation();return <>
 <output hidden data-testid="location">{loc.pathname+loc.search}</output>
 {surface==='property'?<NavShell role="guest"><PropertyIndex/><div style={{height:1800}}/></NavShell>
 :surface==='account'?<MeShellLayout><div style={{height:2200}}>Synthetic account content</div></MeShellLayout>
 :surface==='local-services'?<Local/>:surface==='developers'?<Developers/>
 :surface==='owners'?<Owners/>:surface==='business'?<Business/>:<Management/>}
</>}
createRoot(document.getElementById('root')).render(<HelmetProvider><MemoryRouter initialEntries={[start]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Fixture/></MemoryRouter></HelmetProvider>);`;
const result = await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
 plugins:[{name:'isolated-layout-data',setup(b){
  b.onResolve({filter:/.*/},args=>{
   if(args.path==='./PropertyHub'&&args.importer.endsWith('/PropertyIndex.tsx'))return{path:'fixture:PropertyHub',namespace:'fixture'};
   if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};
   if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}
  });
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
 }}],
});
const inputs=Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/'));
for(const required of ['nav/NavShell.tsx','nav/TopBar.tsx','nav/ConsumerHeader.tsx','nav/BottomBar.tsx','landings/LandingChrome.tsx','property/PropertyIndex.tsx','layout/MeShellLayout.tsx','uno/GlobalPreferencesControls.tsx','uno/LanguageSwitcher.tsx','layout/UserAvatarMenu.tsx','market/MiniCart.tsx','property/AirbnbSearchBar.tsx','pages/ForOwners.tsx','pages/ForBusinessPage.tsx']){
 if(!inputs.some(p=>!p.startsWith('fixture:')&&p.endsWith(required)))throw Error('Actual component missing: '+required);
}
if(inputs.some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|contexts\/(AuthContext|CartContext|CurrencyContext|ThemeContext)|hooks\/(useProperties|useNotifications|useUserContext|useReferral)\.ts/.test(p)))throw Error('Production data dependency included');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify(inputs,null,2));
let css;
if(process.env.COMBINED_LAYOUT_CSS_FILE)css=await readFile(process.env.COMBINED_LAYOUT_CSS_FILE,'utf8');
else{const response=await fetch('http://localhost:8080/src/index.css?direct');if(!response.ok)throw Error('Production CSS unavailable');css=await response.text();}
if(existsSync(path.join(output,'fixture.css')))css+='\n'+await readFile(path.join(output,'fixture.css'),'utf8');
await writeFile(path.join(output,'fixture.css'),css);
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
if(!process.env.CI||process.env.GITHUB_ACTIONS!=='true')throw Error('Browser execution is GitHub CI-only; local use is --build-only');
const run=spawnSync('python3',[path.join(root,'scripts/qa/combined-layout-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
