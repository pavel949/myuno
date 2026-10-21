import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMyRequests } from '../useMyRequests';
const state = vi.hoisted(() => ({ replies: {} as Record<string, { data: unknown[] | null; error: unknown; throws?: boolean }>, filters: [] as unknown[][] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-customer' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => ({ select: () => ({ eq: (...args: unknown[]) => { state.filters.push([table, ...args]); return { order: () => ({ limit: () => { const reply = state.replies[table]; if (reply.throws) throw new Error('synthetic thrown read'); return Promise.resolve(reply); } }) }; } }) }) } }));
afterEach(cleanup);
beforeEach(() => { state.filters = []; state.replies = Object.fromEntries(['concierge_sessions', 'visa_records', 'orders', 'help_requests'].map(table => [table, { data: [], error: null }])); });
const show = () => { const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } }); return renderHook(() => useMyRequests(), { wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> }); };
it('preserves successful entries and exposes returned source errors', async () => {
 state.replies.visa_records = { data: null, error: new Error('synthetic denied') };
 state.replies.concierge_sessions = { data: [{ id: 'one', goal: 'Synthetic request', status: 'open', created_at: '2026-10-20T00:00:00Z' }], error: null };
 const { result } = show();
 await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(result.current.data).toEqual([expect.objectContaining({ id: 'concierge-one', title: 'Synthetic request' })]);
 expect(result.current.failedSources).toEqual(['visa']);
 expect(state.filters).toContainEqual(['orders', 'customer_user_id', 'synthetic-customer']);
 expect(state.filters).toContainEqual(['visa_records', 'user_id', 'synthetic-customer']);
});
it('exposes every failed source, including thrown failures, without claiming completeness', async () => {
 for (const table of Object.keys(state.replies)) state.replies[table] = { data: null, error: new Error('synthetic offline'), throws: table === 'orders' };
 const { result } = show();
 await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(result.current.data).toEqual([]);
 expect(result.current.failedSources).toEqual(['concierge', 'visa', 'order', 'help']);
});
it('distinguishes verified empty sources from failures', async () => {
 const { result } = show();
 await waitFor(() => expect(result.current.isSuccess).toBe(true));
 expect(result.current.data).toEqual([]);
 expect(result.current.failedSources).toEqual([]);
});
it('clears failed source metadata after a successful retry', async () => {
 state.replies.help_requests = { data: null, error: new Error('synthetic offline') };
 const { result } = show();
 await waitFor(() => expect(result.current.failedSources).toEqual(['help']));
 state.replies.help_requests = { data: [], error: null };
 await result.current.refetch();
 await waitFor(() => expect(result.current.failedSources).toEqual([]));
});
