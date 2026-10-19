import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClearViewReport } from '../ClearViewReport';
const state = vi.hoisted(() => ({ language: 'en', published: false, hasReport: true, admin: false, error: false, track: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.admin ? { id: 'admin-test' } : null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'admin' } }) }) }) }) }) } }));
vi.mock('@/hooks/useDueDiligence', () => ({
  useDueDiligenceReport: () => ({ data: state.hasReport ? { id: 'report', is_published: state.published, total_score: 67, grade: null, executive_summary: 'Report-specific findings', analysis: {}, green_flags: [], red_flags: [], recommendations: [] } : null, isLoading: false, isError: state.error }),
  useGenerateDueDiligence: () => ({ mutate: vi.fn() }), useTogglePublishDueDiligence: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/hooks/useClearViewPurchase', () => ({ useClearViewAccess: () => ({ data: { hasAccess: false } }) }));
vi.mock('@/hooks/useIsProjectDeveloper', () => ({ useIsProjectDeveloper: () => ({ data: false }) }));
vi.mock('@/hooks/useIPPLeadEvent', () => ({ useIPPLeadEvent: () => ({ track: state.track }) }));
vi.mock('@/components/clearview/ClearViewGauge', () => ({ ClearViewGauge: ({ score }: { score: number }) => <span>Published score {score}</span> }));
vi.mock('@/components/clearview/ClearViewRadar', () => ({ ClearViewRadar: () => null }));
vi.mock('@/components/clearview/ClearViewPaywall', () => ({ ClearViewPaywall: () => <div>Report access options</div> }));
beforeEach(() => { state.language = 'en'; state.published = false; state.hasReport = true; state.admin = false; state.error = false; state.track.mockClear(); });
afterEach(cleanup);

describe('public ClearView presentation', () => {
  it.each([false, true])('does not expose a draft to public viewer (admin=%s)', async admin => {
    state.admin = admin;
    render(<ClearViewReport projectId="p" publicView />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(screen.getByText('No published ClearView report is available yet.')).toBeVisible());
    expect(screen.queryByText('Report-specific findings')).toBeNull();
    expect(screen.queryByText(/Published score/)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(state.track).not.toHaveBeenCalled();
  });
  it('preserves genuine published report content and access options', () => {
    state.published = true;
    render(<ClearViewReport projectId="p" publicView />);
    expect(screen.getByText('Published score 67')).toBeVisible();
    expect(screen.getByText('Report-specific findings')).toBeVisible();
    expect(screen.getByText('Report access options')).toBeVisible();
  });
  it.each([['ru', 'Опубликованный отчёт ClearView пока недоступен.'], ['en', 'No published ClearView report is available yet.'], ['th', 'ยังไม่มีรายงาน ClearView ที่เผยแพร่']])('localizes unavailable published report in %s', (language, label) => {
    state.language = language; state.hasReport = false;
    render(<ClearViewReport projectId="p" publicView />);
    expect(screen.getByText(label)).toBeVisible();
  });
  it('distinguishes a failed report read from report absence', () => {
    state.hasReport = false; state.error = true;
    render(<ClearViewReport projectId="p" publicView />);
    expect(screen.getByText('The published ClearView report could not be loaded.')).toBeVisible();
  });
  it('requests the latest published version separately from authoring cache', () => {
    const component = readFileSync(`${process.cwd()}/src/components/newbuilds/ClearViewReport.tsx`, 'utf8');
    const hook = readFileSync(`${process.cwd()}/src/hooks/useDueDiligence.ts`, 'utf8');
    expect(component).toContain('useDueDiligenceReport(projectId, { publishedOnly: publicView })');
    expect(hook).toContain("query.eq('is_published', true)");
    expect(hook).toContain("options.publishedOnly ? 'published' : 'accessible'");
  });
  it.each(['src/pages/property/OffplanDetail.tsx', 'src/components/property/OffplanProjectCard.tsx'])('does not infer diligence or fabricate scores in %s', file => {
    const source = readFileSync(`${process.cwd()}/${file}`, 'utf8');
    expect(source).not.toMatch(/project\.(riskLevel|muunoScore|roiProjected)|Due Diligence Complete|passed independent|location: 80|ScoreBreakdown/);
  });
});
