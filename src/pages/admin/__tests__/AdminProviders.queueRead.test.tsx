import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import AdminProviders from '../AdminProviders';
const state=vi.hoisted(()=>({error:false,mode:'cap',term:'',reads:[] as {method:string,column?:string,value?:unknown}[],write:vi.fn(()=>{throw Error('Unexpected write');})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-admin'},isLoading:false})}));
vi.mock('@/hooks/useIsAdmin',()=>({useIsAdmin:()=>({isAdmin:true,isLoading:false})}));
vi.mock('@/components/admin/BusinessCardScanButton',()=>({BusinessCardScanButton:()=>null}));
vi.mock('@/lib/errorHandler',()=>({createErrorHandler:()=>({silent:vi.fn()})}));
vi.mock('@/integrations/supabase/client',async()=>{const {matchesLiteralOr}=await import('@/test/literalPostgrestFixture');return ({supabase:{from:()=>{
  const common={business_category:'legal',is_active:true,created_at:'2026-10-20T00:00:00.000Z'};
  let rows=state.mode==='ties'?Array.from({length:51},(_,i)=>({...common,id:String(i).padStart(3,'0'),name:`Tie provider ${String(i).padStart(3,'0')}`,is_verified:false})):[
    ...Array.from({length:1000},(_,i)=>({...common,id:`new-${i}`,name:`Verified fixture ${i}`,is_verified:true})),
    {...common,id:'older-unverified',name:'Older unverified fixture',is_verified:false,created_at:'2026-10-18T00:00:00.000Z'},
  ];
  if(state.mode==='literal')rows=[{...common,id:'literal',name:state.term,is_verified:false},{...common,id:'decoy',name:state.term.replace(/[._%']/g,'X'),is_verified:false}];
  const sorting:{column:string;ascending:boolean}[]=[];let start=0,end=999;
  const query={select:()=>query,order:(column:string,options:{ascending:boolean})=>{sorting.push({column,ascending:options.ascending});state.reads.push({method:'order',column,value:options.ascending});return query;},
    eq:(column:string,value:unknown)=>{state.reads.push({method:'eq',column,value});rows=rows.filter(row=>row[column as keyof typeof row]===value);return query;},
    or:(condition:string)=>{rows=rows.filter(row=>matchesLiteralOr(condition,row));return query;},range:(from:number,to:number)=>{state.reads.push({method:'range',value:[from,to]});start=from;end=to;return query;},
    then:(resolve:(value:unknown)=>unknown)=>{rows.sort((a,b)=>{for(const sort of sorting){const result=String(a[sort.column as keyof typeof a]).localeCompare(String(b[sort.column as keyof typeof b]));if(result)return sort.ascending?result:-result;}return 0;});return Promise.resolve({data:state.error?null:rows.slice(start,end+1),count:rows.length,error:state.error?Error('Synthetic read failure'):null}).then(resolve);},
    insert:state.write,update:state.write,delete:state.write};return query;
}}});});
const clients:QueryClient[]=[];
function setup(cached=false,search=''){const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});clients.push(client);if(cached)client.setQueryData(['admin','providers','synthetic-admin','unverified','',0,null],{rows:[{id:'cached',name:'Cached provider',business_category:'legal',is_active:true,is_verified:false}],count:1});render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin/providers?filter=unverified'+(search?'&q='+encodeURIComponent(search):'')]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><AdminProviders/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{state.error=false;state.mode='cap';state.reads=[];vi.clearAllMocks();});
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear());});
describe('provider queue exact reads',()=>{
  it.each(['fixture@example.invalid',"O'Reilly",'tax_id','100%'])('keeps literal search and count aligned for %s',async term=>{state.mode='literal';state.term=term;setup(false,term);expect(await screen.findByText(term)).toBeInTheDocument();expect(screen.queryByText(term.replace(/[._%']/g,'X'))).not.toBeInTheDocument();expect(screen.getByText(/^Matching providers:/)).toHaveTextContent('Matching providers: 1');expect(state.write).not.toHaveBeenCalled();});
  it('filters before range so one older unverified record behind1000verified records is reachable',async()=>{setup();expect(await screen.findByText('Older unverified fixture')).toBeInTheDocument();expect(screen.queryByText('Verified fixture 0')).not.toBeInTheDocument();expect(screen.getByText(/^Matching providers:/)).toHaveTextContent('Matching providers: 1');expect(state.reads.findIndex(x=>x.method==='eq'&&x.column==='is_verified')).toBeLessThan(state.reads.findIndex(x=>x.method==='range'));expect(state.write).not.toHaveBeenCalled();});
  it('paginates equal creation timestamps by descending id without overlap',async()=>{state.mode='ties';setup();expect(await screen.findByText('Tie provider 050')).toBeInTheDocument();expect(screen.getByText('Tie provider 001')).toBeInTheDocument();expect(screen.queryByText('Tie provider 000')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Next'}));expect(await screen.findByText('Tie provider 000')).toBeInTheDocument();expect(screen.queryByText('Tie provider 001')).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Next'})).toBeDisabled();expect(state.reads).toContainEqual({method:'order',column:'id',value:false});},15000);
  it('reports first-load failure without no-provider/first-provider claims and retries',async()=>{state.error=true;setup();expect(await screen.findByRole('alert')).toHaveTextContent('Could not load providers');expect(screen.queryByText('No providers')).not.toBeInTheDocument();expect(screen.queryByText('Add your first provider')).not.toBeInTheDocument();state.error=false;fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(await screen.findByText('Older unverified fixture')).toBeInTheDocument();});
  it('retains stale rows honestly after refresh failure and hides unverified count',async()=>{state.error=true;setup(true);expect(await screen.findByRole('alert')).toHaveTextContent('Previously loaded records below may be out of date');expect(screen.getByText('Cached provider')).toBeInTheDocument();expect(within(screen.getByRole('button',{name:'Unverified'})).queryByText('1')).not.toBeInTheDocument();expect(screen.queryByText('No providers')).not.toBeInTheDocument();await waitFor(()=>expect(screen.getByRole('button',{name:'Retry'})).toBeEnabled());});
});
