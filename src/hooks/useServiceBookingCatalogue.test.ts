import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

type Result = { data: unknown; error: unknown };
const responses: Record<string, Result | (() => Promise<Result>)> = {};

function chain(table: string) {
  const resolve = () => {
    const r = responses[table];
    return typeof r === 'function' ? r() : Promise.resolve(r);
  };
  const q: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order']) q[m] = () => q;
  q.maybeSingle = resolve;
  q.then = (ok: (v: Result) => unknown, bad: (e: unknown) => unknown) => resolve().then(ok, bad);
  return q;
}

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (t: string) => chain(t) } }));

import { useServiceBookingCatalogue } from './useServiceBookingCatalogue';

const okProvider = { id: 'p1', name: 'P', logo_url: null, business_category: null, is_active: true, approval_status: 'approved', is_demo: false };

beforeEach(() => { for (const k of Object.keys(responses)) delete responses[k]; });

describe('useServiceBookingCatalogue', () => {
  it('reports missing provider', async () => {
    responses.providers = { data: null, error: null };
    const { result } = renderHook(() => useServiceBookingCatalogue('p1'));
    await waitFor(() => expect(result.current.status).toBe('missing'));
  });

  it('reports inactive provider without loading services', async () => {
    responses.providers = { data: { ...okProvider, approval_status: 'pending' }, error: null };
    const { result } = renderHook(() => useServiceBookingCatalogue('p1'));
    await waitFor(() => expect(result.current.status).toBe('inactive'));
  });

  it('reports catalogue load failure as error, not empty', async () => {
    responses.providers = { data: okProvider, error: null };
    responses.services = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useServiceBookingCatalogue('p1'));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('reports empty when no valid offerings', async () => {
    responses.providers = { data: okProvider, error: null };
    responses.services = { data: [{ id: 's', name_en: 'x', name_ru: 'x', price: 0, currency: 'THB', is_active: true }], error: null };
    const { result } = renderHook(() => useServiceBookingCatalogue('p1'));
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('returns ready offerings with unmapped org (no trusted mapping exists)', async () => {
    responses.providers = { data: okProvider, error: null };
    responses.services = { data: [{ id: 's', name_en: 'Fix', name_ru: 'Ремонт', price: 900, currency: 'THB', is_active: true }], error: null };
    const { result } = renderHook(() => useServiceBookingCatalogue('p1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    if (result.current.status !== 'ready') return;
    expect(result.current.offerings).toHaveLength(1);
    expect(result.current.org).toEqual({ status: 'unmapped' });
  });

  it('resets to loading on provider change and ignores stale responses', async () => {
    let release: (r: Result) => void = () => {};
    responses.providers = () => new Promise<Result>(r => { release = r; });
    const { result, rerender } = renderHook(({ id }) => useServiceBookingCatalogue(id), { initialProps: { id: 'p1' } });
    expect(result.current.status).toBe('loading');
    const staleRelease = release;
    responses.providers = { data: null, error: null };
    rerender({ id: 'p2' });
    await waitFor(() => expect(result.current.status).toBe('missing'));
    staleRelease({ data: okProvider, error: null });
    await new Promise(r => setTimeout(r, 10));
    expect(result.current.status).toBe('missing');
  });
});
