import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperationsManualPaymentsTab } from './OperationsManualPaymentsTab';

const state = vi.hoisted(() => ({
  id: '11111111-1111-4111-8111-111111111111', admin: true,
  detailError: false, missing: false,
  reads: [] as string[], invoke: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: state.admin, isLoading: false }) }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  functions: { invoke: state.invoke },
  from: () => {
    let selected: string | null = null;
    const query = {
      select: () => query, order: () => query, range: () => query, in: () => query,
      eq: (key: string, value: string) => { if (key === 'id') selected = value; return query; },
      maybeSingle: async () => {
        state.reads.push(selected!);
        return { error: state.detailError ? new Error('Read failed') : null, data: state.missing ? null : {
          id: state.id, order_id: '22222222-2222-4222-8222-222222222222', status: 'awaiting_admin',
          amount_listing: 100, currency_listing: 'THB', amount_rub_estimate: null, amount_rub_actual: null,
          payment_method_actual: null, guest_name: 'Synthetic guest', guest_phone: '0000000000',
          guest_email: 'guest@example.invalid', hold_expires_at: '2026-12-01T10:00:00Z',
          created_at: '2026-11-27T10:00:00Z', rejected_reason: null, proof_file_path: null,
          contacted_at: null, confirmed_at: null, metadata: null,
          orders: { order_number: 'TEST-OUTSIDE-PAGE', metadata: null },
        } };
      },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], count: 0, error: null }).then(resolve),
    };
    return query;
  },
} }));
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function mount(id = state.id) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/admin/operations?tab=manual-payments&manual_status=review&manual_page=3&request_id=${id}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><OperationsManualPaymentsTab /><Location /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { state.admin = true; state.detailError = false; state.missing = false; state.reads = []; vi.clearAllMocks(); });
afterEach(cleanup);
describe('exact payment request handoff', () => {
  it('opens the requested record outside the current list page and requires a separate confirmation action', async () => {
    mount();
    expect(await screen.findByRole('heading', { name: '#TEST-OUTSIDE-PAGE' })).toBeVisible();
    expect(state.reads).toContain(state.id);
    expect(screen.getByText('No requests')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm payment' }));
    expect(await screen.findByRole('heading', { name: 'Confirm payment' })).toBeVisible();
    expect(state.invoke).not.toHaveBeenCalled();
    expect(screen.getByTestId('location')).toHaveTextContent('manual_page=3');
    expect(screen.getByTestId('location')).not.toHaveTextContent('request_id');
  });
  it('keeps a failed exact read distinct from not found and can retry', async () => {
    state.detailError = true; mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this payment request');
    expect(screen.queryByText('Payment request was not found or is not accessible.')).not.toBeInTheDocument();
    state.detailError = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: '#TEST-OUTSIDE-PAGE' })).toBeVisible();
  });
  it('does not read malformed identifiers or expose a missing record as a successful detail', async () => {
    mount('not-an-id');
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid payment request link');
    expect(state.reads).toEqual([]);
    cleanup(); state.missing = true; mount();
    expect(await screen.findByText('Payment request was not found or is not accessible.')).toBeVisible();
  });
  it('does not load privileged request details without administrator admission', async () => {
    state.admin = false; mount();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Administrator access is required'));
    expect(state.reads).toEqual([]);
  });
});
