import React from 'react';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminConsultations from '../AdminConsultations';
import { useAdminConsultations } from '@/hooks/useAdminConsultations';

const state = vi.hoisted(() => ({
  language: 'en', rows: [] as Record<string, unknown>[], error: null as Error | null,
  reads: vi.fn(), matches: vi.fn(), mutations: vi.fn(),
}));
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
  vi.clearAllMocks(); state.language = 'en'; state.error = null;
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
