import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
const fixture=vi.hoisted(()=>({actor:'staff',company:'company' as string|null,flag:true as boolean|undefined,rpc:vi.fn(),bind:vi.fn(),writes:[] as Record<string,unknown>[]}));
const row={id:'task',property_id:'property',title:'Inspection',task_type:'inspection',status:'pending',priority:'normal',assigned_to:'staff',scheduled_date:'2026-10-25',notes:null,updated_at:'2026-10-25T04:00:00.123456Z'};
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:fixture.actor}})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/hooks/useMyProperties',()=>({useMyProperties:()=>({allProperties:[{property_id:'property',management_company_id:fixture.company,checked_task_commands_enforced:fixture.flag}],isLoading:false,error:null})}));
vi.mock('@/lib/companyAccessOperation',async importOriginal=>{
 const original=await importOriginal<typeof import('@/lib/companyAccessOperation')>();
 return {...original,bindCompanyAccessOperation:async(lease:Record<string,unknown>)=>{await fixture.bind();return {...lease,client:{rpc:fixture.rpc}};}};
});
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{
 const chain={select:()=>chain,in:()=>chain,eq:()=>chain,order:()=>chain,
  update:(patch:Record<string,unknown>)=>{fixture.writes.push(patch);return chain;},
  insert:(patch:Record<string,unknown>)=>{fixture.writes.push(patch);return chain;},
  delete:()=>{fixture.writes.push({delete:true});return chain;},
  single:async()=>({data:{...row,...fixture.writes[fixture.writes.length-1]},error:null}),
  then:(resolve:(result:unknown)=>unknown)=>Promise.resolve(resolve({data:[row],error:null})),
 };return chain;
}}}));
vi.mock('sonner',()=>({toast:Object.assign(vi.fn(),{error:vi.fn(),success:vi.fn()})}));
import { useOperationalTasks } from '../useOperationalTasks';
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});const wrapper=({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;return {...renderHook(()=>useOperationalTasks(),{wrapper}),client};}
beforeEach(()=>{cleanup();fixture.actor='staff';fixture.company='company';fixture.flag=true;fixture.writes=[];fixture.bind.mockReset();fixture.bind.mockResolvedValue(undefined);fixture.rpc.mockReset();fixture.rpc.mockImplementation(async(name:string,args:Record<string,unknown>)=>({data:{...row,...(name==='create_managed_task_checked'?{id:args.p_task_id}:{}),...(args.p_patch as object??{}),completed_by:'staff',completed_at:'2026-10-25T05:00:00.654321Z'},error:null}));});
describe('managed task activation routing',()=>{
 it('recovers the same task identity after unmount and a lost create response',async()=>{
  const first=mount();await waitFor(()=>expect(first.result.current.isLoading).toBe(false));
  const input={property_id:'property',assigned_to:'staff',title:'Restart recovery inspection',task_type:'inspection' as const,scheduled_date:'2026-10-26'};
  fixture.rpc.mockResolvedValueOnce({data:null,error:{message:'Response lost'}});
  await act(async()=>{await expect(first.result.current.createTask.mutateAsync(input)).rejects.toThrow('Response lost');});
  const request=fixture.rpc.mock.calls[0][1].p_task_id;
  first.unmount();
  const second=mount();await waitFor(()=>expect(second.result.current.isLoading).toBe(false));
  await act(async()=>{await second.result.current.createTask.mutateAsync(input);});
  expect(fixture.rpc.mock.calls[1][1].p_task_id).toBe(request);
  expect(fixture.writes).toEqual([]);
 });
 it('uses checked command only for explicit true and never supplies actor/time to the RPC',async()=>{
  const {result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(async()=>{await result.current.completeTask.mutateAsync('task');});
  expect(fixture.rpc).toHaveBeenCalledWith('edit_managed_task_checked',{p_task_id:'task',p_expected_updated_at:row.updated_at,p_patch:{status:'completed'}});
  expect(fixture.writes).toEqual([]);
 });
 it('preserves the verified legacy false path and independent unmanaged path',async()=>{
  fixture.flag=false;const {result,rerender}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(async()=>{await result.current.completeTask.mutateAsync('task');});
  expect(fixture.writes).toHaveLength(1);expect(fixture.rpc).not.toHaveBeenCalled();
  fixture.company=null;fixture.flag=undefined;rerender();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(async()=>{await result.current.completeTask.mutateAsync('task');});
  expect(fixture.writes).toHaveLength(2);expect(fixture.rpc).not.toHaveBeenCalled();
 });
 it('fails closed for unknown activation metadata and for unavailable checked RPC',async()=>{
  fixture.flag=undefined;const {result,rerender}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  await act(async()=>{await expect(result.current.completeTask.mutateAsync('task')).rejects.toThrow('activation could not be verified');});
  expect(fixture.writes).toEqual([]);expect(fixture.rpc).not.toHaveBeenCalled();
  fixture.flag=true;rerender();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  fixture.rpc.mockResolvedValue({data:null,error:{message:'Function unavailable'}});
  await act(async()=>{await expect(result.current.completeTask.mutateAsync('task')).rejects.toThrow('Function unavailable');});
  expect(fixture.writes).toEqual([]);
 });
 it('retains the task request UUID across uncertain create retries and clears only on confirmed success',async()=>{
  const {result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  const input={property_id:'property',assigned_to:'staff',title:'Inspection',task_type:'inspection' as const,scheduled_date:'2026-10-25'};
  fixture.rpc.mockResolvedValueOnce({data:null,error:{message:'Response lost'}});
  await act(async()=>{await expect(result.current.createTask.mutateAsync(input)).rejects.toThrow('Response lost');});
  await act(async()=>{await result.current.createTask.mutateAsync(input);});
  expect(fixture.rpc.mock.calls[0][1].p_task_id).toBe(fixture.rpc.mock.calls[1][1].p_task_id);
  await act(async()=>{await result.current.createTask.mutateAsync(input);});
  expect(fixture.rpc.mock.calls[2][1].p_task_id).not.toBe(fixture.rpc.mock.calls[1][1].p_task_id);
  expect(fixture.writes).toEqual([]);
 });
 it('rejects stale actor readback and withholds successful cache invalidation',async()=>{
  let resolve!:(value:unknown)=>void;fixture.rpc.mockReturnValue(new Promise(done=>{resolve=done;}));
  const {result,rerender,client}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  const invalidate=vi.spyOn(client,'invalidateQueries');let pending!:Promise<unknown>;
  await act(async()=>{pending=result.current.completeTask.mutateAsync('task');await Promise.resolve();});
  fixture.actor='other-staff';rerender();
  await act(async()=>{resolve({data:{...row,status:'completed',completed_by:'staff',completed_at:'2026-10-25T05:00:00Z'},error:null});await expect(pending).rejects.toThrow('Account or company changed');});
  expect(invalidate).not.toHaveBeenCalled();expect(fixture.writes).toEqual([]);
 });
 it('rejects actor changes while binding the session before any command dispatch',async()=>{
  let release!:()=>void;fixture.bind.mockReturnValueOnce(new Promise<void>(resolve=>{release=resolve;}));
  const {result,rerender}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));
  let pending!:Promise<unknown>;
  await act(async()=>{pending=result.current.completeTask.mutateAsync('task');await Promise.resolve();});
  expect(fixture.bind).toHaveBeenCalled();
  fixture.actor='other-staff';rerender();
  await act(async()=>{release();await expect(pending).rejects.toThrow('Account or company changed');});
  expect(fixture.rpc).not.toHaveBeenCalled();expect(fixture.writes).toEqual([]);
 });
});
