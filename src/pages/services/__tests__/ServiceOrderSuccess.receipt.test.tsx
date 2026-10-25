import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  actor: '00000000-0000-4000-8000-000000000001' as string | null,
  read: vi.fn(), filters: [] as [string, unknown][],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.actor ? { id: state.actor } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const q = { select: () => q, eq: (k: string, v: unknown) => { state.filters.push([k, v]); return q; }, filter: () => q, is: () => q, maybeSingle: () => state.read() }; return q;
} } }));
import ServiceOrderSuccess from '../ServiceOrderSuccess';
const id = '00000000-0000-4000-8000-000000000002';
const row = () => ({ id, customer_user_id: state.actor, order_number: 'SYNTHETIC-1', total_amount: 900, currency: 'USD', status: 'pending', start_at: null });
function Location() { const l = useLocation(); return <output data-testid="location">{l.search}</output>; }
const view = (entry: string | { pathname: string; state: unknown } = '/services/order/success?order_id=' + id) => <MemoryRouter initialEntries={[entry]}><ServiceOrderSuccess /><Location /></MemoryRouter>;
beforeEach(() => { state.actor = '00000000-0000-4000-8000-000000000001'; state.filters = []; state.read.mockReset().mockResolvedValue({ data: row(), error: null }); });
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
});
