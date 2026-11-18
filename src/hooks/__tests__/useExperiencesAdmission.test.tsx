import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useExperience, useExperiences } from '../useExperiences';
const state = vi.hoisted(() => ({ filters: [] as unknown[][], rows: [] as Record<string, unknown>[] }));
vi.mock('@/integrations/supabase/client', () => ({supabase:{from:()=>{
 const chain: Record<string, unknown> = {};
 for (const method of ['select','order','limit','or']) chain[method] = () => chain;
 chain.eq=(...args:unknown[])=>{state.filters.push(args);return chain;};
 chain.then=(resolve:(v:unknown)=>void)=>resolve({data:state.rows,error:null});
 chain.maybeSingle=()=>Promise.resolve({data:state.rows[0]||null,error:null});
 return chain;
}}}));
const wrapper = ({ children }: {children: ReactNode}) => <QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}>{children}</QueryClientProvider>;
beforeEach(()=>{state.filters=[];state.rows=[{id:'fixture',name_en:'Synthetic place',attributes:{status:'published',catalog_kind:'venue',location_type:'fixed_venue'}}];});
afterEach(cleanup);
describe('public experience admission',()=>{
 it('asks server for active approved published listings',async()=>{
  const {result}=renderHook(()=>useExperiences({publishedOnly:true}),{wrapper});
  await waitFor(()=>expect(result.current.experiences).toHaveLength(1));
  expect(state.filters).toEqual(expect.arrayContaining([['is_active',true],['approval_status','approved'],['attributes->>status','published']]));
  expect(result.current.experiences[0].location_type).toBe('fixed_venue');
 });
 it('applies same admission to a direct detail URL',async()=>{
  const {result}=renderHook(()=>useExperience('fixture'),{wrapper});
  await waitFor(()=>expect(result.current.isLoading).toBe(false));
  expect(state.filters).toEqual(expect.arrayContaining([['id','fixture'],['is_active',true],['approval_status','approved'],['attributes->>status','published']]));
 });
 it.each(['temporarily_closed','permanently_closed','closed'])('does not offer an explicitly %s venue',async operating_status=>{
  state.rows[0].attributes={status:'published',operating_status};
  const {result}=renderHook(()=>useExperience('fixture'),{wrapper});
  await waitFor(()=>expect(result.current.isLoading).toBe(false));
  expect(result.current.experience).toBeNull();
 });
 it('does not equate an unknown operating status with verified open',async()=>{
  const {result}=renderHook(()=>useExperiences({publishedOnly:true}),{wrapper});
  await waitFor(()=>expect(result.current.experiences).toHaveLength(1));
  expect(result.current.experiences[0].operating_status).toBeUndefined();
 });
});
