// Actual password-setup component with synthetic auth. Never touches a real account.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const output = '/tmp/browser/employee-invite-isolated';
await mkdir(output, { recursive: true });
const virtual = {
  '@/contexts/LanguageContext': `export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'en'});`,
  '@/contexts/AuthContext': `const state=new URLSearchParams(location.search).get('state'); const user=state==='expired'?null:{id:'synthetic-invited-employee',user_metadata:{full_name:'Test Employee'}}; export const useAuth=()=>({user,isLoading:state==='loading'});`,
  '@/integrations/supabase/client': `const deny=()=>{throw new Error('Unexpected real data boundary');}; export const supabase={from:deny,functions:{invoke:deny},auth:{updateUser:async()=>{window.fixtureWrites++;return {error:new URLSearchParams(location.search).get('state')==='error'?new Error('Synthetic save failure'):null};}}};`,
  '@/components/layout/AppLayout': `import React from 'react';export const AppLayout=({children})=><main>{children}</main>;`,
  '@/components/uno/BrandWordmark': `import React from 'react';export const BrandWordmark=()=> <div aria-label="myUNO" className="text-2xl font-semibold">myUNO</div>;`,
  '@/hooks/useCompanyTeam': `
    export const TEAM_ACCESS_ENABLED=true;
    const lifetime={capture:()=>()=>true}; export const useCompanyAccessContext=()=>lifetime;
    const data={spacesEnforced:true,members:[{id:'synthetic-member',user_id:'synthetic-user',full_name:'Content employee',email:'employee@example.invalid',role:'staff',is_active:true}],permissions:[],assignments:[],spaces:[{id:'synthetic-space',name_en:'Assigned portfolio',name_ru:'Назначенный портфель',is_active:true}]};
    export const useCompanyTeam=()=>({data,isLoading:false,isFetching:false,isError:false,refetch:async()=>{}});
    export const useInviteCompanyMember=()=>({isPending:false,mutateAsync:async()=>{window.fixtureWrites++;return {success:true,code:'invited',invite_email_sent:true,membership_status:'created',access_setup_required:true};}});
    export const useChangeCompanyMemberAccess=()=>({isPending:false,mutateAsync:async()=>{throw new Error('No access changes permitted in visual fixture');}});`,
  'sonner': `export const toast={error:()=>{window.fixtureErrors++;},success:()=>{window.fixtureSuccess++;}};`,
};
await build({
  stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter,useLocation} from 'react-router-dom';import SetupPassword from '${root}/src/pages/auth/SetupPassword.tsx';import {CompanyAccessPanel} from '${root}/src/components/owner/team/CompanyAccessPanel.tsx';
    window.fixtureWrites=0;window.fixtureErrors=0;window.fixtureSuccess=0;
    function Screen(){const route=useLocation();return <><output data-testid="fixture-route" className="sr-only">{route.pathname}{route.search}</output>{route.pathname==='/auth/setup-password'?<SetupPassword/>:<p data-testid="destination">Continuation reached</p>}</>;}
    createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/auth/setup-password?redirect=%2Fmc%2Fproperties']} future={{v7_startTransition:true,v7_relativeSplatPath:true}}>{new URLSearchParams(location.search).get('screen')==='access'?<main className="max-w-4xl mx-auto p-4"><CompanyAccessPanel/></main>:<Screen/>}</MemoryRouter>);`,loader:'tsx',resolveDir:root},
  bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',
  define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},
  plugins:[{name:'synthetic-invite-boundaries',setup(b){
    b.onResolve({filter:/.*/},args=>{
      if(Object.hasOwn(virtual,args.path))return {path:args.path,namespace:'fixture'};
      if(args.path.startsWith('@/')){
        const base=path.join(root,'src',args.path.slice(2));
        const resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());
        if(!resolved)throw new Error('Unresolved fixture import: '+args.path);
        return {path:resolved};
      }
    });
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
  }}],
});
if(!process.argv.includes('--bundle-only')){
  const css=await fetch('http://localhost:8080/src/index.css?direct');
  if(!css.ok)throw new Error('Isolated stylesheet unavailable');
  await writeFile(path.join(output,'fixture.css'),await css.text());
  await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
  const result=spawnSync('python3',[path.join(root,'scripts/qa/employee-invite-ui.py'),output],{stdio:'inherit'});
  process.exitCode=result.status??1;
}
