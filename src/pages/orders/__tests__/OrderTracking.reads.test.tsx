import { cleanup,render,screen,fireEvent } from '@testing-library/react';
import { MemoryRouter,Routes,Route } from 'react-router-dom';
import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import OrderTracking from '../OrderTracking';
const s=vi.hoisted(()=>({order:null as unknown,isLoading:false,error:null as unknown,timelineError:null as unknown,refetch:vi.fn(),retryTimeline:vi.fn(),lastId:'', reviewHook:vi.fn(), reviewWrite:vi.fn()}));
vi.mock('@/hooks/useOrderTracking',()=>({useOrderTracking:(id:string)=>{s.lastId=id;return ({...s,timeline:[],timelineLoading:false,getProgressPercentage:()=>25,isStatusCompleted:()=>false,STATUS_SEQUENCE:['pending','confirmed','in_progress','completed']});}}));
vi.mock('@/contexts/LanguageContext',()=>({useLanguage:()=>({language:'en'})}));
vi.mock('@/components/layout/AppLayout',()=>({AppLayout:({children}:{children:React.ReactNode})=><main>{children}</main>}));
vi.mock('@/hooks/useReviews', () => ({ useCreateReview: () => { s.reviewHook(); return { createReview: s.reviewWrite, isSubmitting: false }; } }));
vi.mock('@/components/orders/CrossSellRecommendations',()=>({CrossSellRecommendations:()=>null}));
vi.mock('@/components/uno/PageHeader',()=>({PageHeader:()=> <h1>Order tracking</h1>}));
afterEach(cleanup);beforeEach(()=>{s.order=null;s.error=null;s.timelineError=null;s.isLoading=false;vi.clearAllMocks();});
const show=()=>render(<MemoryRouter initialEntries={['/orders/order-a/tracking']}><Routes><Route path='/orders/:id/tracking' element={<OrderTracking/>}/></Routes></MemoryRouter>);
it('distinguishes error/retry from an unavailable or unauthorized row',()=>{s.error=Error('synthetic');show();expect(screen.getByRole('alert')).toHaveTextContent('Could not load');expect(screen.queryByText('Order not found')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(s.refetch).toHaveBeenCalledOnce();});
it('does not leak row existence when unavailable',()=>{show();expect(screen.getByText('The order may have been deleted or you don\'t have access')).toBeVisible();});
it('renders a read-only property commercial order with preserved amounts and failed timeline retry',()=>{s.order={id:'order-a',order_number:'PROP-1',order_type:'property',status:'pending',total_amount:7500,currency:'THB',order_items:[{id:'item-a',item_name:'Synthetic home',qty:1,amount:7500}],order_addresses:[]};s.timelineError=Error('denied');show();expect(s.lastId).toBe('order-a');expect(screen.getByRole('link',{name:'My requests'})).toHaveAttribute('href','/me/requests');expect(screen.getByText(/Synthetic home/)).toBeVisible();expect(screen.getAllByText('7,500 THB').length).toBeGreaterThan(0);fireEvent.click(screen.getByRole('button',{name:'Retry'}));expect(s.retryTimeline).toHaveBeenCalledOnce();});

it('keeps a legacy property item readable when order_type is missing, without generic fulfilment progress',()=>{s.order={id:'order-a',order_number:'PROP-1',order_type:null,status:'pending',total_amount:7500,currency:'THB',order_items:[{id:'item-a',item_type:'property',item_name:'Synthetic home',qty:1,amount:7500}],order_addresses:[]};show();expect(screen.getByRole('heading',{name:'Property booking'})).toBeVisible();expect(screen.getByRole('link',{name:'My requests'})).toHaveAttribute('href','/me/requests');expect(screen.queryByRole('progressbar')).toBeNull();});

const propertyOrder = (status: string, legacy = false) => ({
  id: 'property-order', order_number: 'PROP-1', order_type: legacy ? null : 'property',
  status, total_amount: 7500, currency: 'THB', provider_org_id: 'provider-not-property',
  order_items: [{ id: 'line-item', item_type: 'property', resource_id: 'property-resource', item_name: 'Synthetic home', qty: 1, amount: 7500 }],
  order_addresses: [],
});
it.each([
  ['pending_deposit', 'Awaiting Deposit'], ['deposit_paid', 'Deposit Paid'],
  ['confirmed', 'Confirmed'], ['checked_in', 'Checked In'], ['checked_out', 'Checked Out'],
  ['completed', 'Completed'], ['no_show', 'No Show'], ['future_status', 'Status unknown'],
])('shows stored property status %s without inventing generic service progress', (value, label) => {
  s.order = propertyOrder(value);
  show();
  expect(screen.getByText(label, { exact: true })).toBeVisible();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(s.reviewHook).not.toHaveBeenCalled();
  expect(s.reviewWrite).not.toHaveBeenCalled();
});
it.each([false, true])('keeps completed property detail read-only (legacy item: %s)', legacy => {
  s.order = propertyOrder('completed', legacy);
  show();
  expect(screen.getByRole('heading', { name: 'Property booking' })).toBeVisible();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(s.reviewHook).not.toHaveBeenCalled();
  expect(s.reviewWrite).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'My requests' })).toHaveAttribute('href', '/me/requests');
});
it('retains the existing generic service progress for its supported sequence', () => {
  s.order = { ...propertyOrder('pending'), order_type: 'service', order_items: [] };
  show();
  expect(screen.getByRole('progressbar', { name: 'Order status' })).toHaveAttribute('aria-valuenow', '25');
});

it.each([null, 'future_vertical', 'mixed'])('keeps completed ambiguous kind %s read-only rather than inventing a review target', kind => {
  s.order = { ...propertyOrder('completed', true), order_type: kind, order_items: [] };
  show();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(s.reviewHook).not.toHaveBeenCalled();
  expect(s.reviewWrite).not.toHaveBeenCalled();
});

it('does not silently remove the existing known non-property review UI', () => {
  s.order = { ...propertyOrder('completed'), order_type: 'service', order_items: [] };
  show();
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(s.reviewHook).toHaveBeenCalled();
  expect(s.reviewWrite).not.toHaveBeenCalled();
});
