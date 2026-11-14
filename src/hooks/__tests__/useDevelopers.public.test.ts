import { describe, expect, it, vi } from 'vitest';
import { useDeveloper, useDevelopers } from '../useDevelopers';

const state = vi.hoisted(() => ({ calls: [] as string[], rows: [] as Record<string, unknown>[] }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => {
    state.calls.push(table);
    const query = {
      select: (columns: string) => { state.calls.push(columns); return query; },
      eq: (_column: string, _value: unknown) => query,
      order: () => query,
      maybeSingle: async () => ({ data: state.rows[0] ?? null, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: state.rows, error: null })),
    };
    return query;
  } },
}));

const run = async (options: unknown) => (options as { queryFn: () => Promise<unknown> }).queryFn();

describe('public developer projection contract', () => {
  it('uses the safe projection and never requests sensitive base-table columns', async () => {
    state.calls = [];
    await run(useDevelopers());
    expect(state.calls[0]).toBe('developers_public');
    expect(state.calls.join(' ')).toContain('devmod_status');
    expect(state.calls.join(' ')).not.toContain('stripe_connect_id');
    expect(state.calls.join(' ')).not.toContain('user_id');
  });

  it('requires the active lifecycle in addition to is_active for public reads', async () => {
    state.calls = [];
    await run(useDeveloper('developer'));
    expect(state.calls[0]).toBe('developers_public');
    expect(state.calls.join(' ')).toContain('devmod_status');
  });
});
