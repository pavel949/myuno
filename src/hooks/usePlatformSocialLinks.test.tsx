import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlatformSocialLinks } from './usePlatformSocialLinks';
const state=vi.hoisted(()=>({data:null as unknown,error:null as Error|null,select:vi.fn(),eq:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 if(table!=='system_settings')throw Error('Unexpected table');
 return {select:(fields:string)=>{state.select(fields);return{eq:(key:string,value:string)=>{state.eq(key,value);return{maybeSingle:async()=>({data:state.data,error:state.error})};}};}};
}}}));
const clients:QueryClient[]=[];
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity}}});clients.push(client);return renderHook(usePlatformSocialLinks,{wrapper:({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});}
beforeEach(()=>{state.data=null;state.error=null;vi.clearAllMocks();});
afterEach(()=>{cleanup();clients.forEach(client=>client.clear());clients.length=0;});
describe('public social metadata reader',()=>{
 it('reads only its exact public key and validates links before displaying',async()=>{
  state.data={key:'org_social_links',value:{youtube:'https://youtube.com/@synthetic?tracking=remove',instagram:'javascript:alert(1)',linkedin:''}};
  const {result}=mount();await waitFor(()=>expect(result.current.isSuccess).toBe(true));
  expect(state.select).toHaveBeenCalledWith('key, value');expect(state.eq).toHaveBeenCalledWith('key','org_social_links');
  expect(result.current.data).toEqual({youtube:'https://youtube.com/@synthetic',instagram:'',linkedin:''});
 });
 it('does not invent profiles when no settings exist',async()=>{const {result}=mount();await waitFor(()=>expect(result.current.isSuccess).toBe(true));expect(result.current.data).toEqual({youtube:'',instagram:'',linkedin:''});});
 it('keeps a read failure distinct from a confirmed empty setting',async()=>{state.error=Error('Synthetic read failure');const {result}=mount();await waitFor(()=>expect(result.current.isError).toBe(true));expect(result.current.data).toBeUndefined();});
});
