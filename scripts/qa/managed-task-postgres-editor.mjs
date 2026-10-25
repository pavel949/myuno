// Actual editor + command gateway; loopback owned PostgreSQL, synthetic Auth.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
const [base,output,encodedTasks]=process.argv.slice(2),tasks=JSON.parse(encodedTasks);
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)||!Array.isArray(tasks)||tasks.length!==3)throw Error('Owned loopback and three synthetic tasks required');
mkdirSync(output,{recursive:true});const root=process.cwd();
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:'en'});`,
 '@/contexts/AuthContext':`export const useAuth=()=>({user:{id:window.fixtureTask.assigned_to}});`,
 '@/hooks/useTaskNotifications':`export const useTaskNotifications=()=>({notifyAssignment(){throw Error('Notification forbidden')},notifyStatusRequest(){throw Error('Notification forbidden')}});`,
 '@/components/owner/tasks/TaskComments':`export const TaskComments=()=>null;`,
};
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';
import{TaskDetailSheet}from'@/components/owner/tasks/TaskDetailSheet';import{editManagedOperationalTask}from'@/lib/managedTaskCommands';
const raw=await(await fetch('/task?id='+new URLSearchParams(location.search).get('task'))).json();window.fixtureTask=raw;window.fixtureRequests=[];
const operation={actorId:raw.assigned_to,assertCurrent(){},client:{async rpc(name,args){window.fixtureRequests.push({name,args});return(await fetch('/task-rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,args})})).json()}}};
function Fixture(){const[open,setOpen]=React.useState(true),[saved,setSaved]=React.useState(raw);return <main><output data-testid="saved-task">{JSON.stringify(saved)}</output><TaskDetailSheet task={{...raw,source:'ops',due_date:raw.scheduled_date,description:raw.notes,raw}} open={open} onOpenChange={setOpen} members={[]} properties={[]} onDelete={()=>{throw Error('Delete forbidden')}} onUpdate={async(_id,_source,patch)=>setSaved(await editManagedOperationalTask(operation,raw,patch))}/></main>}
createRoot(document.getElementById('root')).render(<Fixture/>);`,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'fixture.js'),format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'synthetic-auth-only',setup(b){
 b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return{path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2)),found=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts'),path.join(base,'index.tsx')].find(p=>existsSync(p)&&statSync(p).isFile());if(!found)throw Error('Unresolved '+args.path);return{path:found};}});
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));
}}]});
writeFileSync(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),results=[];
try{for(const[index,timezoneId]of ['UTC','Asia/Bangkok','Europe/London'].entries()){
 const context=await browser.newContext({timezoneId,viewport:{width:390,height:844},serviceWorkers:'block'}),blocked=[],errors=[];
 await context.route('**/*',async route=>{if(new URL(route.request().url()).origin===base)await route.continue();else{blocked.push(route.request().url());await route.abort();}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'/?task='+tasks[index]);
 await page.getByRole('button',{name:'Completed',exact:true}).click();await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.getByTestId('saved-task').filter({hasText:'"status":"completed"'}).waitFor();
 const evidence=await page.evaluate(()=>({requests:window.fixtureRequests,task:JSON.parse(document.querySelector('[data-testid="saved-task"]').textContent)}));
 if(evidence.requests.length!==1||JSON.stringify(evidence.requests[0].args.p_patch)!=='{"status":"completed"}'||evidence.task.scheduled_time!==null||evidence.task.completed_by!==evidence.task.assigned_to||!evidence.task.completed_at||blocked.length||errors.length)throw Error(JSON.stringify({timezoneId,evidence,blocked,errors}));
 results.push({timezoneId,task:evidence.task.id,patch:evidence.requests[0].args.p_patch,result:'PASS'});await context.close();
}}finally{await browser.close();}
writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
