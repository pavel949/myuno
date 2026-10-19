import type { ReactNode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminServices from './AdminServices';
const f = vi.hoisted(() => ({ create: vi.fn(), error: vi.fn(), success: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin' }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: true }), useAdminProviders: () => ({ providers: [{ id: 'supplier', name: 'Synthetic supplier' }] }), useAdminCategories: () => ({ categories: [] }), useAdminServices: () => ({ services: [], createService: f.create }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/hooks/useAdminContentCreation', () => ({ useOnBehalfContext: () => ({ isOnBehalf: false }) }));
vi.mock('@/hooks/useAutoTranslate', () => ({ useAutoTranslate: () => ({ translateMultiple: vi.fn(), isTranslating: false }) }));
vi.mock('@/hooks/useAdminFormHotkeys', () => ({ useAdminFormHotkeys: () => {}, useFormProgress: () => ({ progress: 0, filled: 0, total: 1 }) }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: () => null }));
vi.mock('@/components/admin/OnBehalfBanner', () => ({ OnBehalfBanner: () => null }));
vi.mock('@/components/admin/AdminFormToolbar', () => ({ AdminFormToolbar: () => null }));
vi.mock('@/components/upload/ImageUpload', () => ({ MultiImageUpload: () => null }));
vi.mock('sonner', () => ({ toast: { error: f.error, success: f.success } }));
function mount() { render(<MemoryRouter initialEntries={['/admin/services?provider=supplier&action=new']}><AdminServices /></MemoryRouter>); }
beforeEach(() => { f.create.mockReset().mockResolvedValue({ data: { id: 'new-service' }, error: null }); f.error.mockClear(); f.success.mockClear(); });
describe('supplier service configuration', () => {
 it('saves a quote-only offering without fake capacity fields, preserving selected supplier and currency', async () => {
  mount();
  fireEvent.change(screen.getByLabelText('Name (EN) *'), { target: { value: 'Synthetic repair' } });
  fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'USD' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(f.success).toHaveBeenCalledWith('Service created'));
  expect(f.create).toHaveBeenCalledOnce();
  expect(f.create.mock.calls[0][0]).toMatchObject({ provider_id: 'supplier', name_en: 'Synthetic repair', price: null, currency: 'USD', duration_minutes: null, approval_status: 'approved', booking_flow: 'in_app_request' });
  expect(f.create.mock.calls[0][0]).not.toHaveProperty('max_capacity');
  expect(f.create.mock.calls[0][0]).not.toHaveProperty('is_featured');
 });
 it('preserves an actual zero price and configured duration', async () => {
  mount();
  fireEvent.change(screen.getByLabelText('Name (EN) *'), { target: { value: 'Synthetic inspection' } });
  fireEvent.change(screen.getByLabelText('Price (blank for a quote)'), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText('Duration (min)'), { target: { value: '90' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(f.create).toHaveBeenCalledOnce());
  expect(f.create.mock.calls[0][0]).toMatchObject({ price: 0, duration_minutes: 90 });
 });
 it('keeps the editor and entered values when the server refuses a save', async () => {
  f.create.mockResolvedValue({ error: new Error('Denied') }); mount();
  fireEvent.change(screen.getByLabelText('Name (EN) *'), { target: { value: 'Synthetic retained' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(f.error).toHaveBeenCalledWith('Error saving service'));
  expect(screen.getByLabelText('Name (EN) *')).toHaveValue('Synthetic retained');
  expect(f.success).not.toHaveBeenCalled();
 });
 it('holds one pending write despite repeated submission', async () => {
  let resolve!: (v: unknown) => void;
  f.create.mockImplementation(() => new Promise(r => { resolve = r; })); mount();
  fireEvent.change(screen.getByLabelText('Name (EN) *'), { target: { value: 'Synthetic once' } });
  const save = screen.getByRole('button', { name: 'Save', exact: true });
  fireEvent.click(save); fireEvent.click(save);
  expect(f.create).toHaveBeenCalledOnce();
  await act(async () => resolve({ data: { id: 'new-service' }, error: null }));
 });
});
