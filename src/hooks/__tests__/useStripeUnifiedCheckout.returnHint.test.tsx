import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKOUT_RETURN_HINT_TTL_MS, readCheckoutReturnHint, rememberCheckoutReturnHint, useStripeUnifiedCheckout } from '../useStripeUnifiedCheckout';

const transport = vi.hoisted(() => ({ getSession: vi.fn(), invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: transport.getSession }, functions: { invoke: transport.invoke } } }));
vi.mock('@/lib/errorHandler', () => ({ createErrorHandler: () => ({ error: vi.fn() }), errorHandler: { auth: vi.fn() } }));
beforeEach(() => {
  window.sessionStorage.clear(); window.history.replaceState({}, '', '/');
  transport.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: 'actor-a' } } } });
  transport.invoke.mockReset().mockResolvedValue({ data: { url: '#synthetic-checkout', sessionId: 'cs_return', orderId: 'order-a' }, error: null });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('bounded checkout navigation hints, never payment authority', () => {
  it('returns only the exact actor/session-bound server order selector within its TTL', () => {
    rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_return', orderId: 'order-a' }, 1000);
    expect(readCheckoutReturnHint('actor-a', 'cs_return', 1001)).toBe('order-a');
    expect(readCheckoutReturnHint('actor-a', 'cs_return', 1000 + CHECKOUT_RETURN_HINT_TTL_MS)).toBe('order-a');
    expect(readCheckoutReturnHint('actor-a', 'cs_return', 1001 + CHECKOUT_RETURN_HINT_TTL_MS)).toBeUndefined();
    expect(readCheckoutReturnHint('actor-a', 'cs_return', 999)).toBeUndefined();
    expect(readCheckoutReturnHint('actor-b', 'cs_return', 1001)).toBeUndefined();
    expect(readCheckoutReturnHint('actor-a', 'cs_other', 1001)).toBeUndefined();
    expect(readCheckoutReturnHint(undefined, 'cs_return', 1001)).toBeUndefined();
  });
  it.each([{}, { sessionId: 'cs_return' }, { sessionId: '', orderId: 'order-a' }, { sessionId: 'cs_return', orderId: 42 }])('does not manufacture identifiers from incomplete data %#', response => {
    rememberCheckoutReturnHint('actor-a', response);
    expect(window.sessionStorage.length).toBe(0);
    expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBeUndefined();
  });
  it('fails closed on absent, malformed or oversized storage evidence', () => {
    expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBeUndefined();
    rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_return', orderId: 'order-a' });
    const key = window.sessionStorage.key(0)!;
    for (const raw of ['{broken', '{}', 'x'.repeat(4097)]) {
      window.sessionStorage.setItem(key, raw);
      expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBeUndefined();
    }
  });
  it('keeps a single bounded hint instead of accumulating checkout history', () => {
    rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_return', orderId: 'order-a' });
    rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_next', orderId: 'order-b' });
    expect(window.sessionStorage.length).toBe(1);
    expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBeUndefined();
    expect(readCheckoutReturnHint('actor-a', 'cs_next')).toBe('order-b');
  });
  it('tolerates blocked storage without returning a selector', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => rememberCheckoutReturnHint('actor-a', { sessionId: 'cs_return', orderId: 'order-a' })).not.toThrow();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBeUndefined();
  });
  it('actual checkout hook stores explicit response IDs before redirect without parsing the URL', async () => {
    const { result } = renderHook(() => useStripeUnifiedCheckout());
    await act(async () => { expect(await result.current.createCheckout('create-wellness-checkout', { synthetic: true })).toBe(true); });
    expect(transport.invoke).toHaveBeenCalledWith('create-wellness-checkout', { body: { synthetic: true } });
    expect(readCheckoutReturnHint('actor-a', 'cs_return')).toBe('order-a');
    expect(window.location.hash).toBe('#synthetic-checkout');
  });
  it('does not parse apparent IDs from a checkout URL when explicit IDs are absent', async () => {
    transport.invoke.mockResolvedValue({ data: { url: '#session_id=cs_return&order_id=forged' }, error: null });
    const { result } = renderHook(() => useStripeUnifiedCheckout());
    await act(async () => { expect(await result.current.createCheckout('create-wellness-checkout', {})).toBe(true); });
    expect(window.sessionStorage.length).toBe(0);
  });
  it('does not fail an already-created checkout when hint storage is denied', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    const { result } = renderHook(() => useStripeUnifiedCheckout());
    await act(async () => { expect(await result.current.createCheckout('create-wellness-checkout', {})).toBe(true); });
    expect(window.location.hash).toBe('#synthetic-checkout');
  });
});
