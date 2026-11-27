import { Fragment, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationsLeadsTab } from './OperationsLeadsTab';
const state = vi.hoisted(() => ({ fail: false, filters: [] as string[], rows: [
  { id: 'qa-won', business_name: 'QA won partner', status: 'won', created_at: '2026-11-27T01:00:00Z' },
  { id: 'qa-legacy', business_name: 'QA legacy stage', status: 'qualified', created_at: '2026-11-27T01:00:00Z' },
] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'qa-admin' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  let status: string | undefined;
  const query = { select: () => query, order: () => query, limit: () => query,
    eq: (_column: string, value: string) => { status = value; state.filters.push(value); return query; },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({
      data: state.fail ? null : state.rows.filter(row => !status || row.status === status),
      error: state.fail ? new Error('Synthetic source failure') : null,
    }).then(resolve) };
  return query;
} } }));
vi.mock('@/components/admin/prospects/VendorProspectDetail', () => ({
  VendorProspectDetail: ({ prospect, open, onClose }: { prospect: { id: string }; open: boolean; onClose: () => void }) => open ?
    <section role="dialog" aria-label="Existing prospect workflow"><p>{prospect.id}</p><button onClick={onClose}>Close existing workflow</button></section> : null,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) =>
    <select aria-label="Status filter" value={value} onChange={event => onValueChange(event.target.value)}>{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <Fragment>{children}</Fragment>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));
beforeEach(() => { state.fail = false; state.filters = []; });
afterEach(cleanup);
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><OperationsLeadsTab /></QueryClientProvider>); }
describe('operations partner prospect workflow', () => {
  it('counts canonical won records and leaves unsupported legacy stages explicit', async () => {
    mount(); await screen.findByText('QA won partner');
    expect(screen.getByText('Won', { selector: 'p' }).previousElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Unknown (qualified)')).toBeVisible();
  });
  it('opens the existing workflow for the selected record and closes it explicitly', async () => {
    mount(); const row = (await screen.findByText('QA won partner')).closest('tr');
    fireEvent.click(within(row!).getByRole('button', { name: 'Open prospect' }));
    expect(screen.getByRole('dialog', { name: 'Existing prospect workflow' })).toHaveTextContent('qa-won');
    fireEvent.click(screen.getByRole('button', { name: 'Close existing workflow' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('filters by the canonical won stage rather than an invented converted stage', async () => {
    mount(); await screen.findByText('QA legacy stage');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'won' } });
    await waitFor(() => expect(state.filters).toContain('won'));
    await screen.findByText('QA won partner');
    expect(screen.queryByText('QA legacy stage')).not.toBeInTheDocument();
  });
  it('keeps failed counts unknown and can retry the source', async () => {
    state.fail = true; mount(); expect(await screen.findByRole('alert')).toHaveTextContent('Could not load partner prospects');
    expect(screen.getByText('Won', { selector: 'p' }).previousElementSibling).toHaveTextContent('—');
    state.fail = false; fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('QA won partner'); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
