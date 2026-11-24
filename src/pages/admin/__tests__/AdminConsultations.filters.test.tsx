import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminConsultations from '../AdminConsultations';
import { InboxRequestDetail } from '@/components/admin/InboxRequestDetail';
import { useAdminConsultations } from '@/hooks/useAdminConsultations';

const state = vi.hoisted(() => ({
  language: 'en', actor: 'synthetic-admin' as string | undefined, rows: [] as Record<string, unknown>[], error: null as Error | null,
  reads: vi.fn(), matches: vi.fn(), mutations: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.actor ? { id: state.actor } : null }) }));
vi.mock('@/hooks/useIsAdmin', () => ({ useIsAdmin: () => ({ isAdmin: !!state.actor, isLoading: false, error: null }) }));
vi.mock('@/components/newbuilds/BuyerRequestSummary', () => ({ BuyerRequestSummary: () => null }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  state.reads(table);
  let rows = [...state.rows];
  const query = {
    select: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    eq(field: string, value: unknown) { state.matches('eq', field, value); rows = rows.filter(row => row[field] === value); return query; },
    in(field: string, values: unknown[]) { state.matches('in', field, values); rows = rows.filter(row => values.includes(row[field])); return query; },
    or: vi.fn().mockReturnThis(),
    update: state.mutations,
    maybeSingle: () => Promise.resolve({ data: state.error ? null : rows[0] ?? null, error: state.error }),
    then(resolve: (value: { data: Record<string, unknown>[] | null; error: Error | null }) => unknown) {
      return Promise.resolve({ data: state.error ? null : rows, error: state.error }).then(resolve);
    },
  };
  return query;
} } }));
vi.mock('@/components/admin/LeadActivityTimeline', () => ({ LeadActivityTimeline: () => null }));
vi.mock('@/components/admin/leads/LeadAIInsights', () => ({ LeadAIInsights: () => null }));
vi.mock('@/components/admin/leads/FollowUpGenerator', () => ({ FollowUpGenerator: () => null }));
vi.mock('@/components/admin/leads/BatchScoreButton', () => ({ BatchScoreButton: () => null }));
vi.mock('@/components/crm/ConvertLeadToDealButton', () => ({ ConvertLeadToDealButton: () => null }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => <select value={value} onChange={e => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}));
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
function row(name: string, vertical: string, source = 'website') {
  return { id: name, name, vertical_id: vertical, lead_source: source, request_type: 'property_consultation', status: 'pending', created_at: '2026-10-01T09:00:00Z', phone: '', email: null, preferred_contact_method: 'chat' };
}
const view = () => <QueryClientProvider client={client()}><MemoryRouter><AdminConsultations /></MemoryRouter></QueryClientProvider>;
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); state.actor = 'synthetic-admin'; state.language = 'en'; state.error = null;
  state.rows = [row('Legal legacy', 'legal'), row('Legal canonical', 'legal_services', 'WEBSITE'), row('Medical legacy', 'medical', 'REFERRAL'), row('Medical canonical', 'clinics', 'referral'), row('Education legacy', 'education'), row('Insurance legacy', 'insurance'), row('Concierge request', 'concierge')];
});

describe('consultation filters use canonical read aliases', () => {
  it.each(['en', 'ru'])('keeps legacy legal/medical requests under their named filters (%s)', async language => {
    state.language = language;
    render(view());
    expect(await screen.findByText('Legal legacy')).toBeTruthy();
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'legal_services' } });
    expect(await screen.findByText('Legal legacy')).toBeTruthy();
    expect(screen.queryByText('Medical legacy')).toBeNull();
    expect(screen.getByText('Legal canonical')).toBeTruthy();
    expect(screen.getAllByText(language === 'ru' ? '⚖️ Юридические услуги' : '⚖️ Legal').length).toBeGreaterThan(1);
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'clinics' } });
    expect(await screen.findByText('Medical legacy')).toBeTruthy();
    expect(screen.getByText('Medical canonical')).toBeTruthy();
    expect(screen.queryByText('Legal legacy')).toBeNull();
    expect(state.reads.mock.calls.every(([table]) => table === 'consultation_requests')).toBe(true);
    expect(state.mutations).not.toHaveBeenCalled();
  });
  it.each([['education_providers', 'Education legacy'], ['insurance_providers', 'Insurance legacy'], ['concierge', 'Concierge request']])('exposes the existing %s category without changing the stored value', async (vertical, name) => {
    render(view());
    await screen.findByText('Legal legacy');
    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: vertical } });
    expect(await screen.findByText(name)).toBeTruthy();
    expect(screen.queryByText('Legal legacy')).toBeNull();
    expect(state.mutations).not.toHaveBeenCalled();
  });
  it('offers website/referral sources and matches lower- and uppercase stored values', async () => {
    render(view());
    await screen.findByText('Legal legacy');
    expect(screen.getByRole('option', { name: 'Website' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Referral' })).toBeTruthy();
    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: 'website' } });
    expect(await screen.findByText('Legal legacy')).toBeTruthy();
    expect(screen.queryByText('Medical legacy')).toBeNull();
    expect(screen.getByText('Legal canonical')).toBeTruthy();
    fireEvent.change(screen.getAllByRole('combobox')[3], { target: { value: 'referral' } });
    expect(await screen.findByText('Medical legacy')).toBeTruthy();
    expect(screen.getByText('Medical canonical')).toBeTruthy();
    expect(screen.queryByText('Legal legacy')).toBeNull();
    expect(state.mutations).not.toHaveBeenCalled();
  });
  it('renders an unknown request type with its raw code instead of crashing the card', async () => {
    state.rows = [{ ...row('Unmapped request', 'legal'), request_type: 'future_request_type' }];
    render(view());
    expect(await screen.findByText('Unmapped request')).toBeTruthy();
    expect(screen.getByText('future_request_type')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('dialog', { name: 'Unmapped request' })).toBeTruthy();
    expect(state.mutations).not.toHaveBeenCalled();
  });
  it('keeps status/request-type predicates alongside alias filters', async () => {
    const queryClient = client();
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAdminConsultations({ status: 'pending', requestType: 'property_consultation', verticalId: 'legal_services', leadSource: 'website' }), { wrapper });
    await waitFor(() => expect(result.current.consultations).toHaveLength(2));
    expect(state.matches).toHaveBeenCalledWith('eq', 'status', 'pending');
    expect(state.matches).toHaveBeenCalledWith('eq', 'request_type', 'property_consultation');
    expect(state.matches).toHaveBeenCalledWith('in', 'vertical_id', ['legal_services', 'legal', 'lawyers']);
    expect(state.matches).toHaveBeenCalledWith('in', 'lead_source', ['website', 'WEBSITE']);
  });
  it.each(['status', 'notes'] as const)('refreshes the saved consultation in the inbox after saving %s', async kind => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const id = state.rows[0].id as string;
    const queue = ['admin-inbox', 'synthetic-admin', 'consultation_requests', 0, 'all', ''];
    const detail = ['admin-inbox-request', 'synthetic-admin', 'consultation_requests', id];
    const other = ['admin-inbox-request', 'synthetic-admin', 'consultation_requests', 'other'];
    const partnerQueue = ['admin-inbox', 'synthetic-admin', 'partner_applications', 0, 'all', ''];
    for (const key of [queue, detail, other, partnerQueue]) queryClient.setQueryData(key, { status: 'pending' });
    const single = vi.fn(async () => ({ data: { id, status: 'contacted', admin_notes: 'Synthetic follow-up' }, error: null }));
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    state.mutations.mockReturnValueOnce({ eq });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAdminConsultations(), { wrapper });

    await act(async () => {
      if (kind === 'status') await result.current.updateStatus.mutateAsync({ id, status: 'contacted' });
      else await result.current.updateNotes.mutateAsync({ id, admin_notes: 'Synthetic follow-up' });
    });

    expect(eq).toHaveBeenCalledWith('id', id);
    expect(queryClient.getQueryState(queue)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(detail)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(other)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(partnerQueue)?.isInvalidated).toBe(false);
  });
  it('preserves query failures rather than converting them to empty results', async () => {
    state.error = new Error('Synthetic read failure');
    const queryClient = client();
    const filters = { verticalId: 'legal_services' };
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useAdminConsultations(filters), { wrapper });
    await waitFor(() => expect(queryClient.getQueryState(['admin-consultations', filters])?.status).toBe('error'));
    expect(queryClient.getQueryState(['admin-consultations', filters])?.error).toBe(state.error);
    expect(result.current.consultations).toBeUndefined();
  });
});

describe('Sudara receipt handoff to the existing operator workflow', () => {
  const receipt = '4ac48534-de7e-4818-933e-2e781d56da94';
  const project = '5e678d88-905a-47cc-a736-31f39043d5ab';
  const request = { ...row('Synthetic Sudara enquiry', 'real_estate'), id: receipt,
    vertical_metadata: { request_only: true, project_id: project, intent: 'purchase' } };
  const consultationsPath = '/admin/consultations';
  const run = (path: string) => render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/inbox" element={<InboxRequestDetail source="consultation_requests" requestId={receipt} onClose={() => {}} />} />
          <Route path={consultationsPath} element={<AdminConsultations />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  it('lets the operator open the same canonical request, mark contacted, and record a note', async () => {
    state.rows = [row('Unrelated enquiry', 'legal'), request];
    const eq = vi.fn((_field: string, id: string) => {
      const updates = state.mutations.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      return { select: () => ({ single: async () => {
        state.rows = state.rows.map(record => record.id === id ? { ...record, ...updates } : record);
        return { data: state.rows.find(record => record.id === id), error: null };
      } }) };
    });
    state.mutations.mockReturnValue({ eq });
    run('/admin/inbox');
    const handoff = await screen.findByRole('link', { name: 'Handle this request' });
    expect(handoff).toHaveAttribute('href', consultationsPath + '?request=' + receipt);
    fireEvent.click(handoff);
    expect(await screen.findByText('Synthetic Sudara enquiry')).toBeTruthy();
    expect(screen.getByText(receipt)).toBeTruthy();
    expect(screen.queryByText('Unrelated enquiry')).toBeNull();
    expect(state.matches).toHaveBeenCalledWith('eq', 'id', receipt);
    fireEvent.click(screen.getByRole('button', { name: 'Contacted' }));
    await screen.findByText('Contacted');
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    fireEvent.change(screen.getByPlaceholderText('Add a note...'), { target: { value: 'Synthetic operator response' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.rows.find(record => record.id === receipt)).toMatchObject({
      status: 'contacted', admin_notes: 'Synthetic operator response',
    }));
    expect(eq.mock.calls).toEqual([['id', receipt], ['id', receipt]]);
    expect(state.rows).toHaveLength(2);
  });

  it('does not fall back to other requests after an invalid or inaccessible exact link', async () => {
    const invalid = run(consultationsPath + '?request=not-a-reference');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid request reference');
    expect(state.reads).not.toHaveBeenCalled();
    invalid.unmount();
    run(consultationsPath + '?request=' + receipt);
    expect(await screen.findByText('Request not found or unavailable.')).toBeTruthy();
    expect(screen.queryByText('Legal legacy')).toBeNull();
    expect(state.matches).toHaveBeenCalledWith('eq', 'id', receipt);
    expect(state.mutations).not.toHaveBeenCalled();
  });
});
