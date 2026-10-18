import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserTracking } from '../useUserTracking';
const from = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/property/search' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from, auth: {
  getUser: () => Promise.resolve({ data: { user: null } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
} } }));
const originalCrypto = globalThis.crypto;

describe('Analytics identifier security regression', () => {
  beforeEach(() => { sessionStorage.clear(); from.mockClear(); });
  afterEach(() => vi.unstubAllGlobals());
  it('uses cryptographic randomness for UUID v4 when randomUUID is unavailable', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => originalCrypto.getRandomValues(bytes));
    vi.stubGlobal('crypto', { getRandomValues });
    const first = renderHook(() => useUserTracking());
    expect(first.result.current.sessionId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(getRandomValues).toHaveBeenCalledOnce();
    first.unmount();
    sessionStorage.clear();
    const second = renderHook(() => useUserTracking());
    expect(second.result.current.sessionId).not.toBe(first.result.current.sessionId);
  });
  it('reuses the existing analytics session without regenerating identity', () => {
    sessionStorage.setItem('user_session_id', 'existing-session');
    const getRandomValues = vi.fn();
    vi.stubGlobal('crypto', { getRandomValues });
    const { result } = renderHook(() => useUserTracking());
    expect(result.current.sessionId).toBe('existing-session');
    expect(getRandomValues).not.toHaveBeenCalled();
  });
  it('does not turn an anonymous analytics identifier into authorized tracking writes', async () => {
    vi.stubGlobal('crypto', { getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto) });
    const { result } = renderHook(() => useUserTracking());
    await result.current.trackEvent('interaction', 'search');
    expect(from).not.toHaveBeenCalled();
  });
});
