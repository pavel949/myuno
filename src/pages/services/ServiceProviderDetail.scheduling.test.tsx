import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import ServiceProviderDetail from './ServiceProviderDetail';
import { computeSlots } from '@/lib/services/slots';
const fixture=vi.hoisted(()=>({create:vi.fn(),tables:[] as string[]}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-guest'}})}));
vi.mock('@/contexts/CartContext',()=>({useCart:()=>({items:[],addItem:vi.fn(),removeItem:vi.fn()})}));
vi.mock('@/hooks/useCartToast',()=>({useCartToast:()=>({showAddedToast:vi.fn()})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:ReactNode})=><main>{children}</main>}));
vi.mock('@/hooks/useReviews',()=>({useReviews:()=>({reviews:[],stats:{average:0,total:0},isLoading:false})}));
vi.mock('@/hooks/useServiceMarketplace',()=>({
 useProviderHours:()=>({data:[],isSuccess:true}),useBusySlots:()=>({data:[]}),
 useCreateServiceOrder:()=>({mutateAsync:fixture.create,isPending:false}),orderErrorCode:()=> 'UNKNOWN',
}));
vi.mock('@/lib/services/slots',async importOriginal=>{
 const actual=await importOriginal<typeof import('@/lib/services/slots')>();
 return {...actual,computeSlots:vi.fn(actual.computeSlots)};
});
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 fixture.tables.push(table);
 if(!['public_provider_catalog','public_service_catalog'].includes(table))throw new Error('Unexpected private read');
 let columns='';const q={select:(value:string)=>{columns=value;return q;},eq:()=>q,order:()=>q,
 maybeSingle:async()=>({data:{id:'synthetic-provider',name:'Synthetic provider',is_active:true,is_verified:true},error:null}),
 then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:[{
  id:'synthetic-service',name_en:'Synthetic repair',name_ru:'Ремонт',price:1234,currency:'THB',is_active:true,created_at:'2026-10-17',
  ...(columns.includes('duration_minutes')?{duration_minutes:95}:{}),...(columns.includes('lead_time_hours')?{lead_time_hours:36}:{}),
 }],error:null})),
 };return q;
}}}));
afterEach(()=>{cleanup();vi.clearAllMocks();fixture.tables=[];});
it('passes nondefault catalogue scheduling through the real detail page into the real booking dialog',async()=>{
 render(<MemoryRouter initialEntries={['/services/provider/synthetic-provider']}><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/></Routes></MemoryRouter>);
 const book=await screen.findByRole('button',{name:'Book'});fireEvent.click(book);
 const dialog=await screen.findByRole('dialog');
 expect(within(dialog).getByRole('heading',{name:'Synthetic repair'})).toBeVisible();
 expect(within(dialog).getByText(/95 min/)).toBeVisible();
 await waitFor(()=>expect(computeSlots).toHaveBeenCalledWith(expect.objectContaining({durationMinutes:95,leadTimeHours:36})));
 expect(fixture.tables).toEqual(['public_provider_catalog','public_service_catalog']);
 expect(fixture.create).not.toHaveBeenCalled();
});
