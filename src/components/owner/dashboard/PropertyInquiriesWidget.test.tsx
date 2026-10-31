import { beforeEach, expect, it, vi } from 'vitest';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient,QueryClientProvider } from '@tanstack/react-query';
const fixture=vi.hoisted(()=>({list:vi.fn(),decide:vi.fn(),language:'en',orders:[] as unknown[]}));
vi.mock('@/hooks/useActiveCompany',()=>({useActiveCompany:()=>({activeCompany:{company_id:'company'}})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'operator'}})}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:fixture.language})}));
vi.mock('@/hooks/useMyProperties',()=>({useMyProperties:()=>({allProperties:[{id:'assignment-uuid',property_id:'physical-property',title_en:'Synthetic home'}]})}));
vi.mock('@/lib/rentalRequest',()=>({listRentalRequests:fixture.list,decideRentalRequest:fixture.decide}));
vi.mock('sonner',()=>({toast:{success:vi.fn(),error:vi.fn()}}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{from:(table:string)=>{
 if(table!=='orders')throw Error('Direct inquiry reads/writes are forbidden');
 const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,limit:async()=>({data:fixture.orders,error:null})};return q;
}}}));
import { PropertyInquiriesWidget } from './PropertyInquiriesWidget';
const summary={id:'inquiry-1',order_id:'order-1',property_id:'physical-property',name:'Synthetic Guest',phone:null,email:null,message:null,status:'pending',check_in:'2030-11-10',check_out:'2030-11-13',guests:2,created_at:'2026-10-31T00:00:00Z',quoted_total:9000,currency:'THB'};
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<MemoryRouter><QueryClientProvider client={client}><PropertyInquiriesWidget/></QueryClientProvider></MemoryRouter>);return client;}
beforeEach(()=>{cleanup();fixture.list.mockReset();fixture.decide.mockReset();fixture.language='en';fixture.orders=[];fixture.list.mockResolvedValue([summary]);});
it('uses physical property IDs and displays the received request once with its estimate',async()=>{
 fixture.orders=[{id:'order-1',status:'pending',metadata:{property_id:'physical-property',inquiry_id:'inquiry-1'}}];
 mount();await screen.findByText('Synthetic Guest');expect(fixture.list).toHaveBeenCalledWith(['physical-property']);
 expect(screen.getAllByText('Synthetic Guest')).toHaveLength(1);expect(screen.getByText('Estimated total: THB 9000')).toBeInTheDocument();
});
it('checked acceptance invalidates request and calendar caches only after confirmed outcome',async()=>{
 fixture.decide.mockResolvedValue({inquiry_id:'inquiry-1',order_id:'order-1',status:'accepted'});
 const client=mount();const invalidation=vi.spyOn(client,'invalidateQueries');
 fireEvent.click(await screen.findByRole('button',{name:'Confirm stay'}));
 await waitFor(()=>expect(fixture.decide).toHaveBeenCalledWith('inquiry-1','accepted'));
 await waitFor(()=>expect(invalidation).toHaveBeenCalledWith({queryKey:['property-inquiries-widget']}));
});
it('failed decision keeps the visible request and never invents calendar success',async()=>{
 fixture.decide.mockRejectedValue(new Error('request_inventory_not_committed'));
 const client=mount();const invalidation=vi.spyOn(client,'invalidateQueries');
 fireEvent.click(await screen.findByRole('button',{name:'Confirm stay'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Confirm stay'})).not.toBeDisabled());
 expect(invalidation).not.toHaveBeenCalled();expect(screen.getByText('Synthetic Guest')).toBeInTheDocument();
});
it('failed checked list is an explicit error with retry, never a no-enquiries message',async()=>{
 fixture.list.mockRejectedValue(new Error('Function unavailable'));mount();
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not load requests');expect(screen.queryByText('No enquiries yet')).not.toBeInTheDocument();
});
