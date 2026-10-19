// Actual shared components, synthetic UI only; no production data imports or traffic.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
const output = '/tmp/browser/shared-surfaces-isolated';
await mkdir(output,{recursive:true});
const virtual={
 '@/contexts/LanguageContext':`export const useLanguage=()=>({language:new URLSearchParams(location.search).get('lang')||'ru'});`,
 '@/hooks/useFeedbackSettings':`export const getFeedbackSettings=()=>({hapticEnabled:false,soundEnabled:false,typingSoundEnabled:false});`,
 '@/integrations/supabase/client':`throw Error('Production database forbidden');`,
};
await build({stdin:{contents:`
import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {PageShell} from '@/components/page/PageShell'; import {PageHeader} from '@/components/page/PageHeader';
import {Button} from '@/components/ui/button'; import {Input} from '@/components/ui/input';
import {Form,FormField,FormItem,FormLabel,FormControl,FormMessage} from '@/components/ui/form';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter,DialogClose} from '@/components/ui/dialog';
import {Sheet,SheetTrigger,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
const ru=new URLSearchParams(location.search).get('lang')==='ru';
const labels={save:ru?'Сохранить изменения':'Save changes', extra:ru?'Открыть документы':'Open documents', hidden:ru?'Архив':'Archive', title:ru?'Настройки объекта и управление размещением':'Property settings and publication', email:ru?'Электронная почта':'Email', error:ru?'Укажите электронную почту':'Enter your email'};
function App(){const form=useForm({defaultValues:{email:''}}); return <PageShell><PageHeader title={labels.title} subtitle={ru?'Проверьте информацию перед сохранением.':'Review information before saving.'} actions={[{label:labels.save,variant:'primary',onClick:()=>{}},{label:labels.extra,mobileHidden:false,onClick:()=>{}},{label:labels.hidden,onClick:()=>{}}]}/>
<Form {...form}><form onSubmit={form.handleSubmit(()=>{})} className="max-w-md space-y-4"><FormField control={form.control} name="email" rules={{required:labels.error}} render={({field})=><FormItem><FormLabel>{labels.email}</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>}/><Button type="submit">Validate</Button><Button disabled>Disabled</Button></form></Form>
<div className="mt-6 flex flex-wrap gap-3">
<Dialog><DialogTrigger asChild><Button>Dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{labels.title}</DialogTitle><DialogDescription>Long content remains reachable on short screens.</DialogDescription></DialogHeader><div>{Array.from({length:18},(_,i)=><p key={i} className="py-2">{labels.title} {i+1}</p>)}</div><DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter></DialogContent></Dialog>
<Sheet><SheetTrigger asChild><Button>Sheet</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>{labels.title}</SheetTitle><SheetDescription>Nested controls</SheetDescription></SheetHeader><div className="mt-6 space-y-6"><Popover><PopoverTrigger asChild><Button>Popover</Button></PopoverTrigger><PopoverContent><Button>Popover action</Button></PopoverContent></Popover><DropdownMenu><DropdownMenuTrigger asChild><Button>Options</Button></DropdownMenuTrigger><DropdownMenuContent>{Array.from({length:30},(_,i)=><DropdownMenuItem key={i}>Option {i+1}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div></SheetContent></Sheet>
</div><div className="fixed bottom-0 left-0 right-0 z-[100] h-16 bg-muted" data-testid="navigation">Navigation</div></PageShell>}
createRoot(document.getElementById('root')).render(<MemoryRouter><App/></MemoryRouter>);`,loader:'tsx',resolveDir:root},bundle:true,outfile:path.join(output,'fixture.js'),jsx:'automatic',format:'esm',define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false'},plugins:[{name:'isolate',setup(b){b.onResolve({filter:/.*/},args=>{if(Object.hasOwn(virtual,args.path))return {path:args.path,namespace:'fixture'};if(args.path.startsWith('@/')){const base=path.join(root,'src',args.path.slice(2));return {path:[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>existsSync(p)&&statSync(p).isFile())};}});b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:virtual[args.path],loader:'tsx',resolveDir:root}));}}]});
const css=await fetch('http://localhost:8080/src/index.css?direct'); if(!css.ok)throw Error('CSS unavailable');
await writeFile(path.join(output,'fixture.css'),await css.text());
await writeFile(path.join(output,'fixture.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const run=spawnSync('python3',[path.join(root,'scripts/qa/shared-surfaces-ui.py'),output],{stdio:'inherit'});process.exitCode=run.status??1;
