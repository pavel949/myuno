import { renderHook, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMyPayments } from '../useMyPayments';
const state = vi.hoisted(() => ({ user: { id: 'synthetic-user' } as { id: string } | null, due: [] as unknown[], history: [] as unknown[], dueError: null as Error | null, historyError: null as Error | null, calls: [] as unknown[][] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
 state.calls.push(['from', table]); let history = false;
 const builder = {
  select: () => builder, eq: (...args: unknown[]) => { state.calls.push(['eq', ...args]); return builder; },
  is: (...args: unknown[]) => { state.calls.push(['is', ...args]); return builder; },
  in: (_column: string, values: string[]) => { history = values.includes('cancelled'); state.calls.push(['statuses', values]); return builder; },
  or: (value: string) => { history = true; state.calls.push(['history-filter', value]); return builder; },
  order: () => builder, limit: () => Promise.resolve({ data: history ? state.history : state.due, error: history ? state.historyError : state.dueError }),
 }; return builder;
} } }));
const row = (id: string, currency = 'THB', status = 'pending_advance') => ({ id, order_number: id, order_type: 'property', vertical: 'property', total_amount: 100, currency, status, created_at: '2026-10-20T00:00:00Z', paid_at: null });
const show = () => renderHook(() => useMyPayments(), { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>{children}</QueryClientProvider> });
afterEach(cleanup);
beforeEach(() => { state.user = { id: 'synthetic-user' }; state.due = []; state.history = []; state.dueError = null; state.historyError = null; state.calls = []; });
it('reads unpaid waiting states with actor/deletion filters and preserves cancelled history', async () => {
 state.due = [row('due')]; state.history = [row('cancelled', 'THB', 'cancelled')]; const { result } = show();
 await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(result.current.data?.dueNow[0].status).toBe('pending_advance'); expect(result.current.data?.history[0].status).toBe('cancelled');
 expect(state.calls).toContainEqual(['eq', 'customer_user_id', 'synthetic-user']);
 expect(state.calls).toContainEqual(['is', 'paid_at', null]); expect(state.calls).toContainEqual(['is', 'deleted_at', null]);
 expect(state.calls).toContainEqual(['statuses', ['pending', 'pending_advance', 'awaiting_client_payment', 'pending_deposit']]);
});
it.each(['dueError', 'historyError'] as const)('does not claim zero payments after %s', async key => {
 state[key] = new Error('synthetic denied'); const { result } = show();
 await waitFor(() => expect(result.current.isError).toBe(true)); expect(result.current.data).toBeUndefined();
});
it('does not add totals across currencies', async () => {
 state.due = [row('one'), row('two', 'USD')]; const { result } = show();
 await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(result.current.data?.totalDue).toBeNull(); expect(result.current.data?.currency).toBeNull();
});
it.each([{ total_amount: null }, { total_amount: NaN }, { currency: null }])('rejects unknown financial values %j instead of inventing a zero or currency', async fields => {
 state.due = [{ ...row('one'), ...fields }]; const { result } = show();
 await waitFor(() => expect(result.current.isError).toBe(true));
});
it('does not read orders for a guest', () => { state.user = null; show(); expect(state.calls).toEqual([]); });

it('retains paid confirmed activity and cancelled unpaid orders without treating either as due', async () => {
 state.history = [{ ...row('paid', 'THB', 'confirmed'), paid_at: '2026-10-20T01:00:00Z' }, row('unpaid-cancelled', 'THB', 'cancelled')];
 const { result } = show(); await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(state.calls).toContainEqual(['history-filter', 'paid_at.not.is.null,status.in.(completed,refunded,cancelled)']);
 expect(result.current.data?.history.map(r => [r.status, r.paidAt])).toEqual([['confirmed', '2026-10-20T01:00:00Z'], ['cancelled', null]]);
 expect(result.current.data?.dueNow).toEqual([]); expect(result.current.data?.totalDue).toBe(0);
});
