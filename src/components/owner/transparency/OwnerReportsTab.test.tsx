import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
const fixture = vi.hoisted(() => ({ error: null as Error | null, loading: false, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ format: String }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [], error: fixture.error, isLoading: fixture.loading, refetch: fixture.retry }) }));
vi.mock('@/hooks/usePropertyReports', () => ({ useGeneratePdf: () => ({ mutate: () => { throw Error('Export forbidden'); } }) }));
vi.mock('@/components/owner/reports/ReportDetailSheet', () => ({ ReportDetailSheet: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Production denied'); } }) }));
import { OwnerReportsTab } from './OwnerReportsTab';
beforeEach(() => { fixture.error = null; fixture.loading = false; vi.clearAllMocks(); });
afterEach(cleanup);
describe('owner report read states', () => {
  it('failed read is distinguishable from no shared reports and can retry', () => {
    fixture.error = new Error('denied'); render(<OwnerReportsTab propertyId="foreign-home" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('No reports shared by the management company yet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fixture.retry).toHaveBeenCalledOnce();
  });
  it('successful empty read has no download or detail action', () => {
    render(<OwnerReportsTab propertyId="home-a" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});