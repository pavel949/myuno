import { existsSync } from 'node:fs';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root=process.cwd(), output=path.resolve(process.env.DS_CONTROLS_OUTPUT||'/tmp/browser/ds-controls');
await mkdir(output,{recursive:true});
const mocks={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:'en'});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:'synthetic'}});`,
 '@/hooks/useOwnerVendors':`export const VENDOR_CATEGORIES=[{value:'other',en:'Other',ru:'Другое'}];`,
 '@/components/upload/UnifiedMediaUploader':`import React from 'react';export const UnifiedMediaUploader=()=> <div>Photo fixture</div>;`,
 '@/components/insurance/InsurancePolicyUpload':`export const InsurancePolicyUpload=()=>null;`,
 '@/components/uno/BackButton':`export const BackButton=()=>null;`,
 '@/hooks/useMyProperties':`export const useMyProperties=()=>({activeProperties:[{property_id:'one',title:'Villa One'},{property_id:'two',title:'Villa Two'}],allProperties:[],isLoading:false});`,
 '@/hooks/usePropertyDelegates':`export const useMyDelegations=()=>({data:[{id:'delegation',status:'active',property:{id:'property-one',title:'Delegated Villa',address:'Synthetic address'}}]});`,
 '@/contexts/DashboardFilterContext':`import{useState}from'react';export const useDashboardFilter=()=>{const[selectedPropertyId,setSelectedPropertyId]=useState(null);return{selectedPropertyId,setSelectedPropertyId}};`,
};
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import{AddVendorDialog}from'${root}/src/components/owner/vendors/AddVendorDialog';import{DashboardPropertyFilter}from'${root}/src/components/owner/dashboard/DashboardPropertyFilter';import{Select,SelectTrigger,SelectValue}from'${root}/src/components/ui/select';import PropertyMySection from'${root}/src/pages/property/PropertyMySection';import TravelInsurance from'${root}/src/pages/insurance/TravelInsurance';window.fixtureCalls=[];window.open=(...args)=>window.fixtureCalls.push(args);const vendor=new URLSearchParams(location.search).has('vendor');createRoot(document.getElementById('root')).render(<MemoryRouter>{vendor?<AddVendorDialog open onOpenChange={()=>{}} onSave={()=>{}} isSaving={false}/>:<main className="p-4 space-y-6"><DashboardPropertyFilter/><Select><SelectTrigger aria-label="Invalid choice" aria-invalid="true"><SelectValue placeholder="Choose an option"/></SelectTrigger></Select><PropertyMySection/><TravelInsurance/></main>}</MemoryRouter>);`;
await build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,format:'esm',outfile:path.join(output,'fixture.js'),jsx:'automatic',plugins:[{name:'synthetic-data',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:a.path.startsWith('@/')?{path:['.tsx','.ts','/index.tsx','/index.ts'].map(ext=>path.join(root,'src',a.path.slice(2))+ext).find(existsSync)}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));}}]});
// Real application tokens and Tailwind output, with production source classes.
const css=spawnSync(process.execPath,['node_modules/tailwindcss/lib/cli.js','-i','src/index.css','-o',path.join(output,'fixture.css')],{cwd:root,encoding:'utf8'});if(css.status)throw Error(css.stderr);
await writeFile(path.join(output,'index.html'),`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script type="module" src="fixture.js"></script></body></html>`);
console.log(output);
