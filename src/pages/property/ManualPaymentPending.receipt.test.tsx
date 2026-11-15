import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { readManualReceiptApproval } from '@/lib/manualPaymentIntake';
import ManualPaymentPending from './ManualPaymentPending';
const fixture=vi.hoisted(()=>({outcome:'partial' as string|null,error:false,allowed:false}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{id:'synthetic-user'}})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:async()=>({data:fixture.allowed,error:null}),from(table:string){const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},maybeSingle:async()=>({data:table==='orders'?{order_number:'TEST',metadata:{},total_amount:9500,currency:'THB'}:{id:'request',order_id:'order',status:'confirmed',amount_listing:9500,currency_listing:'THB',hold_expires_at:'2030-01-10T00:00Z',metadata:fixture.outcome?{receipt_outcome:fixture.outcome,receipt_remaining_thb:9000}:{}},error:fixture.error?new Error('synthetic failure'):null})};return q;},channel(){const c={on(){return c;},subscribe(){return c;}};return c;},removeChannel:vi.fn()}}));
function page(){render(<MemoryRouter initialEntries={['/manual/order']}><Routes><Route path="/manual/:orderId" element={<ManualPaymentPending/>}/></Routes></MemoryRouter>);}
beforeEach(()=>{fixture.outcome='partial';fixture.error=false;fixture.allowed=false;});
describe('guest receipt status',()=>{
 it('exposes the same checked receipt form to a persisted delegate through the existing request URL',async()=>{fixture.allowed=true;expect(await readManualReceiptApproval('request')).toBe(true);page();expect(await screen.findByRole('button',{name:'Record receipt'})).toBeInTheDocument();});
 it('shows remaining debt for partial receipt without claiming confirmed booking or sent voucher',async()=>{
  page();expect(await screen.findByText('Receipt recorded')).toBeInTheDocument();expect(screen.getByText(/Balance due: 9000 THB/)).toBeInTheDocument();expect(screen.queryByText(/Your booking is confirmed/)).not.toBeInTheDocument();expect(screen.queryByText(/Voucher sent/)).not.toBeInTheDocument();
 });
 it.each(['overpayment_requires_reconciliation',null])('keeps %s in reconciliation',async outcome=>{
  fixture.outcome=outcome;page();expect(await screen.findByText(/Administrator reconciliation is required/)).toBeInTheDocument();expect(screen.queryByText(/Your booking is confirmed/)).not.toBeInTheDocument();
 });
 it('confirms booking only for settled outcome without claiming successful email delivery',async()=>{
  fixture.outcome='settled';page();expect(await screen.findByText('Your booking is confirmed.')).toBeInTheDocument();expect(screen.queryByText(/Voucher sent/)).not.toBeInTheDocument();
 });
 it('distinguishes read failure from missing request and provides retry',async()=>{
  fixture.error=true;page();expect(await screen.findByText('Unable to load request')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Retry'})).toBeInTheDocument();expect(screen.queryByText('Request not found')).not.toBeInTheDocument();
 });
});
