import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VendorServiceDesk from './VendorServiceDesk';
const f = vi.hoisted(() => ({ write: vi.fn(), error: vi.fn(), filters: [] as unknown[], order: { id: 'request-a', status: 'pending', service_name: 'Synthetic service', amount: 0, currency: 'USD' } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'supplier-user' } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('sonner', () => ({ toast: { error: f.error } }));
vi.mock('@/hooks/useServiceMarketplace', () => ({
 useMyProvider: () => ({ data: { id: 'supplier-a', name: 'Synthetic supplier' } }),
 useProviderServicesAdmin: () => ({ data: [] }), useProviderHours: () => ({ data: [] }),
 useProviderOrders: () => ({ data: [f.order] }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
 const q = { update: (patch: unknown) => { f.filters.push(patch); return q; }, eq: (...args: unknown[]) => { f.filters.push(args); return q; }, select: () => q, single: () => f.write() }; return q;
} } }));
function mount() {
 const qc = new QueryClient(); const invalidate = vi.spyOn(qc, 'invalidateQueries');
 render(<MemoryRouter><QueryClientProvider client={qc}><VendorServiceDesk /></QueryClientProvider></MemoryRouter>);
 return invalidate;
}
beforeEach(() => { f.write.mockReset(); f.error.mockClear(); f.filters.length = 0; f.order.status = 'pending'; });
describe('provider request handling', () => {
 it('keeps persisted currency/zero and scopes a confirmed update to provider and previous status', async () => {
  f.write.mockResolvedValue({ data: { id: 'request-a' }, error: null }); const invalidate = mount();
  expect(screen.getByText(/0 USD/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmed' }));
  await waitFor(() => expect(invalidate).toHaveBeenCalled());
  expect(f.filters).toEqual([{ status: 'confirmed' }, ['id', 'request-a'], ['provider_id', 'supplier-a'], ['status', 'pending']]);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['guest-service-orders'] });
 });
 it('reports stale or denied zero-row updates, without successful cache invalidation', async () => {
  f.write.mockResolvedValue({ data: null, error: null }); const invalidate = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmed' }));
  await waitFor(() => expect(f.error).toHaveBeenCalledWith('Could not save'));
  expect(invalidate).not.toHaveBeenCalled();
 });
 it('catches transport rejection and prevents duplicate status submissions while pending', async () => {
  let reject!: (e: Error) => void;
  f.write.mockImplementation(() => new Promise((_resolve, r) => { reject = r; })); mount();
  const confirm = screen.getByRole('button', { name: 'Confirmed' });
  fireEvent.click(confirm); fireEvent.click(confirm);
  expect(f.write).toHaveBeenCalledOnce();
  expect(confirm).toBeDisabled();
  await act(async () => reject(new Error('Disconnected')));
  expect(f.error).toHaveBeenCalledWith('Could not save');
  expect(confirm).toBeEnabled();
 });
 it('preserves unknown persisted status and offers no invented transition', () => {
  f.order.status = 'future_status'; mount();
  expect(screen.getByText('Unknown status: future_status')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirmed' })).toBeNull();
 });
});
