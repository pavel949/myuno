import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useROIReport } from './useAIInsights';
const state = vi.hoisted(() => ({ user: { id: 'admin-a' } as { id: string } | null, admin: true, fail: false,
  rows: [] as { primary_score: number; is_reviewed: boolean; admin_action: string; verdict: string }[],
  options: [] as { enabled: boolean; queryKey: unknown[]; queryFn: () => Promise<unknown> }[] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: false }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: typeof state.options[number]) => {
  state.options.push(options); return { data: { summary: 'cached' }, isError: false };
} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query, gte: () => query,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: state.fail ? null : state.rows, error: state.fail ? new Error('Synthetic read failure') : null }).then(resolve) };
  return query;
} } }));
beforeEach(() => { state.user = { id: 'admin-a' }; state.admin = true; state.fail = false; state.options = []; state.rows = []; });
describe('AI quality report evidence', () => {
  it('describes analysis rows and recorded acknowledgements rather than claiming unique listings or AI accuracy', async () => {
    state.rows = [
      { primary_score: 80, is_reviewed: true, admin_action: 'acknowledged', verdict: 'suspicious' },
      { primary_score: 40, is_reviewed: true, admin_action: 'dismissed', verdict: 'normal' },
    ];
    renderHook(() => useROIReport());
    expect(await state.options[0].queryFn()).toMatchObject({ summary: expect.stringContaining('2 analysis records'),
      metrics: { listingsAnalyzed: 2, aiAccuracyProxy: 50, avgQualityScore: 60, suspiciousDetected: 1 } });
  });
  it('keeps a failed source distinct from zero analysis records', async () => {
    state.fail = true; renderHook(() => useROIReport());
    await expect(state.options[0].queryFn()).rejects.toThrow('Synthetic read failure');
  });
  it('does not claim infrastructure or execution success from an empty source', async () => {
    renderHook(() => useROIReport());
    expect(await state.options[0].queryFn()).toMatchObject({ strengths: [], metrics: { listingsAnalyzed: 0 } });
    expect(state.options[0].queryKey).toEqual(['ai-roi-report', 'admin-a']);
  });
  it('disables reads and hides cached reports after admission is lost', () => {
    state.admin = false; const { result } = renderHook(() => useROIReport());
    expect(state.options[0].enabled).toBe(false); expect(result.current.data).toBeUndefined();
  });
});
