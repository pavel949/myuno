import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkSearchPropertyAvailability, createAvailabilityLimiter, SEARCH_AVAILABILITY_TIMEOUT_MS, useSearchPropertyAvailability } from '../useSearchPropertyAvailability';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: (...args: unknown[]) => ({ abortSignal: (signal: AbortSignal) => rpc(...args, signal) }) } }));
const from = '2026-11-20';
const to = '2026-11-25';
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
const deferred = () => {
  let resolve!: (value: unknown) => void;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
beforeEach(() => { rpc.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

describe('public search calendar checks', () => {
  it.each(['booked', 'blocked'])('excludes %s occupied nights', async kind => {
    rpc.mockResolvedValue({ data: [{ date: from, kind }], error: null });
    expect(await checkSearchPropertyAvailability('home', from, to)).toBe(false);
    expect(rpc).toHaveBeenCalledWith('get_property_unavailable_dates', { p_property_id: 'home', p_from: from, p_to: to }, expect.any(AbortSignal));
  });
  it('allows checkout-only arrival and ignores occupancy starting on departure', async () => {
    rpc.mockResolvedValue({ data: [{ date: from, kind: 'checkout_only' }, { date: to, kind: 'booked' }], error: null });
    expect(await checkSearchPropertyAvailability('home', from, to)).toBe(true);
  });
  it.each([null, [{ date: from, kind: 'unknown' }]])('rejects malformed responses', async data => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(checkSearchPropertyAvailability('home', from, to)).rejects.toThrow();
  });
  it('does not query without a valid complete date interval', () => {
    const { result } = renderHook(() => useSearchPropertyAvailability(['home'], to, from), { wrapper: wrapper() });
    expect(result.current.enabled).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('hides pending checks and only returns successful free homes', async () => {
    const pending = deferred();
    rpc.mockImplementation((_name, args) => args.p_property_id === 'free' ? Promise.resolve({ data: [], error: null }) : pending.promise);
    const { result } = renderHook(() => useSearchPropertyAvailability(['free', 'busy'], from, to), { wrapper: wrapper() });
    expect(result.current.availableIds.size).toBe(0);
    expect(result.current.pending).toBe(true);
    await waitFor(() => expect(result.current.availableIds.has('free')).toBe(true));
    await act(async () => pending.resolve({ data: [{ date: from, kind: 'blocked' }], error: null }));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect([...result.current.availableIds]).toEqual(['free']);
  });
  it('fails closed on RPC error and supports explicit retry', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('Unavailable') });
    const { result } = renderHook(() => useSearchPropertyAvailability(['home'], from, to), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.failed).toBe(true), { timeout: 2500 });
    expect(result.current.availableIds.size).toBe(0);
    rpc.mockResolvedValue({ data: [], error: null });
    await act(async () => { await result.current.retry(); });
    await waitFor(() => expect(result.current.availableIds.has('home')).toBe(true));
  });
  it('times out a hung request and aborts its transport', async () => {
    vi.useFakeTimers();
    rpc.mockReturnValue(new Promise(() => undefined));
    const result = checkSearchPropertyAvailability('home', from, to);
    const assertion = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(SEARCH_AVAILABILITY_TIMEOUT_MS);
    await assertion;
    expect(rpc.mock.calls[0][2].aborted).toBe(true);
  });
  it('limits concurrent requests and cancels queued work before it starts', async () => {
    const schedule = createAvailabilityLimiter(2);
    const first = deferred(); const second = deferred();
    const task = vi.fn(() => Promise.resolve(true));
    const one = schedule(() => first.promise);
    const two = schedule(() => second.promise);
    const controller = new AbortController();
    const queued = schedule(task, controller.signal);
    const rejected = expect(queued).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve();
    expect(task).not.toHaveBeenCalled();
    controller.abort();
    await rejected;
    first.resolve(true); second.resolve(true);
    await Promise.all([one, two]);
    expect(task).not.toHaveBeenCalled();
  });
  it('releases a slot on abort even when transport ignores cancellation', async () => {
    rpc.mockReturnValue(new Promise(() => undefined));
    const schedule = createAvailabilityLimiter(1);
    const controller = new AbortController();
    const hung = schedule(() => checkSearchPropertyAvailability('home', from, to, controller.signal), controller.signal);
    const assertion = expect(hung).rejects.toMatchObject({ name: 'AbortError' });
    const next = vi.fn(async () => true);
    const queued = schedule(next);
    await Promise.resolve(); await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    controller.abort();
    await assertion;
    expect(await queued).toBe(true);
    expect(next).toHaveBeenCalledOnce();
  });
  it('turns a hung hook check into a retry-visible failure after bounded retries', async () => {
    vi.useFakeTimers();
    rpc.mockReturnValue(new Promise(() => undefined));
    const { result, unmount } = renderHook(() => useSearchPropertyAvailability(['home'], from, to), { wrapper: wrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(22_000); });
    expect(result.current.failed).toBe(true);
    expect(result.current.pending).toBe(false);
    expect(result.current.availableIds.size).toBe(0);
    unmount();
  });
  it('aborts in-flight transport on unmount', async () => {
    rpc.mockReturnValue(new Promise(() => undefined));
    const { unmount } = renderHook(() => useSearchPropertyAvailability(['home'], from, to), { wrapper: wrapper() });
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    const signal = rpc.mock.calls[0][2];
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it('checks newly loaded candidates without losing checked results and disables on reset', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { result, rerender } = renderHook(({ ids, end }: { ids: string[]; end?: string }) => useSearchPropertyAvailability(ids, from, end), { initialProps: { ids: ['one'], end: to }, wrapper: wrapper() });
    await waitFor(() => expect(result.current.availableIds.has('one')).toBe(true));
    rerender({ ids: ['one', 'two'], end: to });
    await waitFor(() => expect([...result.current.availableIds]).toEqual(['one', 'two']));
    expect(rpc).toHaveBeenCalledTimes(2);
    rerender({ ids: ['one', 'two'], end: undefined });
    expect(result.current.enabled).toBe(false);
    expect(result.current.pending).toBe(false);
  });
  it('keys responses by date snapshot so late old results cannot become current matches', async () => {
    const old = deferred();
    const current = deferred();
    rpc.mockImplementation((_name, args) => args.p_from === from ? old.promise : current.promise);
    const { result, rerender } = renderHook(({ start }) => useSearchPropertyAvailability(['home'], start, to), { initialProps: { start: from }, wrapper: wrapper() });
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
    const oldSignal = rpc.mock.calls[0][2];
    rerender({ start: '2026-11-21' });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => old.resolve({ data: [], error: null }));
    expect(result.current.availableIds.size).toBe(0);
    expect(result.current.pending).toBe(true);
    await act(async () => current.resolve({ data: [{ date: '2026-11-21', kind: 'booked' }], error: null }));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(result.current.availableIds.size).toBe(0);
  });
});
