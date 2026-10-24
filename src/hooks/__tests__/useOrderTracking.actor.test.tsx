import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useOrderTracking } from '../useOrderTracking';
const s=vi.hoisted(()=>({actor:'guest-a' as string|null,reads:0,rpcs:0,error:false,missing:false,timelinePending:false,resolveTimeline:null as null|((value:unknown)=>void),pending:false,resolveLate:null as null|((value:unknown)=>void)}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:s.actor?{id:s.actor}:null,isLoading:false})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:()=>{s.reads++;const actor=s.actor;const q={select:()=>q,eq:()=>q,abortSignal:()=>q,maybeSingle:()=>s.pending?new Promise(resolve=>{s.resolveLate=resolve}):Promise.resolve({data:s.missing?null:{id:'order-a',customer_user_id:actor,status:'pending'},error:s.error?Error('read failed'):null})};return q;},rpc:()=>{s.rpcs++;const r=s.timelinePending?new Promise(resolve=>{s.resolveTimeline=resolve}):Promise.resolve({data:[{status:s.actor==='guest-b'?'confirmed':'pending'}],error:null});return Object.assign(r,{abortSignal:()=>r});},channel:()=>{const c={on:()=>c,subscribe:()=>c};return c;},removeChannel:()=>{}}}));
beforeEach(()=>{s.timelinePending=false;s.resolveTimeline=null;s.pending=false;s.resolveLate=null;s.actor='guest-a';s.reads=0;s.rpcs=0;s.error=false;s.missing=false;});afterEach(cleanup);
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});return renderHook(()=>useOrderTracking('order-a'),{wrapper:({children})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});}
it('does not read order or timeline before authentication',()=>{s.actor=null;const {result}=mount();expect(result.current.order).toBeNull();expect(s.reads).toBe(0);expect(s.rpcs).toBe(0);});
it('reads timeline only after a readable order and masks previous actor synchronously',async()=>{const{result,rerender}=mount();await waitFor(()=>expect(result.current.timeline).toHaveLength(1));s.actor='guest-b';rerender();expect(result.current.order).toBeNull();expect(result.current.timeline).toEqual([]);await waitFor(()=>expect(result.current.order?.customer_user_id).toBe('guest-b'));s.actor=null;rerender();expect(result.current.order).toBeNull();expect(result.current.timeline).toEqual([]);});
it('does not call timeline for an unavailable order',async()=>{s.missing=true;const{result}=mount();await waitFor(()=>expect(result.current.isLoading).toBe(false));expect(result.current.order).toBeNull();expect(s.rpcs).toBe(0);});
it('surfaces a failed order read and retry recovers',async()=>{s.error=true;const{result}=mount();await waitFor(()=>expect(result.current.error).toBeTruthy());expect(s.rpcs).toBe(0);s.error=false;await result.current.refetch();await waitFor(()=>expect(result.current.order?.id).toBe('order-a'));});

it('ignores a late former-actor response after account switch and logout',async()=>{s.pending=true;const{result,rerender}=mount();await waitFor(()=>expect(s.resolveLate).toBeTruthy());const late=s.resolveLate!;s.pending=false;s.actor='guest-b';rerender();await waitFor(()=>expect(result.current.order?.customer_user_id).toBe('guest-b'));late({data:{id:'order-a',customer_user_id:'guest-a',status:'pending'},error:null});await new Promise(resolve=>setTimeout(resolve,0));expect(result.current.order?.customer_user_id).toBe('guest-b');s.actor=null;rerender();expect(result.current.order).toBeNull();expect(result.current.timeline).toEqual([]);});

it('ignores a late former-actor timeline after switching accounts',async()=>{s.timelinePending=true;const{result,rerender}=mount();await waitFor(()=>expect(s.resolveTimeline).toBeTruthy());const late=s.resolveTimeline!;s.timelinePending=false;s.actor='guest-b';rerender();await waitFor(()=>expect(result.current.timeline[0]?.status).toBe('confirmed'));late({data:[{status:'pending'}],error:null});await new Promise(resolve=>setTimeout(resolve,0));expect(result.current.timeline[0]?.status).toBe('confirmed');});

it.each(['checked_in', 'checked_out', 'deposit_paid', 'pending_deposit', 'future_status'])('does not fabricate service-sequence progress for %s', status => {
  const { result } = mount();
  expect(result.current.getProgressPercentage(status as never)).toBeNull();
  expect(result.current.isStatusCompleted('pending', status as never)).toBe(false);
  expect(result.current.isStatusCompleted(status as never, 'confirmed')).toBe(false);
});
