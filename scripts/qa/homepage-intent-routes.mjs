// Actual routed search/detail/owner/service surfaces; synthetic boundaries only.
// With this worktree Vite on localhost:8080: node scripts/qa/homepage-intent-routes.mjs
// --build-only emits fixture; HOME_INTENT_OUTPUT selects artifact directory.
// HOME_INTENT_ONLY=owner runs a bounded owner-only browser matrix.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { propertyFilterOptions } from './combined-layout-fixture-data.mjs';
const root = process.cwd().replaceAll('\\', '/');
const output = process.env.HOME_INTENT_OUTPUT || '/tmp/browser/homepage-intent-routes';
await mkdir(output, { recursive: true });
// Reuse the established, explicit public-wide synthetic contexts without executing its runner.
const pattern = await readFile(path.join(root, 'scripts/qa/public-wide-layout-ui.mjs'), 'utf8');
const object = pattern.match(/const virtual = (\{[\s\S]*?\n\});\nconst result/);
if (!object) throw Error('Public-wide fixture adapter declaration changed; review before reuse');
const virtual = new Function('root', 'propertyFilterOptions', `return (${object[1]});`)(root, propertyFilterOptions);
const noop = name => `export const ${name}=()=>null;`;
Object.assign(virtual, {
 'intent-fixture': `export const intent=new URLSearchParams(location.search).get('intent')||'holiday';export const deny=()=>{window.fixtureForbidden.push('Unexpected mutation');throw Error('Production mutation forbidden')};export const row={id:'synthetic-'+intent,title_en:'Synthetic routed home',title_ru:'Тестовый объект маршрута',property_type:'villa',listing_type:intent==='buy'?'sale':'rent',listing_modes:intent==='buy'?['sale']:['rent'],tenancy_modes:intent==='monthly'?['medium']:intent==='year'?['long']:['short'],is_active:true,approval_status:'approved',district:'layan',price:2500,price_per_night:2500,price_per_month:60000,sale_price:9500000,price_period:intent==='monthly'?'month':intent==='year'?'year':'night',currency:'THB',bedrooms:2,bathrooms:2,area_sqm:140,max_guests:6,cover_image:'/synthetic-property.svg',images:['/synthetic-property.svg'],created_at:'2026-10-20',updated_at:'2026-10-20',rentalTerms:{price_per_night:2500,max_guests:6,min_stay_nights:1,instant_booking:false,check_in_time:'15:00',check_out_time:'11:00'}};`,
 '@/hooks/useProperties': `import{row}from'intent-fixture';export const usePropertiesInfinite=filters=>{window.fixtureFilters=filters;return{data:{pages:[{properties:[row]}]},isLoading:false,isError:false,hasNextPage:false,isFetchingNextPage:false,fetchNextPage:()=>{},refetch:()=>{}}};export const usePropertyWithRentalTerms=id=>({data:id===row.id?row:null,isLoading:false});`,
 '@/contexts/LocationContext': `export const useLocation=()=>({currentCity:{name_en:'Phuket',name_ru:'Пхукет'}});`,
 '@/contexts/AuthSheetContext': `export const useAuthSheet=()=>({openAuthSheet:options=>{window.fixtureAuthIntent=options.intent}});`,
 '@/hooks/usePropertyUnavailableDates': `export const usePropertyUnavailableDates=()=>({data:[],isLoading:false,isError:false,isSuccess:true,refetch:()=>{}});`,
 '@/hooks/usePropertyRateSeasons': `export const usePropertyRateSeasons=()=>({data:[],isLoading:false});`,
 '@/hooks/usePropertyListingQuality': `export const usePropertyMedia=()=>({data:[]});export const mediaAlt=()=>'';export const mediaCaption=()=>'';export const amenityName=()=>'';export const usePropertyAmenities=()=>({data:[],isLoading:false});`,
 '@/hooks/useFeatureFlag': `export const useFeatureFlag=()=>false;`,
 '@/hooks/useUniversalLead': `export const useUniversalLead=()=>({submitLead:{isPending:false,mutateAsync:async payload=>{window.fixtureLead=payload;return{id:'synthetic-acknowledgement-only'}}}});`,
 '@/hooks/useCapitalIntroRequest': `import{deny}from'intent-fixture';export const useCapitalIntroRequest=()=>({isPending:false,mutateAsync:deny});`,
 '@/hooks/useGuestPropertyChat': `import{deny}from'intent-fixture';export const useGuestPropertyChat=()=>({messages:[],isLoading:false,isSending:false,sendMessage:deny});`,
 '@/hooks/useChatModeration': `import{deny}from'intent-fixture';export const useChatModeration=()=>({analyzeBeforeSend:deny,logViolation:deny,warningLevel:0});`,
 '@/components/property': `export{IncludedServices}from'${root}/src/components/property/IncludedServices.tsx';export{ExtraServices}from'${root}/src/components/property/ExtraServices.tsx';export{UtilitiesInfo}from'${root}/src/components/property/UtilitiesInfo.tsx';export{CheckInDetails}from'${root}/src/components/property/CheckInDetails.tsx';export{GuestAssuranceCard}from'${root}/src/components/property/GuestAssuranceCard.tsx';export{HouseRules}from'${root}/src/components/property/HouseRules.tsx';export{PropertyBookingCard}from'${root}/src/components/property/PropertyBookingCard.tsx';export{MessageHostButton}from'${root}/src/components/property/MessageHostButton.tsx';export{GuestExtraFeesDisplay}from'${root}/src/components/property/GuestExtraFeesDisplay.tsx';`,
 '@/components/seo': `export const SEOHead=()=>null;export const createRealEstateListingSchema=()=>({});`,
 '@/components/property/PropertyPdfBrochure': noop('PropertyPdfButton'),
 '@/components/property/PropertyLocationMap': noop('PropertyLocationMap'),
 '@/components/property/SimilarProperties': noop('SimilarProperties'),
 '@/components/property/RoomCategoryOffers': noop('RoomCategoryOffers'),
 '@/components/reviews/ReviewsSection': noop('ReviewsSection'),
 '@/components/property/PropertyReviewRatings': noop('PropertyReviewRatings'),
 '@/components/property/PropertyShareSheet': noop('PropertyShareSheet'),
 '@/components/leads/ExitIntentModal': noop('ExitIntentModal'),
 '@/components/property/GuestPriceProposal': noop('GuestPriceProposal'),
 '@/components/concierge/ConciergeHelpSheet': noop('ConciergeHelpSheet'),
 '@/components/crosssell': `export const CrossSellSection=()=>null;export const RelatedServicesSection=()=>null;`,
});
const result = await build({
 stdin: { contents: `import React from'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{HelmetProvider}from'react-helmet-async';import{CompareProvider}from'${root}/src/components/property/PropertyCompare.tsx';import Search from'${root}/src/pages/property/PropertySearchPage.tsx';import Detail from'${root}/src/pages/property/PropertyDetail.tsx';import Owner from'${root}/src/pages/owner/OwnerManagementLanding.tsx';import Services from'${root}/src/pages/services/ServicesIndex.tsx';const p=new URLSearchParams(location.search),intent=p.get('intent')||'holiday';document.documentElement.lang=p.get('lang')||'en';window.fixtureForbidden=[];const params=new URLSearchParams(intent==='buy'?{mode:'buy'}:{mode:'rent',tenancy:intent==='monthly'?'medium':intent==='year'?'long':'short'});if(intent==='holiday'){params.set('checkIn','2027-11-10');params.set('checkOut','2027-11-15');params.set('guests','3')};const start=intent==='owner'?'/owner/management-landing':intent==='services'?'/services':'/property/search?'+params;function App(){const loc=useLocation();return <><div className="border-b p-3 text-xs" role="note">SYNTHETIC ROUTE QA: no live inventory, booking, authentication or request delivery</div><Routes><Route path="/property/search" element={<Search/>}/><Route path="/property/:id" element={<Detail/>}/><Route path="/owner/management-landing" element={<Owner/>}/><Route path="/services" element={<Services/>}/><Route path="/property/:id/inquiry" element={<h1 data-testid="inquiry-boundary">Synthetic checkout boundary: actual checkout is not exercised</h1>}/></Routes><output hidden data-testid="fixture-route">{loc.pathname+loc.search}</output></>};createRoot(document.getElementById('root')).render(<HelmetProvider><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={[start]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><CompareProvider><App/></CompareProvider></MemoryRouter></QueryClientProvider></HelmetProvider>);`, loader:'tsx', resolveDir:root },
 bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',metafile:true,
 define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}','import.meta.env.DEV':'false'},
 plugins:[{name:'homepage-route-boundaries',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!resolved)throw Error('Unresolved '+args.path);return{path:resolved};}});b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}],
});
const inputs=Object.keys(result.metafile.inputs).map(p=>p.replaceAll('\\','/'));
const required=['pages/property/PropertySearchPage.tsx','pages/property/PropertyDetail.tsx','pages/owner/OwnerManagementLanding.tsx','pages/services/ServicesIndex.tsx','property/PropertyListingCard.tsx','property/PropertyBookingCard.tsx','property/MessageHostButton.tsx','landings/LandingLeadForm.tsx'];
for(const name of required)if(!inputs.some(p=>!p.startsWith('fixture:')&&p.endsWith(name)))throw Error('Actual surface missing: '+name);
if(inputs.some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useProperties|useUniversalLead|useCapitalIntroRequest|usePropertyUnavailableDates|usePropertyRateSeasons|useGuestPropertyChat)\.ts$/.test(p)))throw Error('Production read/write module bundled');
await writeFile(path.join(output,'bundle-inputs.json'),JSON.stringify({required,inputs,adapters:Object.keys(virtual),limitations:['Synthetic reads; search availability disabled; detail dates synthetic, no server proof','Homepage entry is outside this direct-route fixture','App layout adapted from public-wide; not complete production App','Auth sheet is a captured adapter boundary','Owner submit acknowledges locally only','Closed review, map, PDF and peripheral surfaces excluded']},null,2));
if(process.argv.includes('--bundle-only'))process.exit(0);
const css=await Promise.all(['/src/index.css?direct','/src/styles/consumer-system.css?direct','/src/styles/cinematic-home.css?direct','/src/styles/property-search.css?direct','/src/styles/public-commerce.css?direct'].map(async file=>{const r=await fetch('http://localhost:8080'+file);if(!r.ok)throw Error('CSS unavailable '+file);return r.text();}));
await writeFile(path.join(output,'fixture.css'),css.join('\n'));
await writeFile(path.join(output,'synthetic-property.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#d9dfdc"/><text x="40" y="240" font-size="26">SYNTHETIC ROUTE QA</text></svg>');
const sourceHtml=await readFile(path.join(root,'index.html'),'utf8');
const publicFontLinks=process.env.HOME_INTENT_PUBLIC_FONTS==='1' ? [...sourceHtml.matchAll(/<link\b[^>]*>/g)].map(m=>m[0]).filter(tag=>/href="https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(tag)).join('\n') : '';
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css">'+publicFontLinks+'</head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(!process.argv.includes('--build-only')){const run=spawnSync('python3',[path.join(root,'scripts/qa/homepage-intent-routes.py'),output],{stdio:'inherit'});process.exitCode=run.status??1;}
