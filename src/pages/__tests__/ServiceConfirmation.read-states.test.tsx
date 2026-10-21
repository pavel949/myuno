import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ServiceOrderSuccess from '../services/ServiceOrderSuccess';
import WellnessOrderSuccess from '../wellness/WellnessOrderSuccess';
import EventSuccess from '../events/EventSuccess';
import MarketSuccess from '../market/MarketSuccess';
import FlowersSuccess from '../flowers/FlowersSuccess';
import TransferSuccess from '../transport/TransferSuccess';
import { rememberCheckoutReturnHint } from '@/hooks/useStripeUnifiedCheckout';
import { UnifiedSuccessLayout } from '@/components/orders/UnifiedSuccessLayout';

const state = vi.hoisted(() => ({ user: { id: 'actor-a' } as { id: string } | null, authLoading: false, language: 'en', read: vi.fn(), filters: [] as unknown[][], signals: [] as AbortSignal[], clearCart: vi.fn() }));
vi.mock('@/components/market/MarketAvailabilityGate', () => ({ withMarketAvailability: (Page: React.ComponentType) => Page }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ clearByType: state.clearCart }) }));
// Voice/audio decoration is outside the read-state contract; real Button
// keyboard/retry behavior is exercised by the synthetic browser fixture.
vi.mock('@/components/ui/button', () => ({ Button: ({ children, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type="button" onClick={onClick} disabled={disabled}>{children}</button> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isLoading: state.authLoading }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/contact/WhatsAppOrderContact', () => ({ WhatsAppOrderContact: () => <span>WhatsApp contact</span> }));
vi.mock('@/components/orders/CrossSellRecommendations', () => ({ CrossSellRecommendations: () => <aside>Recommendations</aside> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.filters.push(['from', table]);
  const chain = {
    select: (...args: unknown[]) => { state.filters.push(['select', ...args]); return chain; },
    eq: (...args: unknown[]) => { state.filters.push(['eq', ...args]); return chain; },
    in: (...args: unknown[]) => { state.filters.push(['in', ...args]); return chain; },
    filter: (...args: unknown[]) => { state.filters.push(['filter', ...args]); return chain; },
    abortSignal: (signal: AbortSignal) => { state.signals.push(signal); return chain; },
    maybeSingle: () => state.read(),
  };
  return chain;
} } }));

const row = (status = 'confirmed', number = 'ORDER-A') => ({ id: 'order-a', order_number: number, status, total_amount: 1200, currency: 'THB', created_at: '2026-10-21T07:00:00Z', metadata: { vertical: 'beauty' }, start_at: null });
const flush = () => act(async () => { await Promise.resolve(); });
const show = (Page: React.ComponentType, search = '?session_id=cs_synthetic') => render(<MemoryRouter initialEntries={[`/success${search}`]}><Page /></MemoryRouter>);
beforeEach(() => { vi.useFakeTimers(); state.user = { id: 'actor-a' }; state.authLoading = false; state.language = 'en'; state.read.mockReset().mockResolvedValue({ data: row(), error: null }); state.filters = []; state.signals = []; state.clearCart.mockClear(); window.sessionStorage.clear(); rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_synthetic', orderId: 'order-a' }); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

for (const [name, Page] of [['service', ServiceOrderSuccess], ['wellness', WellnessOrderSuccess], ['event', EventSuccess], ['market', MarketSuccess], ['flowers', FlowersSuccess], ['transfer', TransferSuccess]] as const) {
  describe(`${name} confirmation reads`, () => {
    it('uses actor-bound allowlisted reads and a persisted order status without claiming payment or capacity', async () => {
      show(Page); await flush();
      expect(screen.getByRole('heading', { name: 'Order status: confirmed.' })).toBeVisible();
      expect(screen.queryByText('Payment confirmed.')).not.toBeInTheDocument();
      expect(screen.queryByText(/Booking confirmed/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tickets confirmed|Details sent to your email|Driver will meet you|Seller prepares your order|We arrange delivery/)).not.toBeInTheDocument();
      expect(state.filters).toContainEqual(['eq', 'customer_user_id', 'actor-a']);
      expect(state.filters.filter(filter => filter[0] === 'select').every(filter => !String(filter[1]).includes('*'))).toBe(true);
      if (name === 'wellness') {
        expect(state.filters).toContainEqual(['eq', 'id', 'order-a']);
        expect(state.filters.some(filter => filter[0] === 'select' && String(filter[1]).includes('payment_intents'))).toBe(false);
        expect(state.filters).toContainEqual(['in', 'order_type', ['beauty', 'fitness', 'medical']]);
        expect(state.filters).not.toContainEqual(['eq', 'stripe_session_id', 'cs_synthetic']);
      }
    });
    it.each(['unknown', 'cancelled', 'refunded', null])('does not turn status %s into confirmation', async status => {
      state.read.mockResolvedValue({ data: row(status as string), error: null });
      show(Page); await flush();
      expect(screen.getByRole('heading', { name: status === 'cancelled' ? 'Order status: cancelled.' : status === 'refunded' ? 'Order status: refunded.' : 'Order status not verified.' })).toBeVisible();
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
      expect(screen.queryByText('Payment confirmed.')).not.toBeInTheDocument();
      expect(state.read).toHaveBeenCalledTimes(1);
    });
    it.each([['in_progress', 'Order status: in progress.'], ['completed', 'Order status: completed.']])('labels persisted %s as order state only', async (status, title) => {
      state.read.mockResolvedValue({ data: row(status), error: null }); show(Page); await flush();
      expect(screen.getByRole('heading', { name: title })).toBeVisible();
      expect(screen.queryByText(/Payment confirmed|Booking confirmed|Tickets confirmed|Details sent|Driver will meet/)).not.toBeInTheDocument();
    });
    it('rejects malformed successful responses without claiming confirmation', async () => {
      state.read.mockResolvedValue({ data: { status: 'confirmed' }, error: null });
      show(Page); await flush();
      expect(screen.getByRole('heading', { name: 'Could not check your order.' })).toBeVisible();
      expect(screen.queryByText('Order status: confirmed.')).not.toBeInTheDocument();
    });
    it('stops on a query error and permits explicit retry without exposing the database error', async () => {
      state.read.mockResolvedValueOnce({ data: null, error: { message: 'private database detail' } });
      show(Page); await flush();
      expect(screen.getByRole('heading', { name: 'Could not check your order.' })).toBeVisible();
      expect(screen.queryByText(/private database detail/)).not.toBeInTheDocument();
      expect(screen.queryByText('WhatsApp contact')).not.toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(state.read).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: 'Check again' })); await flush();
      expect(screen.getByRole('heading', { name: 'Order status: confirmed.' })).toBeVisible();
      expect(state.read).toHaveBeenCalledTimes(2);
    });
    it('bounds missing-row polling at ten attempts and keeps the result unverified', async () => {
      state.read.mockResolvedValue({ data: null, error: null });
      show(Page); await flush();
      await act(async () => { await vi.advanceTimersByTimeAsync(18000); });
      expect(state.read).toHaveBeenCalledTimes(10);
      expect(screen.getByRole('heading', { name: 'Order status not verified.' })).toBeVisible();
      await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
      expect(state.read).toHaveBeenCalledTimes(10);
    });
    it('keeps pending distinct and stops polling once the persisted status changes', async () => {
      state.read.mockResolvedValueOnce({ data: row('pending'), error: null });
      show(Page); await flush();
      expect(screen.getByRole('heading', { name: 'Order confirmation pending.' })).toBeVisible();
      await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
      expect(screen.getByRole('heading', { name: 'Order status: confirmed.' })).toBeVisible();
      await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
      expect(state.read).toHaveBeenCalledTimes(2);
    });
    it('aborts and clears scheduled polls on unmount', async () => {
      state.read.mockResolvedValue({ data: null, error: null });
      const view = show(Page); await flush(); view.unmount();
      expect(state.signals[0].aborted).toBe(true);
      await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
      expect(state.read).toHaveBeenCalledTimes(1);
    });
    it('turns a stalled read into an error and ignores its late response', async () => {
      let resolve!: (value: unknown) => void;
      state.read.mockReturnValue(new Promise(value => { resolve = value; }));
      show(Page); await flush();
      await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
      expect(state.signals[0].aborted).toBe(true);
      expect(screen.getByRole('heading', { name: 'Could not check your order.' })).toBeVisible();
      await act(async () => { resolve({ data: row(), error: null }); });
      expect(screen.queryByText('Order status: confirmed.')).not.toBeInTheDocument();
    });
    it('hides the previous actor immediately and rejects late responses across account changes', async () => {
      let resolve!: (value: unknown) => void;
      state.read.mockReturnValueOnce(new Promise(value => { resolve = value; })).mockResolvedValue({ data: row('confirmed', 'NEW-ACTOR'), error: null });
      const view = show(Page); await flush();
      state.user = { id: 'actor-b' };
      if (name !== 'service') rememberCheckoutReturnHint('actor-b', { sessionId: 'cs_synthetic', orderId: 'order-b' });
      view.rerender(<MemoryRouter initialEntries={['/success?session_id=cs_synthetic']}><Page /></MemoryRouter>); await flush();
      expect(state.signals[0].aborted).toBe(true);
      expect(state.filters).toContainEqual(['eq', 'customer_user_id', 'actor-b']);
      await act(async () => { resolve({ data: row('confirmed', 'OLD-ACTOR'), error: null }); });
      expect(screen.queryByText(/OLD-ACTOR/)).not.toBeInTheDocument();
      screen.getAllByText(/NEW-ACTOR/).forEach(element => expect(element).toBeVisible());
      state.user = null;
      view.rerender(<MemoryRouter><Page /></MemoryRouter>); await flush();
      expect(screen.queryByText(/NEW-ACTOR/)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Sign in to check your order.' })).toBeVisible();
    });
    it('does not query without a signed-in actor or a checkout reference', async () => {
      state.user = null; const view = show(Page); await flush();
      expect(state.read).not.toHaveBeenCalled(); view.unmount();
      state.user = { id: 'actor-a' }; show(Page, ''); await flush();
      expect(state.read).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Order status not verified.' })).toBeVisible();
    });
  });
}
it.each(['missing', 'wrong-actor', 'wrong-session', 'expired', 'storage-error'])('wellness %s navigation hint never broadens an order read', async variant => {
  window.sessionStorage.clear();
  if (variant !== 'missing') rememberCheckoutReturnHint(variant === 'wrong-actor' ? 'other-actor' : 'actor-a', {
    sessionId: variant === 'wrong-session' ? 'cs_other' : 'cs_synthetic', orderId: 'untrusted-order',
  }, variant === 'expired' ? Date.now() - 31 * 60 * 1000 : Date.now());
  const denied = variant === 'storage-error' ? vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage denied'); }) : undefined;
  try {
    show(WellnessOrderSuccess); await flush();
    expect(state.read).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Order status not verified.' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'My orders' })).toBeVisible();
  } finally { denied?.mockRestore(); }
});
it('wellness continues actor-scoped ID reads after webhook replaces cs_* with pi_*', async () => {
  // provider_ref is deliberately absent: its lifecycle does not identify the
  // return URL after webhook confirmation. The browser hint is only a selector.
  state.read.mockResolvedValueOnce({ data: row('pending'), error: null }).mockResolvedValue({ data: row('confirmed'), error: null });
  show(WellnessOrderSuccess); await flush();
  expect(screen.getByRole('heading', { name: 'Order confirmation pending.' })).toBeVisible();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.getByRole('heading', { name: 'Order status: confirmed.' })).toBeVisible();
  expect(state.filters.filter(filter => filter[0] === 'eq' && filter[1] === 'id')).toEqual([
    ['eq', 'id', 'order-a'], ['eq', 'id', 'order-a'],
  ]);
  expect(state.filters.filter(filter => filter[0] === 'eq' && filter[1] === 'customer_user_id')).toEqual([
    ['eq', 'customer_user_id', 'actor-a'], ['eq', 'customer_user_id', 'actor-a'],
  ]);
  expect(state.filters.some(filter => String(filter[1]).includes('provider_ref'))).toBe(false);
});
it('does not invent a wellness category or currency when the persisted row omits them', async () => {
  state.read.mockResolvedValue({ data: { ...row(), metadata: null, currency: null, total_amount: null }, error: null });
  show(WellnessOrderSuccess); await flush();
  expect(screen.queryByText('Category')).not.toBeInTheDocument();
  expect(screen.queryByText('Beauty & Spa')).not.toBeInTheDocument();
  expect(screen.queryByText('THB')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Browse services' })).toBeVisible();
});
it('keeps the shared layout unverified unless a caller supplies persisted evidence', () => {
  render(<MemoryRouter><UnifiedSuccessLayout primaryHref="/bookings" secondaryHref="/" /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Order status not verified.' })).toBeVisible();
});

it('does not treat a market order number in the URL as a receipt', async () => {
  state.read.mockResolvedValue({ data: null, error: null });
  show(MarketSuccess, '?order_number=FORGED-URL-RECEIPT'); await flush();
  expect(state.filters).toContainEqual(['eq', 'order_number', 'FORGED-URL-RECEIPT']);
  expect(state.filters).toContainEqual(['eq', 'customer_user_id', 'actor-a']);
  expect(state.filters).toContainEqual(['in', 'order_type', ['market']]);
  await act(async () => { await vi.advanceTimersByTimeAsync(18000); });
  expect(screen.queryByText(/FORGED-URL-RECEIPT/)).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Order status not verified.' })).toBeVisible();
});
it.each(['pending', 'unknown', 'cancelled'])('preserves the flowers cart for status %s', async status => {
  state.read.mockResolvedValue({ data: row(status), error: null });
  show(FlowersSuccess); await flush();
  expect(state.clearCart).not.toHaveBeenCalled();
});
it('clears flowers only once after a fresh owned confirmed order, not on return URL alone', async () => {
  show(FlowersSuccess); await flush();
  expect(state.clearCart).toHaveBeenCalledExactlyOnceWith('flowers');
});
