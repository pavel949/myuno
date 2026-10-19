import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyPersonaOrder, normalizePersonas, useUserPersonas } from '../useUserPersonas';

const mocks = vi.hoisted(() => ({ language: 'ru', user: null as { id: string } | null, from: vi.fn(), getUser: vi.fn(), writes: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from, auth: { getUser: mocks.getUser } } }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => {
  localStorage.clear(); mocks.language = 'ru'; mocks.user = null; mocks.writes.mockReset(); mocks.error.mockReset(); mocks.getUser.mockReset();
  mocks.from.mockReset().mockImplementation(() => {
    const query = new Proxy({}, { get: (_, method) => method === 'then'
      ? (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [{ persona: 'tourist' }, { persona: 'pet_owner' }], error: null }).then(resolve)
      : () => { if (['delete', 'insert', 'upsert', 'update'].includes(String(method))) mocks.writes(); return query; } });
    return query;
  });
});
describe('display order is not role membership', () => {
  it('validates and deduplicates stored values', () => {
    expect(normalizePersonas(['pet_owner', 'admin', 'pet_owner', null, 'tourist'])).toEqual(['pet_owner', 'tourist']);
    expect(normalizePersonas({ tourist: true })).toEqual([]);
  });
  it('never adds memberships from storage or reorder input', () => {
    expect(applyPersonaOrder(['tourist', 'pet_owner'], ['investor', 'pet_owner'])).toEqual(['pet_owner', 'tourist']);
  });
  it('keeps guest chosen priority across a remount and another hook instance', () => {
    const first = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    const second = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    act(() => first.result.current.setPersonas(['pet_owner', 'tourist']));
    expect(second.result.current.personas).toEqual(['pet_owner', 'tourist']);
    first.unmount(); second.unmount();
    const restored = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    expect(restored.result.current.personas).toEqual(['pet_owner', 'tourist']);
  });
  it('saves authenticated order on this device without DB writes', async () => {
    mocks.user = { id: 'a' };
    const { result, unmount } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.personas).toHaveLength(2));
    act(() => result.current.setPersonas(['pet_owner', 'tourist']));
    expect(result.current.personas).toEqual(['pet_owner', 'tourist']);
    expect(JSON.parse(localStorage.getItem('myuno-persona-order:a')!)).toEqual(['pet_owner', 'tourist']);
    expect(mocks.writes).not.toHaveBeenCalled();
    unmount();
    const restored = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(restored.result.current.personas).toEqual(['pet_owner', 'tourist']));
  });
  it('isolates account order across logout and login', async () => {
    mocks.user = { id: 'a' };
    localStorage.setItem('myuno-persona-order:a', JSON.stringify(['pet_owner', 'tourist']));
    const { result, rerender } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.personas).toEqual(['pet_owner', 'tourist']));
    mocks.user = null; rerender();
    expect(result.current.personas).toEqual([]);
    mocks.user = { id: 'b' }; rerender();
    await waitFor(() => expect(result.current.personas).toEqual(['tourist', 'pet_owner']));
    mocks.user = { id: 'a' }; rerender();
    await waitFor(() => expect(result.current.personas).toEqual(['pet_owner', 'tourist']));
  });
  it('handles unavailable storage and keeps the session usable', async () => {
    mocks.user = { id: 'a' };
    const { result } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.personas).toHaveLength(2));
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      act(() => result.current.setPersonas(['pet_owner', 'tourist']));
      expect(result.current.personas).toEqual(['pet_owner', 'tourist']);
      expect(mocks.error).toHaveBeenCalled();
      expect(mocks.writes).not.toHaveBeenCalled();
    } finally { storage.mockRestore(); }
  });
});

describe('existing preference membership writes', () => {
  it('continues to toggle selected interests through user_personas only', async () => {
    mocks.user = { id: 'a' };
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'a' } }, error: null });
    const { result } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.personas).toHaveLength(2));
    act(() => result.current.togglePersona('family'));
    await waitFor(() => expect(mocks.writes).toHaveBeenCalledOnce());
    expect(mocks.from.mock.calls.every(([table]) => table === 'user_personas')).toBe(true);
  });
  it('waits for account membership before considering guest migration', async () => {
    mocks.user = { id: 'a' };
    localStorage.setItem('myuno-guest-personas', JSON.stringify(['family']));
    let finish!: (value: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    mocks.from.mockImplementation(() => {
      const query = new Proxy({}, { get: (_, method) => method === 'then'
        ? pending.then.bind(pending)
        : () => { if (['delete', 'insert', 'upsert', 'update'].includes(String(method))) mocks.writes(); return query; } });
      return query;
    });
    const { result } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    expect(result.current.isLoading).toBe(true);
    expect(mocks.writes).not.toHaveBeenCalled();
    await act(async () => finish({ data: [{ persona: 'tourist' }], error: null }));
    await waitFor(() => expect(result.current.personas).toEqual(['tourist']));
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(localStorage.getItem('myuno-guest-personas')).toBeNull();
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(finish => { resolve = finish; });
  return { promise, resolve };
}

describe('in-flight account isolation', () => {
  it('rejects a toggle when the live auth lookup returns another account', async () => {
    mocks.user = { id: 'a' };
    const auth = deferred<{ data: { user: { id: string } }; error: null }>();
    mocks.getUser.mockReturnValue(auth.promise);
    localStorage.setItem('myuno-persona-order:a', JSON.stringify(['pet_owner', 'tourist']));
    const { result, rerender } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.personas).toEqual(['pet_owner', 'tourist']));
    act(() => result.current.togglePersona('family'));
    await waitFor(() => expect(mocks.getUser).toHaveBeenCalledOnce());
    mocks.user = { id: 'b' }; rerender();
    await waitFor(() => expect(result.current.personas).toEqual(['tourist', 'pet_owner']));
    await act(async () => auth.resolve({ data: { user: { id: 'b' } }, error: null }));
    await waitFor(() => expect(result.current.isToggling).toBe(false));
    expect(mocks.writes).not.toHaveBeenCalled();
    expect(localStorage.getItem('myuno-persona-order:b')).toBeNull();
    expect(JSON.parse(localStorage.getItem('myuno-persona-order:a')!)).toEqual(['pet_owner', 'tourist']);
    expect(result.current.personas).toEqual(['tourist', 'pet_owner']);
  });
  it('rolls back failed optimistic removal without losing the saved priority', async () => {
    mocks.user = { id: 'a' };
    localStorage.setItem('myuno-persona-order:a', JSON.stringify(['pet_owner', 'tourist']));
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { result } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
      await waitFor(() => expect(result.current.personas).toEqual(['pet_owner', 'tourist']));
      act(() => result.current.togglePersona('pet_owner'));
      await waitFor(() => expect(mocks.error).toHaveBeenCalled());
      expect(result.current.personas).toEqual(['pet_owner', 'tourist']);
      expect(JSON.parse(localStorage.getItem('myuno-persona-order:a')!)).toEqual(['pet_owner', 'tourist']);
      expect(mocks.writes).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
  it('keeps late guest migration completion bound to its initiating account', async () => {
    mocks.user = { id: 'a' };
    localStorage.setItem('myuno-guest-personas', JSON.stringify(['family', 'pet_owner']));
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'a' } }, error: null });
    const write = deferred<{ data: null; error: null }>();
    mocks.from.mockImplementation(() => {
      let userId = ''; let writing = false;
      const query = new Proxy({}, { get: (_, method) => {
        if (method === 'then') {
          const result = writing ? write.promise : Promise.resolve({ data: userId === 'a' ? [] : [{ persona: 'tourist' }], error: null });
          return result.then.bind(result);
        }
        return (...args: unknown[]) => {
          if (method === 'eq' && args[0] === 'user_id') userId = String(args[1]);
          if (method === 'upsert') { writing = true; mocks.writes(args[0]); }
          return query;
        };
      } });
      return query;
    });
    const { result, rerender } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
    await waitFor(() => expect(mocks.writes).toHaveBeenCalledOnce());
    expect(mocks.writes.mock.calls[0][0]).toEqual([
      { user_id: 'a', persona: 'family', is_active: true },
      { user_id: 'a', persona: 'pet_owner', is_active: true },
    ]);
    mocks.user = { id: 'b' }; rerender();
    await waitFor(() => expect(result.current.personas).toEqual(['tourist']));
    await act(async () => write.resolve({ data: null, error: null }));
    await waitFor(() => expect(result.current.isSetting).toBe(false));
    expect(localStorage.getItem('myuno-persona-order:b')).toBeNull();
    expect(JSON.parse(localStorage.getItem('myuno-persona-order:a')!)).toEqual(['family', 'pet_owner']);
    expect(result.current.personas).toEqual(['tourist']);
    expect(mocks.writes).toHaveBeenCalledOnce();
  });
});


it.each([
  ['en', 'Order changed for this session. It could not be saved on this device.'],
  ['th', 'เปลี่ยนลำดับสำหรับครั้งนี้แล้ว แต่ไม่สามารถบันทึกไว้บนอุปกรณ์นี้ได้'],
])('localizes blocked device storage feedback in %s', async (language, message) => {
  mocks.language = language;
  mocks.user = { id: 'a' };
  const { result } = renderHook(() => useUserPersonas(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.personas).toHaveLength(2));
  const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  try {
    act(() => result.current.setPersonas(['pet_owner', 'tourist']));
    expect(mocks.error).toHaveBeenCalledWith(message);
    expect(result.current.personas).toEqual(['pet_owner', 'tourist']);
    expect(mocks.writes).not.toHaveBeenCalled();
  } finally { storage.mockRestore(); }
});
