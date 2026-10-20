import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readAdminPlatformStatus, useAdminDashboardSnapshots, useAdminPlatformStatus } from './useAdminDashboardEvidence';

const state = vi.hoisted(() => ({
  user: { id: 'synthetic-admin' } as { id: string } | null, admin: true, checking: false,
  emailError: false, reconciliationError: false, count: 0 as number | null,
  verticals: [{ value: '{"enabled":true}' }] as { value: string }[],
  queries: [] as { queryKey: unknown[]; enabled: boolean }[],
  filters: [] as unknown[][],
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: state.checking }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryKey: unknown[]; enabled: boolean }) => { state.queries.push(options); return { data: undefined }; } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  let key = '';
  let like = false;
  const response = () => table === 'reconciliation_alerts'
    ? { count: state.count, error: state.reconciliationError ? new Error('synthetic source failure') : null }
    : like ? { data: state.verticals, error: null }
      : { data: { value: key === 'stripe_mode' ? 'live' : key === 'admin_emails' ? '["admin@example.invalid"]' : '123456789' }, error: key === 'admin_emails' && state.emailError ? new Error('synthetic source failure') : null };
  const query = {
    select: () => query,
    eq: (_column: string, value: string) => { key = value; return query; },
    like: () => { like = true; return query; },
    is: (column: string, value: unknown) => { state.filters.push([table, 'is', column, value]); return query; },
    gte: (column: string, value: unknown) => { state.filters.push([table, 'gte', column, value]); return query; },
    lte: (column: string, value: unknown) => { state.filters.push([table, 'lte', column, value]); return query; },
    maybeSingle: async () => response(),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(response()).then(resolve),
  };
  return query;
} } }));

beforeEach(() => {
  state.user = { id: 'synthetic-admin' }; state.admin = true; state.checking = false;
  state.emailError = false; state.reconciliationError = false; state.count = 0;
  state.verticals = [{ value: '{"enabled":true}' }]; state.queries = []; state.filters = [];
});

describe('platform status reads', () => {
  it('preserves one-source errors as unknown without hiding other source evidence', async () => {
    state.emailError = true;
    expect(await readAdminPlatformStatus(new Date('2026-10-20T12:00:00Z'))).toEqual([
      { key: 'stripe_mode', status: 'configured' }, { key: 'admin_emails', status: 'unknown' },
      { key: 'admin_whatsapp', status: 'configured' }, { key: 'reconciliation', status: 'verified' },
      { key: 'verticals', status: 'configured' },
    ]);
    expect(state.filters).toContainEqual(['reconciliation_alerts', 'gte', 'created_at', '2026-09-20T12:00:00.000Z']);
    expect(state.filters).toContainEqual(['reconciliation_alerts', 'lte', 'created_at', '2026-10-20T12:00:00.000Z']);
    expect(state.filters).toContainEqual(['reconciliation_alerts', 'is', 'resolved_at', null]);
  });
  it('never treats failed or missing reconciliation counts as clean', async () => {
    state.count = null;
    expect(await readAdminPlatformStatus()).toContainEqual({ key: 'reconciliation', status: 'unknown' });
    state.count = 0; state.reconciliationError = true;
    expect(await readAdminPlatformStatus()).toContainEqual({ key: 'reconciliation', status: 'unknown' });
  });
  it('keeps missing vertical configuration unknown', async () => {
    state.verticals = [];
    expect(await readAdminPlatformStatus()).toContainEqual({ key: 'verticals', status: 'unknown' });
  });
});

describe('dashboard evidence access boundaries', () => {
  it.each(['signed-out', 'staff', 'checking'])('disables private reads for %s', mode => {
    if (mode === 'signed-out') state.user = null;
    if (mode === 'staff') state.admin = false;
    if (mode === 'checking') state.checking = true;
    renderHook(() => { useAdminPlatformStatus(); useAdminDashboardSnapshots(7); });
    expect(state.queries).toHaveLength(2);
    expect(state.queries.every(query => query.enabled === false)).toBe(true);
  });
  it('binds enabled query caches to the authorized actor', () => {
    renderHook(() => { useAdminPlatformStatus(); useAdminDashboardSnapshots(7); });
    expect(state.queries.every(query => query.enabled === true && query.queryKey.includes('synthetic-admin'))).toBe(true);
  });
});
