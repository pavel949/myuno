import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminProviderDetail from './AdminProviderDetail';
const f = vi.hoisted(() => ({ admin: true, loading: false, error: null as Error | null, refetch: vi.fn(), details: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: f.admin, isLoading: f.loading }) }));
vi.mock('@/hooks/useProviderDetails', () => ({ useProviderDetails: (id: string) => { f.details(id); return { provider: { id, name: 'Manually entered supplier' }, services: [], products: [], contracts: [], bookings: [], error: f.error, refetch: f.refetch }; } }));
vi.mock('@/pages/vendor/VendorServiceDesk', () => ({ ProviderServiceDesk: ({ provider }: { provider: { id: string; name: string } }) => <div data-testid="shared-desk">{provider.id} · {provider.name}</div> }));
vi.mock('@/components/admin/ProviderContractEditor', () => ({ ProviderContractEditor: () => null }));
vi.mock('@/components/admin/AdminNotesWidget', () => ({ AdminNotesWidget: () => null }));
vi.mock('@/components/admin/provider-detail', () => ({ ProviderDetailHeader: () => null, ProviderQuickStats: () => null, ProviderOverviewTab: () => null, ProviderServicesTab: () => null, ProviderProductsTab: () => null, ProviderContractsTab: () => null }));
function mount() { render(<MemoryRouter initialEntries={['/admin/providers/supplier-without-login']}><Routes><Route path="/admin/providers/:id" element={<AdminProviderDetail />} /></Routes></MemoryRouter>); }
beforeEach(() => { f.admin = true; f.loading = false; f.error = null; f.refetch.mockClear(); });
describe('admin handling of manually entered suppliers', () => {
 it('opens the canonical service desk for the selected provider without requiring a linked provider login', () => {
  mount();
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Requests and hours' }), { button: 0, ctrlKey: false });
  expect(screen.getByTestId('shared-desk')).toHaveTextContent('supplier-without-login · Manually entered supplier');
 });
 it('does not expose operator controls before the protected admin check resolves', () => {
  f.loading = true; mount();
  expect(screen.queryByRole('tab', { name: 'Requests and hours' })).toBeNull();
  expect(screen.queryByTestId('shared-desk')).toBeNull();
 });
 it('does not treat non-admin employment as permission for this administrative surface', () => {
  f.admin = false; mount();
  expect(screen.getByRole('alert')).toHaveTextContent('Provider management access denied');
  expect(screen.queryByTestId('shared-desk')).toBeNull();
 });
 it('distinguishes an operational read failure from a missing supplier and allows retry', () => {
  f.error = new Error('Synthetic denied'); mount();
  expect(screen.getByText('Could not load provider')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(f.refetch).toHaveBeenCalledOnce();
 });
});
