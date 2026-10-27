import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import ServiceProviderDetail from './ServiceProviderDetail';
import { computeSlots } from '@/lib/services/slots';
const fixture=vi.hoisted(()=>({create:vi.fn(),add:vi.fn(),tables:[] as string[],language:'en',price:1234 as number|null,currency:'THB',error:false,serviceError:false}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:fixture.language})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-guest'}})}));
vi.mock('@/contexts/CartContext',()=>({useCart:()=>({items:[],addItem:fixture.add,removeItem:vi.fn()})}));
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
 maybeSingle:async()=>({data:fixture.error?null:{id:'synthetic-provider',name:'Synthetic provider',is_active:true,is_verified:true},error:fixture.error?{message:'Private diagnostic must not render'}:null}),
 then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:[{
  id:'synthetic-service',name_en:'Synthetic repair',name_ru:'Ремонт',price:fixture.price,currency:fixture.currency,is_active:true,created_at:'2026-10-17',
  ...(columns.includes('duration_minutes')?{duration_minutes:95}:{}),...(columns.includes('lead_time_hours')?{lead_time_hours:36}:{}),
 }],error:fixture.serviceError?{message:'Synthetic services read error'}:null})),
 };return q;
}}}));
afterEach(()=>{cleanup();vi.clearAllMocks();fixture.tables=[];fixture.language='en';fixture.price=1234;fixture.currency='THB';fixture.error=false;fixture.serviceError=false;});
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

it('keeps unknown price unknown and active publication separate from availability',async()=>{
 fixture.price=null;
 render(<MemoryRouter initialEntries={['/services/provider/synthetic-provider']}><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/></Routes></MemoryRouter>);
 expect(await screen.findByText('Request a quote')).toBeVisible();
 expect(screen.queryByText('Available',{exact:true})).toBeNull();
 expect(screen.queryByText('0.0',{exact:true})).toBeNull();
 expect(screen.getByRole('button',{name:'Add'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Book'}));
 const dialog=await screen.findByRole('dialog');expect(within(dialog).getByText(/Request a quote/)).toBeVisible();
 expect(fixture.add).not.toHaveBeenCalled();expect(fixture.create).not.toHaveBeenCalled();
});
it('preserves explicit currency in the real request sheet and supports Thai labels',async()=>{
 fixture.price=25;fixture.currency='USD';fixture.language='th';
 render(<MemoryRouter initialEntries={['/services/provider/synthetic-provider']}><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/></Routes></MemoryRouter>);
 expect(await screen.findByText('USD 25')).toBeVisible();
 expect(screen.getByRole('button',{name:'เพิ่ม'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'ขอเวลารับบริการ'}));
 const dialog=await screen.findByRole('dialog');expect(within(dialog).getByText(/^USD 25/)).toBeVisible();
 expect(fixture.create).not.toHaveBeenCalled();
});

it('renders a retryable read error instead of claiming the provider is absent',async()=>{
 fixture.error=true;
 render(<MemoryRouter initialEntries={['/services/provider/synthetic-provider?returnTo=%2Fservices%3Fcategory%3Dcleaning']}><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/></Routes></MemoryRouter>);
 expect(await screen.findByRole('heading',{name:'Could not load this provider'})).toBeVisible();
 expect(screen.queryByText('Provider not found')).toBeNull();expect(screen.queryByText('Private diagnostic must not render')).toBeNull();
 fixture.error=false;fireEvent.click(screen.getByRole('button',{name:'Try again'}));
 expect(await screen.findByRole('heading',{name:'Synthetic provider'})).toBeVisible();expect(fixture.create).not.toHaveBeenCalled();
});

it('does not label a failed public services read as an empty provider catalogue',async()=>{
 fixture.serviceError=true;
 render(<MemoryRouter initialEntries={['/services/provider/synthetic-provider']}><Routes><Route path="/services/provider/:id" element={<ServiceProviderDetail/>}/></Routes></MemoryRouter>);
 expect(await screen.findByRole('heading',{name:'Could not load this provider'})).toBeVisible();
 expect(screen.queryByText('No services yet')).toBeNull();expect(fixture.create).not.toHaveBeenCalled();
});
