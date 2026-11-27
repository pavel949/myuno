import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readRecordedLandingEvents, useFunnelDiagnostics, usePulseKPIs } from './useMCCControlTower';
const state = vi.hoisted(() => ({
  user: { id: 'admin-a' } as { id: string } | null, admin: true, checking: false,
  error: false, missing: false,
  tables: [] as string[], selections: [] as unknown[], largeCount: false,
  options: [] as { enabled: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown> }[],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: state.checking }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: typeof state.options[number]) => {
  state.options.push(options); return { data: { counts: [] }, isError: false };
} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.tables.push(table); let stage: string | undefined;
  const events = ['landing_view', 'landing_view', 'intent_started'];
  const query = { select: (fields: string, options: unknown) => { state.selections.push([fields, options]); return query; },
    eq: (column: string, value: string) => { if (column === 'event_name') stage = value; return query; }, gte: () => query, lte: () => query,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: null,
      count: state.missing ? null : state.largeCount ? (!stage || stage === 'landing_view' ? 1601 : 0) : events.filter(event => !stage || event === stage).length,
      error: state.error ? new Error('Read failed') : null,
    }).then(resolve),
  }; return query;
} } }));
beforeEach(() => { state.user = { id: 'admin-a' }; state.admin = true; state.checking = false; state.error = false; state.missing = false; state.options = []; state.tables = []; state.selections = []; state.largeCount = false; });
describe('recorded funnel diagnostic evidence', () => {
  it('counts recorded events without inventing money or commercial outcomes', async () => {
    renderHook(() => useFunnelDiagnostics('landing-a', 7));
    expect(state.options[0].queryKey).toEqual(['mcc-funnel-diagnostics', 'landing-a', 7, 'admin-a']);
    expect(await state.options[0].queryFn()).toMatchObject({ totalEvents: 3, counts: [
      { stage: 'landing_view', count: 2 }, { stage: 'primary_cta_click', count: 0 },
      { stage: 'intent_started', count: 1 }, { stage: 'first_service_completed', count: 0 }, { stage: 'second_service_started', count: 0 },
    ] });
    expect(state.tables.every(table => table === 'mcc_landing_events')).toBe(true);
    expect(state.selections.every(selection => JSON.stringify(selection) === JSON.stringify(['id', { count: 'exact', head: true }]))).toBe(true);
  });
  it('does not truncate event counts at the normal row-read limit', async () => {
    state.largeCount = true; renderHook(() => useFunnelDiagnostics('landing-a'));
    const result = await state.options[0].queryFn() as { totalEvents: number; counts: { stage: string; count: number }[] };
    expect(result.totalEvents).toBe(1601);
    expect(result.counts).toContainEqual({ stage: 'landing_view', count: 1601 });
  });
  it('keeps an empty landing scope invalid instead of broadening it to the platform', async () => {
    await expect(readRecordedLandingEvents({ kind: 'landing', landingId: '' }, '2026-11-26T00:00:00Z', '2026-11-27T00:00:00Z')).rejects.toThrow('Landing scope is required');
    expect(state.tables).toEqual([]);
  });
  it('uses Phuket civil-day boundaries and does not derive revenue from bookings or event payloads', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-27T20:00:00Z'));
    try {
      renderHook(() => usePulseKPIs('today'));
      expect(await state.options[0].queryFn()).toMatchObject({ from: '2026-11-27T17:00:00.000Z', through: '2026-11-27T20:00:00.000Z', revenue: null, conversionPct: null });
      expect(state.tables.every(table => table === 'mcc_landing_events')).toBe(true);
    } finally { vi.useRealTimers(); }
  });
  it.each(['failed', 'missing'])('rejects %s evidence rather than producing zero events', async mode => {
    state.error = mode === 'failed'; state.missing = mode === 'missing';
    renderHook(() => useFunnelDiagnostics('landing-a'));
    await expect(state.options[0].queryFn()).rejects.toThrow();
  });
  it.each(['signed-out', 'staff', 'checking'])('hides cached diagnostics and disables reads for %s', mode => {
    if (mode === 'signed-out') state.user = null;
    if (mode === 'staff') state.admin = false;
    if (mode === 'checking') state.checking = true;
    const { result } = renderHook(() => useFunnelDiagnostics('landing-a'));
    expect(state.options[0].enabled).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
