import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePropertyAvailabilityManagement } from '../usePropertyAvailabilityManagement';
import { useMaintenanceSchedules } from '../useMaintenanceSchedules';

const state = vi.hoisted(() => ({ reply: { data: null as unknown, error: null as unknown }, success: vi.fn(), error: vi.fn(), invalidate: vi.fn(), from: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-actor' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: state.success, error: state.error }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
function wrapper() {
 const client = new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
 vi.spyOn(client,'invalidateQueries').mockImplementation(state.invalidate);
 return ({children}:React.PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
 vi.clearAllMocks(); state.reply={data:null,error:null};
 state.from.mockImplementation(() => {
  let mutation=false;
  const chain: Record<string, unknown> = {};
  for(const method of ['select','eq','in','order'])chain[method]=()=>chain;
  for(const method of ['update','delete','insert','upsert'])chain[method]=()=>{mutation=true;return chain;};
  chain.maybeSingle=()=>Promise.resolve(state.reply);
  chain.then=(resolve: (reply:unknown)=>unknown,reject: (reason:unknown)=>unknown)=>Promise.resolve(mutation?state.reply:{data:[],error:null}).then(resolve,reject);
  return chain;
 });
});
describe('PMS mutation acknowledgements',()=>{
 it('propagates a denied availability clear instead of acknowledging saved state',async()=>{
  state.reply={data:null,error:{message:'permission denied',code:'42501'}};
  const {result}=renderHook(()=>usePropertyAvailabilityManagement('synthetic-property'),{wrapper:wrapper()});
  await expect(result.current.syncAvailability([])).rejects.toMatchObject({message:'permission denied'});
  expect(state.invalidate).not.toHaveBeenCalled();
 });
 it('permits idempotent clear when there were already no availability rows',async()=>{
  state.reply={data:[],error:null};
  const {result}=renderHook(()=>usePropertyAvailabilityManagement('synthetic-property'),{wrapper:wrapper()});
  await expect(result.current.syncAvailability([])).resolves.toBeUndefined();
  expect(state.invalidate).toHaveBeenCalled();
 });
 it('never clears availability without a selected property',async()=>{
  const {result}=renderHook(()=>usePropertyAvailabilityManagement(),{wrapper:wrapper()});
  await expect(result.current.syncAvailability([])).rejects.toThrow('Property ID required');
  expect(state.from).not.toHaveBeenCalled();
 });
 for(const operation of ['markCompleted','updateSchedule','deleteSchedule'] as const){
  const input=operation==='updateSchedule'?{id:'synthetic-schedule',notes:'Updated note'}:'synthetic-schedule';
  it(`does not report ${operation} success for a zero-row update`,async()=>{
   const {result}=renderHook(()=>useMaintenanceSchedules(),{wrapper:wrapper()});
   await act(async()=>{await expect(result.current[operation].mutateAsync(input as never)).rejects.toThrow('not confirmed');});
   expect(state.success).not.toHaveBeenCalled();await waitFor(()=>expect(state.error).toHaveBeenCalled());
  });
  it(`acknowledges persisted ${operation} result`,async()=>{
   state.reply={data:{id:'synthetic-schedule',last_completed_at:'2026-10-23T00:00:00Z',is_active:false,notes:'Updated note'},error:null};
   const {result}=renderHook(()=>useMaintenanceSchedules(),{wrapper:wrapper()});
   await act(async()=>{await result.current[operation].mutateAsync(input as never);});
   expect(state.success).toHaveBeenCalled();
  });
 }
 it('does not accept a different returned schedule',async()=>{
  state.reply={data:{id:'different-schedule',last_completed_at:'2026-10-23T00:00:00Z'},error:null};
  const{result}=renderHook(()=>useMaintenanceSchedules(),{wrapper:wrapper()});
  await act(async()=>{await expect(result.current.markCompleted.mutateAsync('synthetic-schedule')).rejects.toThrow('not confirmed');});
  expect(state.success).not.toHaveBeenCalled();
 });
});
