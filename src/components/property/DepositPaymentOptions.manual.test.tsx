import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DepositPaymentOptions, type DepositPaymentOptionsHandle } from './DepositPaymentOptions';
const mocks=vi.hoisted(()=>({request:vi.fn(),navigate:vi.fn(),rpc:vi.fn(),invoke:vi.fn(),success:vi.fn(),error:vi.fn()}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/contexts/CurrencyContext',()=>({useCurrency:()=>({formatPrice:(n:number)=>String(n)})}));
vi.mock('@/hooks/useLastPaymentMethod',()=>({useLastPaymentMethod:()=>({method:'rub_manual',setMethod:vi.fn()})}));
vi.mock('@/hooks/useRubEstimate',()=>({useRubEstimate:()=>({amountRub:19000})}));
vi.mock('@/lib/manualPaymentIntake',()=>({requestManualPropertyPayment:mocks.request}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc,functions:{invoke:mocks.invoke}}}));
vi.mock('react-router-dom',()=>({useNavigate:()=>mocks.navigate}));
vi.mock('./PaymentMethodPicker',()=>({PaymentMethodPicker:()=>null}));
vi.mock('./ContactAdminButton',()=>({ContactAdminButton:()=>null}));
vi.mock('sonner',()=>({toast:{success:mocks.success,error:mocks.error}}));
const props={propertyId:'synthetic-property',propertyTitle:'Synthetic',checkIn:new Date(2031,0,10),checkOut:new Date(2031,0,13),guests:2,nights:3,totalAmount:9500,guestName:'First Guest',guestPhone:'',guestEmail:''};
beforeEach(()=>{vi.clearAllMocks();mocks.request.mockResolvedValue({success:true,order_id:'synthetic-order',request_id:'synthetic-request'});});
describe('manual RUB checkout selection',()=>{
 it('submits through the atomic server request with latest guest fields, not a browser order writer',async()=>{
  const ref=React.createRef<DepositPaymentOptionsHandle>();const page=render(<DepositPaymentOptions {...props} ref={ref}/>);
  page.rerender(<DepositPaymentOptions {...props} guestName="Updated Guest" ref={ref}/>);
  await act(async()=>{expect(await ref.current!.submit()).toBe(true);});
  expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({guest_name:'Updated Guest',total_amount:9500,check_in:'2031-01-10',check_out:'2031-01-13'}));
  expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.invoke).not.toHaveBeenCalled();expect(mocks.navigate).toHaveBeenCalledWith('/property/booking/manual-payment/synthetic-order',{replace:true});
 });
 it('does not navigate or announce success without a committed request acknowledgement',async()=>{
  mocks.request.mockRejectedValue(new Error('synthetic unavailable writer'));const ref=React.createRef<DepositPaymentOptionsHandle>();render(<DepositPaymentOptions {...props} ref={ref}/>);
  await act(async()=>{expect(await ref.current!.submit()).toBe(false);});expect(mocks.navigate).not.toHaveBeenCalled();expect(mocks.success).not.toHaveBeenCalled();expect(mocks.error).toHaveBeenCalled();
 });
});
