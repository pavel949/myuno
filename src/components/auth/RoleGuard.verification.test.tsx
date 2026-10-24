import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleGuard } from './RoleGuard';
import { MCGuard } from './MCGuard';
import { InvestorGuard } from './InvestorGuard';
const fixture=vi.hoisted(()=>({actor:'actor-a' as string|null,rpc:vi.fn(),companies:[{company_id:'company-a',role:'owner'}] as Array<{company_id:string;role?:string}>}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:fixture.actor?{id:fixture.actor}:null,isLoading:false})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:fixture.rpc}}));
vi.mock('@/hooks/useActiveCompany',()=>({useActiveCompany:()=>({companies:fixture.companies,activeCompany:fixture.companies[0]??null,isLoading:false})}));
vi.mock('./AccessDenied',()=>({AccessDenied:()=> <p role="alert">Access denied</p>}));
const context={mode:'admin',entity_id:null,role:'admin',permissions:['*'],resolved_at:'2026-10-23T00:00:00Z'};
let client:QueryClient;
let finish:(value:{data:typeof context|null;error:{message:string}|null})=>void=()=>{};
const modalDescriptors = ['showModal','close'].map(name => [name,Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,name)] as const);
beforeAll(()=>{
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.setAttribute('open','');}});
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(){this.removeAttribute('open');}});
});
afterAll(()=>{for(const[name,descriptor]of modalDescriptors){if(descriptor)Object.defineProperty(HTMLDialogElement.prototype,name,descriptor);else Reflect.deleteProperty(HTMLDialogElement.prototype,name);}});
beforeEach(()=>{fixture.actor='actor-a';vi.useFakeTimers();fixture.companies=[{company_id:'company-a'}];fixture.rpc.mockReset();fixture.rpc.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});client.setQueryData(['resolved-context','actor-a'],context);});
afterEach(()=>{client.clear();vi.useRealTimers();});
function Location(){return <p data-testid="location">{useLocation().pathname}</p>;}
function Draft(){const[value,setValue]=React.useState('');return <input aria-label="Unsaved draft" value={value} onChange={event=>setValue(event.target.value)}/>;}
function mount(){return render(<QueryClientProvider client={client}><MemoryRouter><RoleGuard allowedRoles={['admin']}><p>Protected page</p></RoleGuard></MemoryRouter></QueryClientProvider>);}
async function startVerification(){await act(async()=>{void client.invalidateQueries({queryKey:['resolved-context','actor-a']});await vi.advanceTimersByTimeAsync(1);});}
describe('actual resolved-context query verification boundary',()=>{
 it('preserves a same-identity draft across repeated successful checks while never exposing it pending',async()=>{
  render(<QueryClientProvider client={client}><MemoryRouter><RoleGuard allowedRoles={['admin']}><Draft/></RoleGuard></MemoryRouter></QueryClientProvider>);
  const input=screen.getByRole('textbox',{name:'Unsaved draft'});fireEvent.change(input,{target:{value:'not saved'}});
  for(let i=0;i<2;i++){
   await startVerification();expect(input).not.toBeVisible();expect(input.closest('[inert]')).toBeTruthy();
   await act(async()=>{finish({data:{...context,resolved_at:String(i)},error:null});await vi.advanceTimersByTimeAsync(2);});
   expect(screen.getByRole('textbox')).toBe(input);expect(input).toHaveValue('not saved');expect(input).toBeVisible();
  }
 });
 it('drops a previous actor immediately and ignores its late response',async()=>{
  const tree=()=> <QueryClientProvider client={client}><MemoryRouter><RoleGuard allowedRoles={['admin']}><Draft/></RoleGuard></MemoryRouter></QueryClientProvider>;
  const view=render(tree());fireEvent.change(screen.getByRole('textbox'),{target:{value:'actor A private draft'}});
  await startVerification();const finishA=finish;fixture.actor='actor-b';view.rerender(tree());
  expect(screen.queryByLabelText('Unsaved draft')).toBeNull();const finishB=finish;
  await act(async()=>{finishA({data:context,error:null});await vi.advanceTimersByTimeAsync(2);});expect(screen.queryByLabelText('Unsaved draft')).toBeNull();
  await act(async()=>{finishB({data:{...context,role:'user',permissions:[]},error:null});await vi.advanceTimersByTimeAsync(2);});
  expect(screen.getByText('Access denied')).toBeVisible();expect(screen.queryByLabelText('Unsaved draft')).toBeNull();
 });
 it('drops a draft after verified revocation rather than revealing cached privilege',async()=>{
  render(<QueryClientProvider client={client}><MemoryRouter><RoleGuard allowedRoles={['admin']}><Draft/></RoleGuard></MemoryRouter></QueryClientProvider>);
  await startVerification();await act(async()=>{finish({data:{...context,role:'user',permissions:[]},error:null});await vi.advanceTimersByTimeAsync(2);});
  expect(screen.getByText('Access denied')).toBeVisible();expect(screen.queryByLabelText('Unsaved draft')).toBeNull();
 });

 it('discards form state on a same-company membership-role change',()=>{
  fixture.companies=[{company_id:'company-a',role:'owner'}];
  const tree=()=> <QueryClientProvider client={client}><MemoryRouter><MCGuard><Draft/></MCGuard></MemoryRouter></QueryClientProvider>;
  const view=render(tree());const original=screen.getByRole('textbox');fireEvent.change(original,{target:{value:'owner-only draft'}});
  fixture.companies=[{company_id:'company-a',role:'staff'}];view.rerender(tree());
  expect(screen.getByRole('textbox')).not.toBe(original);expect(screen.getByRole('textbox')).toHaveValue('');
 });
 it('unmounts safely during rechecks when native modal quarantine is unavailable',async()=>{
  const descriptor=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,'showModal');
  Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:undefined});
  try {mount();await startVerification();expect(screen.queryByText('Protected page')).toBeNull();}
  finally {if(descriptor)Object.defineProperty(HTMLDialogElement.prototype,'showModal',descriptor);}
 });
 it('never grants cached admin while a real background verification is unresolved, including after its deadline',async()=>{
  mount();expect(screen.getByText('Protected page')).toBeTruthy();await startVerification();expect(fixture.rpc).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Protected page')).not.toBeVisible();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{await vi.advanceTimersByTimeAsync(12001);});expect(screen.queryByText('Protected page')).not.toBeVisible();expect(screen.getByRole('alert').textContent).toContain('Could not verify access');
 });
 it('starts a fresh deadline for each verification after a previously successful shell',async()=>{
  mount();await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});await startVerification();
  expect(screen.queryByText('Protected page')).not.toBeVisible();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{finish({data:context,error:null});await vi.advanceTimersByTimeAsync(1);await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByText('Protected page')).toBeTruthy();
  await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});await startVerification();expect(fixture.rpc).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();expect(screen.queryByText('Protected page')).not.toBeVisible();
 });
 it('does not treat cached data plus a failed verification as authority and retries the real query',async()=>{
  mount();await startVerification();
  await act(async()=>{finish({data:null,error:{message:'Synthetic verification failed'}});await vi.advanceTimersByTimeAsync(1);await vi.advanceTimersByTimeAsync(1);});
  expect(screen.queryByText('Protected page')).toBeNull();expect(screen.getByRole('alert').textContent).toContain('Could not verify access');expect(screen.queryByText('Access denied')).toBeNull();
  expect(screen.getByRole('button',{name:'Retry'}).style.minHeight).toBe('44px');fireEvent.click(screen.getByRole('button',{name:'Retry'}));await act(async()=>{await vi.advanceTimersByTimeAsync(1);});expect(fixture.rpc).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('Protected page')).toBeNull();
  await act(async()=>{finish({data:context,error:null});await vi.advanceTimersByTimeAsync(1);await vi.advanceTimersByTimeAsync(1);});expect(screen.getByText('Protected page')).toBeTruthy();
 });
 it.each([['MC',MCGuard,'/mc/onboarding'],['Investor',InvestorGuard,'/invest']] as const)('%s also blocks cached authority during verification and distinguishes failure from ordinary denial',async(_name,Guard,destination)=>{
  render(<QueryClientProvider client={client}><MemoryRouter><Location/><Guard><p>Protected page</p></Guard></MemoryRouter></QueryClientProvider>);
  expect(screen.getByText('Protected page')).toBeTruthy();await startVerification();expect(screen.queryByText('Protected page')).not.toBeVisible();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{finish({data:null,error:{message:'Synthetic verification failed'}});await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByRole('alert').textContent).toContain('Could not verify access');expect(screen.queryByText('Protected page')).toBeNull();
  expect(screen.getByRole('button',{name:'Retry'}).style.minHeight).toBe('44px');fireEvent.click(screen.getByRole('button',{name:'Retry'}));await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
  fixture.companies=[];await act(async()=>{finish({data:{...context,mode:'user',role:'user',permissions:[]},error:null});await vi.advanceTimersByTimeAsync(1);});
  expect(screen.queryByText('Protected page')).toBeNull();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByTestId('location').textContent).toBe(destination);
 });

});

// Retain the parallel main branch's distinct admission/identity regressions.
function MainDraft(){const [value,setValue]=React.useState('');return <input aria-label="Retained form draft" value={value} onChange={e=>setValue(e.target.value)}/>;}
function draftShell(Guard:typeof MCGuard){return <QueryClientProvider client={client}><MemoryRouter><Guard><MainDraft/></Guard></MemoryRouter></QueryClientProvider>;}
const AdminPage=({children}:{children:React.ReactNode})=><RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>;
describe('reconciled main admission regressions',()=>{
 it.each([['MC',MCGuard],['Investor',InvestorGuard]] as const)('%s retains its same input across two successful checks',async(_name,Guard)=>{
  render(draftShell(Guard));const input=screen.getByRole('textbox',{name:'Retained form draft'});fireEvent.change(input,{target:{value:'Unsaved property description'}});
  for(let i=0;i<2;i++){
   await startVerification();expect(input).not.toBeVisible();expect(input.closest('[inert]')).toBeTruthy();expect(screen.queryByRole('textbox')).toBeNull();
   await act(async()=>{finish({data:{...context,resolved_at:`check-${i}`},error:null});await vi.advanceTimersByTimeAsync(2);});
   expect(screen.getByRole('textbox',{name:'Retained form draft'})).toBe(input);expect(input).toHaveValue('Unsaved property description');
  }
 });
 it('does not mount an initial cached page while its first check is pending',async()=>{
  await client.invalidateQueries({queryKey:['resolved-context','actor-a']});render(draftShell(AdminPage));await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
  expect(screen.queryByLabelText('Retained form draft')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
 });
 it.each(['failure','revocation'] as const)('removes a retained form after %s',async(outcome)=>{
  render(draftShell(AdminPage));const input=screen.getByRole('textbox');await startVerification();
  await act(async()=>{finish(outcome==='failure'?{data:null,error:{message:'denied'}}:{data:{...context,role:'user',permissions:[]},error:null});await vi.advanceTimersByTimeAsync(2);});
  expect(input.isConnected).toBe(false);expect(screen.queryByLabelText('Retained form draft')).toBeNull();expect(screen.getByRole('alert')).toBeTruthy();
 });
 it('removes the previous actor form immediately without needing an existing refetch',()=>{
  const view=render(draftShell(AdminPage));const input=screen.getByRole('textbox');fixture.actor='actor-b';view.rerender(draftShell(AdminPage));
  expect(input.isConnected).toBe(false);expect(screen.queryByLabelText('Retained form draft')).toBeNull();
 });
 it('does not retain a previous company during verification',async()=>{
  const view=render(draftShell(MCGuard));const input=screen.getByRole('textbox');await startVerification();fixture.companies=[{company_id:'company-b'}];view.rerender(draftShell(MCGuard));
  expect(input.isConnected).toBe(false);expect(screen.queryByLabelText('Retained form draft')).toBeNull();
 });
 it('resets local state when the resolved context entity changes',async()=>{
  render(draftShell(AdminPage));const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:'Old scope'}});
  await act(async()=>{client.setQueryData(['resolved-context','actor-a'],{...context,entity_id:'company-b'});await vi.advanceTimersByTimeAsync(1);});
  expect(input.isConnected).toBe(false);expect(screen.getByRole('textbox')).toHaveValue('');
 });
});
