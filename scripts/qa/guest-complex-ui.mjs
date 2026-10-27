// Actual guest complex page and listing cards with synthetic hooks. No production requests.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const output = '/tmp/browser/guest-complex-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
  '@/contexts/CurrencyContext': `export const useCurrency=()=>({formatPrice:v=>'฿'+Number(v).toLocaleString('en-US')});`,
  '@/hooks/useUserCollections': `export const useUserCollections=()=>({isInCollection:()=>false,toggleCollection:()=>{}});`,
  '@/hooks/usePropertyProjects': `export const usePropertyProject=()=>({data:{id:'complex',name_en:'Oceanstone Residences',name_ru:'Резиденции Оушенстоун',description_en:'A quiet retreat between tropical gardens and the coast. Shared spaces bring together open-air living and everyday comfort.',description_ru:'Тихое пространство между тропическим садом и побережьем. Общие зоны объединяют жизнь под открытым небом и повседневный комфорт.',district:'Bang Tao',address:'Bang Tao, Phuket',amenities:['pool','gym','garden','security'],cover_image:new URLSearchParams(location.search).has('empty')?null:'http://localhost:8080/photo.svg',images:new URLSearchParams(location.search).has('empty')?[]:['http://localhost:8080/photo.svg','http://localhost:8080/photo2.svg','http://localhost:8080/photo3.svg'],video_url:new URLSearchParams(location.search).has('empty')?null:'http://localhost:8080/tour.mp4'},isLoading:false,isError:false});`,
  '@/hooks/useProperties': `const row={id:'dual-unit',title_en:'Garden apartment',title_ru:'Апартаменты с видом на сад',property_type:'condo',listing_type:'rent',listing_modes:['rent','sale'],is_for_sale:true,sale_price:5200000,sale_currency:'THB',price:2600,price_per_night:2600,price_period:'night',currency:'THB',bedrooms:1,bathrooms:1,area_sqm:55,max_guests:2,amenities:[],images:['http://localhost:8080/photo2.svg'],cover_image:'http://localhost:8080/photo2.svg',district:'bang_tao',management_company_id:'operator',created_at:'2026-01-01',updated_at:'2026-01-01'}; export const usePropertiesByProject=()=>({data:{properties:new URLSearchParams(location.search).has('empty')?[]:[row],total:new URLSearchParams(location.search).has('empty')?0:1},isSuccess:true,isLoading:false,isError:false});`,
  '@/hooks/useManagementCompanies': `export const useManagementCompanies=()=>({data:[{id:'operator',name_en:'Verified fixture operator',name_ru:'Управляющая компания',slug:'fixture-operator'}]});`,
  '@/components/seo': `export const SEOHead=()=>null;`,
  '@/integrations/supabase/client': `export const supabase=new Proxy({},{get(){throw Error('Production database forbidden')}});`,
};
const result = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation,Routes,Route} from 'react-router-dom';import GuestComplexDetail from '${root}/src/pages/property/GuestComplexDetail.tsx';function Location(){const loc=useLocation();return <output hidden data-testid="location">{loc.pathname+loc.search}</output>;}createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/property/complex/complex?managementCompanyId=operator']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Location/><Routes><Route path="/property/complex/:id" element={<GuestComplexDetail/>}/><Route path="/property/:id" element={<div data-testid="unit-destination">Canonical unit destination</div>}/></Routes></MemoryRouter>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output,'fixture.js'), jsx:'automatic', format:'esm', metafile:true,
  define: { 'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false' },
  plugins:[{name:'isolated-browse-data',setup(b){
    b.onResolve({filter:/.*/}, args=>{
      if(Object.hasOwn(virtual,args.path)) return {path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')) {
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved) throw Error('Unresolved '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(Object.keys(result.metafile.inputs).some(p=>!p.startsWith('fixture:')&&/integrations\/supabase\/client|hooks\/(useProperties|usePropertyProjects|useManagementCompanies|useUserCollections)\.ts$/.test(p))) throw Error('Production data module included');
const css = await Promise.all(['/src/index.css?direct','/src/styles/premium-public.css?direct'].map(async file => {
  const response=await fetch((process.env.FIXTURE_CSS_ORIGIN || 'http://localhost:8080')+file);
  if(!response.ok) throw Error('Preview CSS unavailable: '+file);
  return response.text();
}));
await writeFile(path.join(output,'fixture.css'),css.join('\n'));
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
if(process.argv.includes('--build-only')) process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/guest-complex-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;

