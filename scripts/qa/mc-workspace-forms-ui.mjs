// Bundle-only synthetic fixture for the localized MC forms. Never launches a browser
// or imports a production Supabase client. Serve/style separately for visual QA.
import { build } from 'esbuild';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const output = '/tmp/browser/mc-workspace-forms';
await mkdir(output, { recursive: true });
const noWrite = `const mutation=()=>({mutate:()=>{throw Error('Fixture writes forbidden')},mutateAsync:async()=>{throw Error('Fixture writes forbidden')},isPending:false});`;
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'th',t:key=>key});`,
  '@/contexts/AuthContext': `export const useAuth=()=>({user:{id:'synthetic-user',email:'synthetic@example.test'}});`,
  '@/hooks/useActiveCompany': `export const useActiveCompany=()=>({activeCompany:{company_id:'synthetic-company'}});`,
  '@/hooks/useProfile': `export const useProfile=()=>({profile:{full_name:'สมชาย Operator'}});`,
  '@/hooks/useCrmMeetings': `${noWrite}export const useCrmMeetings=()=>({data:[{id:'synthetic-meeting',title:'Synthetic original meeting '.repeat(8),scheduled_at:'2026-10-19T09:30:00',duration_minutes:45,status:'scheduled',location:'Synthetic location'}]});export const useCreateMeeting=mutation;export const useDeleteMeeting=mutation;`,
  '@/hooks/usePropertyFinancials': `export const EXPENSE_CATEGORIES=[{value:'cleaning',labelEn:'Cleaning',labelRu:'Уборка'},{value:'supplies',labelEn:'Supplies & Amenities',labelRu:'Расходники и аменити'}];export const INCOME_CATEGORIES=[{value:'rent',labelEn:'Rental Income',labelRu:'Доход от аренды'}];`,
  '@/hooks/useCompanyCategorySettings': `${noWrite}export const useCompanyCategorySettings=()=>({enabledCodes:null,hasSettings:true,settings:[]});export const useToggleCategorySetting=mutation;export const useInitCategorySettings=mutation;export const useUpdateCategoryOverrides=mutation;export const useBulkToggleCategorySettings=mutation;`,
  '@/hooks/useFinancialCategories': `${noWrite}export const useFinancialCategories=()=>({categories:[]});export const useCreateFinancialCategory=mutation;`,
  '@/hooks/useAgentDeals': `export const DEAL_TYPES=['sale','rent_short','rent_long','investment','management','club_deal','resale','offplan'];export const DEAL_TYPE_LABELS={sale:{en:'Sale',ru:'Продажа'},rent_short:{en:'Short-Term Rent',ru:'Краткосрочная аренда'},rent_long:{en:'Long-Term Rent',ru:'Долгосрочная аренда'},investment:{en:'Investment',ru:'Инвестиция'},management:{en:'Management',ru:'Управление'},club_deal:{en:'Club Deal',ru:'Клубная сделка'},resale:{en:'Resale',ru:'Вторичка'},offplan:{en:'Off-Plan',ru:'Off-Plan'}};export const useMyCompanyId=()=>({data:{company_id:'synthetic-company',role:'director'}});`,
  '@/hooks/useDealPipelineStages': `${noWrite}export const useAllPipelineStages=()=>({data:[]});export const useCreatePipelineStage=mutation;export const useUpdatePipelineStage=mutation;export const useDeletePipelineStage=mutation;export const getDefaultStagesForDealType=()=>[];`,
  '@/hooks/useCrmSettings': `${noWrite}export const useCrmOptions=()=>({data:[]});export const useCreateCrmOption=mutation;export const useUpdateCrmOption=mutation;export const useDeleteCrmOption=mutation;`,
  '@/hooks/useContactTags': `export const TAG_COLOR_PALETTE=['#123456'];`,
  '@/components/owner/crm/OdooCrmSettingsImportModal': `export const OdooCrmSettingsImportModal=()=>null;`,
  '@/components/upload/UnifiedMediaUploader': `export const UnifiedMediaUploader=({placeholder})=><button type="button">{placeholder}</button>;`,
  '@/integrations/supabase/client': `export const supabase={from:()=>({select:()=>({eq:()=>({single:async()=>({data:{name_en:'Synthetic Company',name_ru:'Синтетическая компания',documents:[],brand_color:'blue',backup_settings:{auto_enabled:true,frequency:'monthly'}}})})})})};`,
  '@/hooks/useFeedbackSettings': `export const getFeedbackSettings=()=>({});`,
  '@/hooks/useHapticFeedback': `export const triggerHaptic=()=>{};`,
  '@/hooks/useSoundEffects': `export const playSound=()=>{};export const isTypingKey=()=>false;`,
};
const result = await build({
  stdin: { contents: `
import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import MCSettingsPage from '${root}/src/pages/mc/MCSettingsPage.tsx';import CrmMeetingsPage from '${root}/src/pages/owner/CrmMeetingsPage.tsx';import OwnerAccountSettings from '${root}/src/pages/owner/OwnerAccountSettings.tsx';
import {DashboardGreeting} from '${root}/src/components/owner/dashboard/DashboardGreeting.tsx';import {DashboardDestinations} from '${root}/src/components/owner/dashboard/DashboardDestinations.tsx';import {BusinessRoleSwitcher} from '${root}/src/components/owner/dashboard/BusinessRoleSwitcher.tsx';import {BUSINESS_ROLES} from '${root}/src/lib/businessRoles.ts';
const params=new URLSearchParams(location.search);const view=params.get('view')||'settings';
const pages={settings:<MCSettingsPage/>,meetings:<CrmMeetingsPage/>,account:<OwnerAccountSettings/>,dashboard:<div className="p-4 space-y-5"><DashboardGreeting roleConfig={BUSINESS_ROLES.general} mcRole="director"/><DashboardDestinations businessRole="general" propertyCount={3}/><BusinessRoleSwitcher activeRole="general" onRoleChange={()=>{}}/></div>};
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/mc?'+params.toString()]}>{pages[view]}</MemoryRouter></QueryClientProvider>);`, loader: 'tsx', resolveDir: root },
  bundle: true, outfile: path.join(output, 'fixture.js'), jsx: 'automatic', format: 'esm', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' },
  plugins: [{ name: 'synthetic-mc-forms', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => {
      if (Object.hasOwn(virtual, args.path)) return { path: args.path, namespace: 'fixture' };
      if (args.path.startsWith('@/')) {
        const base = path.join(root, 'src', args.path.slice(2));
        const file = [base, base+'.ts', base+'.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find(p => existsSync(p) && statSync(p).isFile());
        if (!file) throw Error('Unresolved import: ' + args.path);
        return { path: file };
      }
    });
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: virtual[args.path], loader: 'tsx', resolveDir: root }));
  } }],
});
if (Object.keys(result.metafile.inputs).some(p => !p.startsWith('fixture:') && /integrations\/supabase\/client/.test(p))) throw Error('Production client included');
if(process.argv.includes('--bundle-only'))process.exit(0);
const cssResponse=await fetch('http://localhost:8080/src/index.css?direct');
if(!cssResponse.ok)throw Error('Isolated CSS unavailable');
const componentCss=existsSync(path.join(output,'fixture.css'))?await readFile(path.join(output,'fixture.css'),'utf8'):'';
await writeFile(path.join(output,'fixture.css'),(await cssResponse.text())+'\n'+componentCss);
await writeFile(path.join(output, 'fixture.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="fixture.css"></head><body><div id="root"></div><script type="module" src="fixture.js"></script></body></html>');
if(process.argv.includes('--build-only'))process.exit(0);
const run=spawnSync('python3',[path.join(root,'scripts/qa/mc-workspace-forms-ui.py'),output],{stdio:'inherit'});
process.exitCode=run.status??1;
