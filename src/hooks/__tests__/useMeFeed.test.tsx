import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMeFeed } from '../useMeFeed';
const fixture = vi.hoisted(() => ({ user: {id:'test-user'} as {id:string}|null, failed:'' }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({user:fixture.user}) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {from: (table:string) => {
 type Chain = {select:()=>Chain;eq:()=>Chain;in:()=>Chain;lte:()=>Chain;order:()=>Chain;is:()=>Chain;limit:()=>Promise<{data:never[]|null;error:{message:string}|null}>};
 const chain:Chain={select:()=>chain,eq:()=>chain,in:()=>chain,lte:()=>chain,order:()=>chain,is:()=>chain,limit:()=>Promise.resolve(table===fixture.failed?{data:null,error:{message:'denied'}}:{data:[],error:null})};return chain;
}} }));
afterEach(cleanup); beforeEach(()=>{fixture.user={id:'test-user'};fixture.failed='';});
function Wrapper({children}:React.PropsWithChildren) { const [client]=React.useState(()=>new QueryClient({defaultOptions:{queries:{retry:false}}}));return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
describe('feed source failures',()=>{
 it.each([['orders','order'],['compliance_filings','compliance'],['notification_deliveries','notification'],['concierge_journeys','journey']])('reports %s instead of silently treating it as empty',async(table,source)=>{ fixture.failed=table;const {result}=renderHook(()=>useMeFeed(),{wrapper: Wrapper});await waitFor(()=>expect(result.current.isSuccess).toBe(true));expect(result.current.failedSources).toEqual([source]);expect(result.current.data).toEqual([]); });
 it('distinguishes a successful empty feed',async()=>{const {result}=renderHook(()=>useMeFeed(),{wrapper: Wrapper});await waitFor(()=>expect(result.current.isSuccess).toBe(true));expect(result.current.failedSources).toEqual([]);});
});
