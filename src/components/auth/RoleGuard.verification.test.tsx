import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleGuard } from './RoleGuard';
import { MCGuard } from './MCGuard';
import { InvestorGuard } from './InvestorGuard';
const fixture=vi.hoisted(()=>({rpc:vi.fn(),companies:[{company_id:'company-a'}] as Array<{company_id:string}>}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'actor-a'},isLoading:false})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:fixture.rpc}}));
vi.mock('@/hooks/useActiveCompany',()=>({useActiveCompany:()=>({companies:fixture.companies,activeCompany:fixture.companies[0]??null,isLoading:false})}));
vi.mock('./AccessDenied',()=>({AccessDenied:()=> <p role="alert">Access denied</p>}));
const context={mode:'admin',entity_id:null,role:'admin',permissions:['*'],resolved_at:'2026-10-23T00:00:00Z'};
let client:QueryClient;
let finish:(value:{data:typeof context|null;error:{message:string}|null})=>void=()=>{};
beforeEach(()=>{vi.useFakeTimers();fixture.companies=[{company_id:'company-a'}];fixture.rpc.mockReset();fixture.rpc.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});client.setQueryData(['resolved-context','actor-a'],context);});
afterEach(()=>{client.clear();vi.useRealTimers();});
function Location(){return <p data-testid="location">{useLocation().pathname}</p>;}
function mount(){return render(<QueryClientProvider client={client}><MemoryRouter><RoleGuard allowedRoles={['admin']}><p>Protected page</p></RoleGuard></MemoryRouter></QueryClientProvider>);}
async function startVerification(){await act(async()=>{void client.invalidateQueries({queryKey:['resolved-context','actor-a']});await vi.advanceTimersByTimeAsync(1);});}
describe('actual resolved-context query verification boundary',()=>{
 it('never grants cached admin while a real background verification is unresolved, including after its deadline',async()=>{
  mount();expect(screen.getByText('Protected page')).toBeTruthy();await startVerification();expect(fixture.rpc).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Protected page')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{await vi.advanceTimersByTimeAsync(12001);});expect(screen.queryByText('Protected page')).toBeNull();expect(screen.getByRole('alert').textContent).toContain('Could not verify access');
 });
 it('starts a fresh deadline for each verification after a previously successful shell',async()=>{
  mount();await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});await startVerification();
  expect(screen.queryByText('Protected page')).toBeNull();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{finish({data:context,error:null});await vi.advanceTimersByTimeAsync(1);await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByText('Protected page')).toBeTruthy();
  await act(async()=>{await vi.advanceTimersByTimeAsync(20000);});await startVerification();expect(fixture.rpc).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();expect(screen.queryByText('Protected page')).toBeNull();
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
  expect(screen.getByText('Protected page')).toBeTruthy();await startVerification();expect(screen.queryByText('Protected page')).toBeNull();expect(screen.getByRole('status')).toBeTruthy();
  await act(async()=>{finish({data:null,error:{message:'Synthetic verification failed'}});await vi.advanceTimersByTimeAsync(1);});
  expect(screen.getByRole('alert').textContent).toContain('Could not verify access');expect(screen.queryByText('Protected page')).toBeNull();
  expect(screen.getByRole('button',{name:'Retry'}).style.minHeight).toBe('44px');fireEvent.click(screen.getByRole('button',{name:'Retry'}));await act(async()=>{await vi.advanceTimersByTimeAsync(1);});
  fixture.companies=[];await act(async()=>{finish({data:{...context,mode:'user',role:'user',permissions:[]},error:null});await vi.advanceTimersByTimeAsync(1);});
  expect(screen.queryByText('Protected page')).toBeNull();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByTestId('location').textContent).toBe(destination);
 });

});
