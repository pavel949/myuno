// Synthetic editor only: never boot the SPA or import its real data client.
// Run with the local CSS server: node scripts/qa/property-editor-ui.mjs
// --bundle-only checks the fixture compilation without launching a browser.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

const root = process.cwd();
const output = '/tmp/browser/property-editor-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage = () => ({language: new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'ru'});`,
  '@/contexts/AuthContext': `export const useAuth = () => ({user:{id:'synthetic-admin'},isLoading:false});`,
  '@/hooks/useAdmin': `export const useAdminCheck = () => ({isAdmin:true,isLoading:false});`,
  '@/hooks/useManagementCompanies': `const companies=[]; export const useManagementCompanies=()=>({data:companies});`,
  '@/hooks/useCityCurrency': `export const useCityCurrency = () => ({code:'THB'});`,
  '@/hooks/useAdminContent': `
    const images=Array.from({length:15},(_,i)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="hsl('+i*22+',35%,75%)"/><text x="260" y="220" font-size="72">'+(i+1)+'</text></svg>'));
    const properties=[{id:'synthetic-property',title_en:'Synthetic property',title_ru:'Искусственный объект',provider_id:'synthetic-provider',approval_status:'pending',images}];
    const write=()=>{window.fixtureWrites++;throw new Error('Unexpected mutation in read-only editor fixture');};
    export const useAdminProperties=()=>({properties,isLoading:false,createProperty:write,updateProperty:write,deleteProperty:write});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic = () => {};`,
  '@/hooks/useSoundEffects': `export const playSound = () => {}; export const isTypingKey = () => false;`,
  '@/integrations/supabase/client': `const deny=()=>{window.fixtureDataCalls++;throw new Error('Unexpected data call');}; export const supabase={from:deny,functions:{invoke:deny},storage:{from:deny}};`,
  'sonner': `export const toast={error:()=>{},success:()=>{},info:()=>{}};`,
  '@/components/uno/PageContainer': `import React from 'react'; export const PageContainer=({children})=><main>{children}</main>;`,
  '@/components/uno/PageHeader': `export const PageHeader=()=>null;`,
  '@/components/admin/ProviderSelector': `import React from 'react'; export const ProviderSelector=()=> <label className="block text-sm">Fixture provider<input className="block mt-2 w-full border p-2" value="Synthetic provider" readOnly /></label>;`,
  '@/components/admin/RealEstateDomainHealthPanel': `export const RealEstateDomainHealthPanel=()=>null;`,
  '@/components/admin/PropertyProjectBulkLinkPanel': `export const PropertyProjectBulkLinkPanel=()=>null;`,
  '@/components/admin/PropertyStayRulesPanel': `export const PropertyStayRulesPanel=()=>null;`,
  '@/components/property/PropertyCard': `import React from 'react'; export const PropertyCard=({onEdit})=><button onClick={onEdit}>Edit fixture property</button>;`,
  '@/components/upload/ImageQualityTips': `export const ImageQualityTips=()=>null;`,
  '@/components/owner/property-wizard/steps': `import React from 'react';
    export {PhotosStep} from '${root}/src/components/owner/property-wizard/steps/PhotosStep.tsx';
    export const BasicInfoStep=({formData,updateFormData})=><label className="block p-4">Fixture title<input className="block border p-3" value={formData.title} onChange={e=>updateFormData({title:e.target.value})}/></label>;
    export const LocationStep=()=>null; export const PricingStep=()=>null; export const UtilitiesStep=()=>null; export const ServicesStep=()=>null; export const AdminSettingsStep=()=>null; export const HouseRulesSection=()=>null; export const CancellationPolicySection=()=>null;`,
};
await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter,useLocation} from 'react-router-dom'; import Page from '${root}/src/pages/admin/AdminProperties.tsx';
    window.fixtureWrites=0;window.fixtureDataCalls=0;
    // Read the committed router tree, not a global mutated during a transition render.
    function Probe(){const location=useLocation();return <output data-testid="fixture-route" className="sr-only">{location.pathname}{location.search}</output>;}
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/admin/properties?provider=synthetic-provider&status=pending&edit=synthetic-property']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><Page/><Probe/></MemoryRouter>);`, loader:'tsx', resolveDir:root },
  bundle:true, outfile:path.join(output,'fixture.js'), jsx:'automatic', format:'esm',
  define:{'process.env.NODE_ENV':'"production"', 'import.meta.env.DEV':'false', 'import.meta.env.VITE_SUPABASE_URL':'"http://127.0.0.1:54321"'},
  plugins:[{name:'isolate-all-data-boundaries',setup(b) {
    b.onResolve({filter:/.*/},args => {
      if (Object.hasOwn(virtual,args.path)) return {path:args.path,namespace:'fixture'};
      if (args.path.startsWith('@/')) {
        const base = path.join(root,'src',args.path.slice(2));
        const resolved = [base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p) && statSync(p).isFile());
        if (!resolved) throw new Error('Unresolved test import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args => ({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if (!process.argv.includes('--bundle-only')) {
  const css = await fetch('http://localhost:8080/src/index.css?direct');
  if (!css.ok) throw new Error('Preview stylesheet unavailable');
  await writeFile(path.join(output,'fixture.css'),await css.text());
  await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
  const result = spawnSync('python3',[path.join(root,'scripts/qa/property-editor-ui.py'),output],{stdio:'inherit'});
  process.exitCode = result.status ?? 1;
}
