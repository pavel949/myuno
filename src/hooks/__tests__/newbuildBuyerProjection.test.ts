import { describe, it, expect, vi } from 'vitest';
import { useNewbuildProject, NEWBUILD_BUYER_PROJECT_FIELDS } from '../useNewbuildProjects';
const state = vi.hoisted(() => ({ selected: '', filters: [] as unknown[][] }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { const q = { select: (fields: string) => { state.selected = fields; return q; }, eq: (...args: unknown[]) => { state.filters.push(args); return q; }, maybeSingle: async () => ({ data: { id: 'synthetic-project' }, error: null }) }; return q; } } }));
describe('buyer project projection', () => {
  it('uses a separate cache, publication filters and excludes private fields', async () => { state.filters = []; const query = useNewbuildProject('synthetic-project', 'buyer') as unknown as { queryKey: unknown[]; queryFn: () => Promise<unknown> }; await query.queryFn(); expect(query.queryKey).toContain('buyer'); expect(state.selected).toBe(NEWBUILD_BUYER_PROJECT_FIELDS); expect(state.selected).not.toMatch(/commission|contact_id|management_company|marketing_materials|\*/); expect(state.filters).toContainEqual(['is_active', true]); expect(state.filters).toContainEqual(['is_approved', true]); });
});
