import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmPaymentDialog, type RequestRow } from './OperationsManualPaymentsTab';
const mocks=vi.hoisted(()=>({invoke:vi.fn(),upload:vi.fn(),success:vi.fn(),error:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{storage:{from:()=>({upload:mocks.upload})},functions:{invoke:mocks.invoke}}}));
vi.mock('sonner',()=>({toast:{success:mocks.success,error:mocks.error}}));
const row={id:'00000000-0000-4000-8000-000000000001',amount_rub_estimate:19000,amount_listing:9500,orders:{total_amount:9500,currency:'THB'}} as RequestRow;
function form(){const done=vi.fn();render(<ConfirmPaymentDialog row={row} isRu={false} onClose={()=>{}} onDone={done}/>);return done;}
function fill(){
 fireEvent.change(screen.getByLabelText('Amount received (₽)'),{target:{value:'1000'}});
 fireEvent.change(screen.getByLabelText('Agreed rate: RUB per 1 THB'),{target:{value:'2'}});
 fireEvent.change(screen.getByLabelText('Unique bank receipt reference'),{target:{value:'synthetic-bank-document'}});
 fireEvent.change(screen.getByLabelText('Document (required, up to 10 MB)'),{target:{files:[new File(['synthetic'],'proof.pdf',{type:'application/pdf'})]}});
}
beforeEach(()=>{vi.clearAllMocks();mocks.upload.mockResolvedValue({error:null});mocks.invoke.mockResolvedValue({data:{ok:true,order_id:'synthetic-order',outcome:'partial',remaining_thb:9000},error:null});});
describe('manual receipt document form',()=>{
 it('does not prefill actual money from an estimate and requires evidence',()=>{
  form();expect(screen.getByLabelText('Amount received (₽)')).toHaveValue(null);
  fireEvent.click(screen.getByRole('button',{name:'Confirm'}));expect(mocks.invoke).not.toHaveBeenCalled();expect(mocks.error).toHaveBeenCalled();
 });
 it('sends explicit FX and reference and explains partial debt without confirming booking',async()=>{
  const done=form();fill();fireEvent.click(screen.getByRole('button',{name:'Confirm'}));
  await waitFor(()=>expect(done).toHaveBeenCalledOnce());
  expect(mocks.invoke).toHaveBeenCalledWith('confirm-manual-payment',{body:expect.objectContaining({amount_rub_actual:1000,fx_rate_rub_per_thb:2,approved_total_thb:9500,receipt_reference:'synthetic-bank-document',proof_file_path:expect.stringMatching(new RegExp(`^${row.id}/`))})});
  expect(mocks.success).toHaveBeenCalledWith('Receipt recorded. Balance: 9000 THB');
 });
 it('preserves uploaded document on uncertain response and rejects missing acknowledgement',async()=>{
  mocks.invoke.mockResolvedValueOnce({data:null,error:null});const done=form();fill();
  fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await waitFor(()=>expect(mocks.error).toHaveBeenCalled());expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirm'}));await waitFor(()=>expect(done).toHaveBeenCalledOnce());expect(mocks.upload).toHaveBeenCalledOnce();
 });
});
