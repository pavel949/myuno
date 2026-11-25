// Test-only fixture: real authoring entry routes and editable form/preview DOM.
// Production data client, mutations, media and out-of-scope readers are replaced.
import { build } from 'esbuild';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { radixOverlayAliases } from '../radix-overlay-resolution.mjs';

const root = process.cwd();
const output = process.env.ADMIN_AUTHORING_OUTPUT || '/tmp/browser/admin-authoring-preview-isolated';
await mkdir(output, { recursive: true });
const actual = Object.fromEntries(['Properties', 'Projects', 'Developers', 'Providers', 'CatalogWorkspace']
  .map(name => ['Admin' + name, root + '/src/pages/admin/Admin' + name + '.tsx']));
const routeFile = root + '/src/components/layout/routes/adminRoutes.tsx';
const routeSource = await readFile(routeFile, 'utf8');
const routePageNames = new Set([...routeSource.matchAll(/Pages\.([A-Za-z0-9_]+)/g)].map(match => match[1]));
const noWrite = '(...args)=>window.fixtureDenied(...args)';
const virtual = {
  '../pageRegistry': [...routePageNames].map(name => actual[name]
    ? `export {default as ${name}} from ${JSON.stringify(actual[name])};`
    : `export const ${name}=()=>{throw Error('Unexpected route outside authoring fixture');};`).join('\n'),
  '@/contexts/LanguageContext': `import {en} from '${root}/src/i18n/en.ts'; export const useLanguage=()=>({language:'en',t:key=>en[key]||key});`,
  '@/contexts/AuthContext': `const actor={id:'synthetic-admin'};export const useAuth=()=>({user:actor,isLoading:false});`,
  '@/hooks/useAdmin': `
    const deny=${noWrite};const providers=[{id:'synthetic-provider',name:'Synthetic provider',is_active:true,is_verified:true,business_category:'cleaning'}];
    const contacts={createProvider:deny,updateProvider:deny,deleteProvider:deny};
    export const useAdminCheck=()=>({isAdmin:true,isLoading:false});
    export const useAdminProviders=()=>({providers,totalCount:1,isLoading:false,refetch:async()=>{},...contacts});
    export const useAdminServices=()=>({services:[],isLoading:false,refetch:async()=>{},createService:deny,updateService:deny,deleteService:deny});
    export const useAdminCategories=()=>({categories:[{id:'synthetic-category',name_en:'Synthetic category',name_ru:'Тестовая категория'}]});
    export const useAdminUsers=()=>({users:[],isLoading:false});`,
  '@/hooks/useAdminContent': `
    const deny=${noWrite};const properties=[];
    export const useAdminProperties=()=>({properties,isLoading:false,refetch:async()=>{},createProperty:deny,updateProperty:deny,deleteProperty:deny});`,
  '@/hooks/usePropertyProjects': `
    const deny=${noWrite};const rows=[];
    export const useAdminPropertyProjects=()=>({data:rows,isLoading:false,refetch:async()=>{}});
    export const useCreatePropertyProject=()=>({mutateAsync:deny});
    export const useUpdatePropertyProject=()=>({mutateAsync:deny});
    export const invalidateProjectCatalog=deny;`,
  '@/hooks/useAdminDevelopers': `
    const deny=${noWrite};const rows=[{id:'synthetic-developer',name_en:'Synthetic developer',name_ru:'Тестовый застройщик',is_verified:true}];
    export const useAdminDevelopers=()=>({data:rows,isLoading:false,refetch:async()=>{}});
    export const useCreateDeveloper=()=>({mutateAsync:deny});
    export const useUpdateDeveloper=()=>({mutateAsync:deny});
    export const useDeleteDeveloper=()=>({mutateAsync:deny});`,
  '@/hooks/useManagementCompanies': 'export const useManagementCompanies=()=>({data:[],isLoading:false});',
  '@/hooks/useCityCurrency': "export const useCityCurrency=()=>({code:'THB',symbol:'฿'});",
  '@/hooks/useAdminContentCreation': 'export const useOnBehalfContext=()=>({isOnBehalf:false});',
  '@/hooks/useAutoTranslate': `export const useAutoTranslate=()=>({translate:${noWrite},isTranslating:false});`,
  '@/integrations/supabase/client': `
    const deny=${noWrite};
    const lookup=()=>{const read={select:()=>read,order:()=>read,eq:()=>read,then:resolve=>resolve({data:[],error:null}),
      insert:deny,update:deny,delete:deny,upsert:deny};return read};
    export const supabase={from:name=>name==='lookup_values'?lookup():deny(name),rpc:deny,functions:{invoke:deny},storage:{from:deny}};`,
  '@/lib/propertyRevisions': `export const listPendingPropertyRevisions=async()=>[];export const readPropertyRevision=${noWrite};export const reviewPropertyRevision=${noWrite};`,
  '@/components/admin/ProviderSelector': `export const ProviderSelector=({label})=><p>{label}: Synthetic provider</p>;`,
  '@/components/admin/RealEstateDomainHealthPanel': 'export const RealEstateDomainHealthPanel=()=>null;',
  '@/components/admin/PropertyProjectBulkLinkPanel': 'export const PropertyProjectBulkLinkPanel=()=>null;',
  '@/components/admin/PropertyStayRulesPanel': 'export const PropertyStayRulesPanel=()=>null;',
  '@/components/admin/BusinessCardScanButton': 'export const BusinessCardScanButton=()=>null;',
  '@/components/admin/intake/AIIntakeDialog': 'export const AIIntakeDialog=()=>null;',
  '@/components/admin/projects/ProjectUnitsTab': 'export const ProjectUnitsTab=()=>null;',
  '@/components/admin/developers/BulkLogoUploadModal': 'export const BulkLogoUploadModal=()=>null;',
  '@/components/upload/AirbnbStyleImageUpload': 'export const AirbnbStyleImageUpload=()=>null;',
  '@/components/upload/ImageUpload': 'export const MultiImageUpload=()=>null;',
  '@/components/upload/UnifiedMediaUploader': 'export const UnifiedMediaUploader=()=>null;',
  '@/components/property/PropertyVideoUploader': 'export const PropertyVideoUploader=()=>null;',
  '@/components/property/LocationProjectSearch': 'export const LocationProjectSearch=()=>null;',
  '@/components/owner/property-wizard/steps': `
    export {BasicInfoStep} from '${root}/src/components/owner/property-wizard/steps/BasicInfoStep.tsx';
    export const PhotosStep=()=>null;export const LocationStep=()=>null;export const PricingStep=()=>null;export const UtilitiesStep=()=>null;
    export const ServicesStep=()=>null;export const AdminSettingsStep=()=>null;export const HouseRulesSection=()=>null;export const CancellationPolicySection=()=>null;`,
  '@/hooks/useHapticFeedback': 'export const triggerHaptic=()=>{};',
  '@/hooks/useSoundEffects': 'export const playSound=()=>{};export const isTypingKey=()=>false;',
  '@/hooks/useFeedbackSettings': 'export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false});',
  ...Object.fromEntries(['./AdminUnifiedCatalog', './AdminMasterCatalog', './AdminTaxonomyManager', './AdminLookups']
    .map(name => [name, 'export default function UnusedTab(){throw Error("Unexpected catalog tab outside fixture");}'])),
};

const built = await build({
  stdin: { contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {MemoryRouter,Routes,useLocation} from 'react-router-dom';
    import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
    import {adminRoutes} from '${routeFile}';
    window.fixtureDeniedCalls=[];
    window.fixtureDenied=(...args)=>{window.fixtureDeniedCalls.push(String(args[0]||'unknown'));throw Error('External data access or business mutation denied');};
    function Location(){const l=useLocation();return <output hidden data-testid="actual-admin-route">{l.pathname+l.search}</output>}
    const route=new URLSearchParams(location.search).get('entry')||'/admin/properties';
    const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
    createRoot(document.getElementById('root')).render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><aside className="border-b border-border p-2 text-sm">Synthetic fixture • no live access</aside><Routes>{adminRoutes}</Routes><Location/></MemoryRouter></QueryClientProvider>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), format: 'esm', jsx: 'automatic', metafile: true,
  alias: radixOverlayAliases, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'authoring-fixture-data-boundaries', setup(b) {
    b.onResolve({ filter: /.*/ }, a => {
      if (Object.hasOwn(virtual, a.path)) return { path: a.path, namespace: 'fixture' };
      if (!a.path.startsWith('@/')) return;
      const base = path.join(root, 'src', a.path.slice(2));
      const resolved = [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
        .find(p => existsSync(p) && statSync(p).isFile());
      if (!resolved) throw Error('Unresolved fixture import: ' + a.path);
      return { path: resolved };
    });
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, a => ({ contents: virtual[a.path], loader: 'tsx', resolveDir: root }));
  } }],
});
const actualInputs = Object.keys(built.metafile.inputs).filter(name => !name.startsWith('fixture:'));
if (actualInputs.some(name => /integrations\/supabase\/client|hooks\/(useAdmin|useAdminContent|usePropertyProjects|useAdminDevelopers)\.ts$/.test(name))) {
  throw Error('Actual production data client or unisolated writer in test bundle');
}
for (const name of ['adminRoutes.tsx', 'AdminProperties.tsx', 'AdminProjects.tsx', 'AdminDevelopers.tsx', 'AdminProviders.tsx', 'AdminServices.tsx', 'AdminCatalogWorkspace.tsx', 'CanonicalPropertyForm.tsx', 'BasicInfoStep.tsx', 'AdminDraftPreview.tsx']) {
  if (!actualInputs.some(file => file.endsWith('/' + name))) throw Error('Actual authoring surface absent: ' + name);
}
if (!process.argv.includes('--bundle-only')) {
  // Use the repository's Vite development CSS endpoint, or already compiled QA CSS.
  const css = process.env.ADMIN_AUTHORING_CSS_FILE
    ? await readFile(process.env.ADMIN_AUTHORING_CSS_FILE, 'utf8')
    : await fetch('http://localhost:8080/src/index.css?direct').then(r => {
      if (!r.ok) throw Error('Preview stylesheet unavailable: ' + r.status);
      return r.text();
    });
  await writeFile(path.join(output, 'fixture.css'), css);
  await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
  if (!process.argv.includes('--build-only')) {
    const test = spawnSync('python3', [path.join(root, 'scripts/qa/admin-authoring-preview-ui.py'), output], { stdio: 'inherit' });
    process.exitCode = test.status ?? 1;
  }
}
