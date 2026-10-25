import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  language: 'en',
  actor: '00000000-0000-4000-8000-000000000001' as string | null,
  read: vi.fn(), filters: [] as [string, unknown][],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.actor ? { id: state.actor } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const q = { select: () => q, eq: (k: string, v: unknown) => { state.filters.push([k, v]); return q; }, filter: (k: string,_operator: string,v: unknown) => { state.filters.push([k,v]); return q; }, is: () => q, maybeSingle: () => state.read() }; return q;
} } }));
import ServiceOrderSuccess from '../ServiceOrderSuccess';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const row = () => ({ id, customer_user_id: state.actor, order_number: 'SYNTHETIC-1', total_amount: 900, currency: 'USD', status: 'pending', start_at: null });
function NextOrder() { const navigate=useNavigate(); return <button onClick={()=>navigate('/services/order/success?order_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')}>Next receipt</button>; }
function Location() { const l = useLocation(); return <><output data-testid="location">{l.pathname+l.search+l.hash}</output><output data-testid="state">{JSON.stringify(l.state)}</output></>; }
const view = (entry: string | { pathname: string; state: unknown; search?: string; hash?: string } = '/services/order/success?order_id=' + id) => <MemoryRouter initialEntries={[entry]}><ServiceOrderSuccess /><Location /><NextOrder /></MemoryRouter>;
beforeEach(() => { state.language='en'; state.actor = '00000000-0000-4000-8000-000000000001'; state.filters = []; state.read.mockReset().mockResolvedValue({ data: row(), error: null }); });
describe('service receipt readback', () => {
  it('confirms the persisted owned record without claiming payment', async () => {
    render(view()); await screen.findByText('Order saved');
    expect(screen.getByText('USD 900')).toBeInTheDocument(); expect(screen.queryByText('Payment confirmed.')).toBeNull();
    expect(state.filters).toContainEqual(['customer_user_id', state.actor]); expect(state.filters).toContainEqual(['id', id]);
  });
  it.each([{ data: null, error: null }, { data: null, error: new Error('offline') }])('does not present an absent or failed receipt as success', async reply => {
    state.read.mockResolvedValue(reply); render(view()); await screen.findByText('Result not confirmed');
    expect(screen.queryByText('Order saved')).toBeNull(); expect(screen.getByRole('button', { name: 'Check again' })).toBeEnabled();
  });
  it('retries the same ID after an unconfirmed result', async () => {
    state.read.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: row(), error: null });
    render(view()); const button = await screen.findByRole('button', { name: 'Check again' });
    await act(async () => button.click()); await screen.findByText('Order saved'); expect(state.read).toHaveBeenCalledTimes(2);
  });
  it('persists router-state identity into the URL for reload', async () => {
    render(view({ pathname: '/services/order/success', state: { orderId: id } }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('order_id=' + id));
  });
  it('does not read for a guest or a malformed identifier', async () => {
    state.actor = null; render(view()); await screen.findByText('Result not confirmed'); expect(state.read).not.toHaveBeenCalled();
  });
  it('ignores a prior actor response after account switch', async () => {
    let complete!: (r: unknown) => void; const prior = row();
    state.read.mockImplementationOnce(() => new Promise(r => { complete = r; })).mockResolvedValue({ data: null, error: null });
    const { rerender } = render(view()); await waitFor(() => expect(complete).toBeTypeOf('function'));
    state.actor = '00000000-0000-4000-8000-000000000099'; rerender(view());
    await act(async () => complete({ data: prior, error: null })); await screen.findByText('Result not confirmed');
    expect(screen.queryByText('Order saved')).toBeNull();
  });
  it.each(['url','state'])('accepts uppercase UUID in %s and preserves canonical row identity',async via=>{
    render(view(via==='url'?'/services/order/success?order_id='+id.toUpperCase():{pathname:'/services/order/success',state:{orderId:id.toUpperCase()}}));
    await screen.findByText('Order saved');expect(state.filters).toContainEqual(['id',id]);
  });
  it('retains query, hash and router state while promoting a state-only identifier',async()=>{
    const nav={orderId:id.toUpperCase(),origin:'synthetic'};
    render(view({pathname:'/services/order/success',search:'?source=agent',hash:'#receipt',state:nav}));
    await waitFor(()=>expect(screen.getByTestId('location')).toHaveTextContent('order_id='+id+'#receipt'));
    expect(screen.getByTestId('location')).toHaveTextContent('source=agent');expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual(nav);
    await screen.findByText('Order saved');
  });
  it('checks a session-based receipt using the same customer scope',async()=>{
    render(view('/services/order/success?session_id=cs_synthetic'));
    await screen.findByText('Order saved');expect(state.filters).toContainEqual(['metadata->>stripe_session_id','cs_synthetic']);expect(state.filters).toContainEqual(['customer_user_id',state.actor]);
  });
  it('makes no read for a malformed order identifier',async()=>{
    render(view('/services/order/success?order_id=invalid'));
    await screen.findByText('Result not confirmed');expect(state.read).not.toHaveBeenCalled();
  });

  it('ignores a late prior-order result after navigating to another receipt',async()=>{
    let complete!:(value:unknown)=>void;const prior=row();
    state.read.mockImplementationOnce(()=>new Promise(r=>{complete=r;})).mockResolvedValue({data:{...row(),id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',order_number:'SECOND'},error:null});
    render(view());await waitFor(()=>expect(complete).toBeTypeOf('function'));
    await act(async()=>screen.getByRole('button',{name:'Next receipt'}).click());await screen.findByText('Order number: SECOND');
    await act(async()=>complete({data:prior,error:null}));expect(screen.getByText('Order number: SECOND')).toBeVisible();expect(screen.queryByText('Order number: SYNTHETIC-1')).toBeNull();
  });

  it('presents a saved record with nullable status as unknown, never invented pending',async()=>{
    state.read.mockResolvedValue({data:{...row(),status:null},error:null});render(view());await screen.findByText('Order saved');
    expect(screen.getByText('Status: Unavailable')).toBeVisible();expect(screen.queryByText('Status: pending')).toBeNull();
  });
  it.each([['en','Price, time and provider require confirmation after you submit your request.'],['ru','Цена, время и исполнитель требуют подтверждения после отправки заявки.'],['th','ราคา เวลา และผู้ให้บริการต้องได้รับการยืนยันหลังจากส่งคำขอ']])('retains the factual price/time/provider note in %s',async(language,note)=>{
    state.language=language;render(view());expect(await screen.findByText(note)).toBeVisible();
  });

});
