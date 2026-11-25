import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCatalogWorkspace from '../AdminCatalogWorkspace';

const state = vi.hoisted(() => ({
  create: vi.fn(), update: vi.fn(),
  provider: { id: 'provider-a', name: 'Fixture operator', is_active: true, approval_status: 'approved', is_demo: false },
  service: { id: 'service-a', provider_id: 'provider-a', name_en: 'Fixture plumbing', name_ru: 'Fixture plumbing', description_en: 'Old description', price: 84.5, currency: 'EUR', images: ['synthetic.webp'], is_active: false, approval_status: 'pending', category_id: 'plumbing' },
  services: [] as unknown[],
}));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'admin-a' }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useAdmin', () => ({
  useAdminCheck: () => ({ isAdmin: true, isLoading: false }),
  useAdminProviders: () => ({ providers: [state.provider] }),
  useAdminCategories: () => ({ categories: [{ id: 'plumbing', name_en: 'Plumbing', name_ru: 'Plumbing', parent_id: null }] }),
  useAdminServices: () => ({ services: state.services, createService: state.create, updateService: state.update }),
}));
vi.mock('@/hooks/useAdminContentCreation', () => ({ useOnBehalfContext: () => ({ isOnBehalf: false }) }));
vi.mock('@/hooks/useAutoTranslate', () => ({ useAutoTranslate: () => ({}) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB', symbol: '฿' }) }));
vi.mock('@/components/admin/AdminCatalogHub', () => ({ AdminCatalogHub: () => null }));
vi.mock('@/components/admin/OnBehalfBanner', () => ({ OnBehalfBanner: () => null }));
vi.mock('@/components/upload/ImageUpload', () => ({
  MultiImageUpload: ({ value, onChange }: { value: string[]; onChange: (images: string[]) => void }) =>
    value?.length ? <button onClick={() => onChange([])}>Remove last fixture photo</button> : null,
}));
vi.mock('../AdminUnifiedCatalog', () => ({ default: () => null }));
vi.mock('../AdminMasterCatalog', () => ({ default: () => null }));
vi.mock('../AdminTaxonomyManager', () => ({ default: () => null }));
vi.mock('../AdminLookups', () => ({ default: () => null }));

function open(search: string) {
  return render(<MemoryRouter initialEntries={[`/admin/catalog?tab=services${search}`]}><Routes>
    <Route path="/admin/catalog" element={<AdminCatalogWorkspace />} />
  </Routes></MemoryRouter>);
}

async function edit() {
  open('&provider=provider-a');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'Enter' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
  return screen.findByRole('dialog', { name: 'Edit Service' });
}

beforeEach(() => {
  vi.clearAllMocks();
  state.create.mockResolvedValue({ error: null });
  state.update.mockResolvedValue({ error: null });
  state.provider.is_active = true;
  state.services = [state.service];
});

describe('service catalogue authoring entry', () => {
  it('creates a city-currency draft without bypassing publication and without unsupported fields', async () => {
    open('&provider=provider-a&action=new');
    const dialog = await screen.findByRole('dialog', { name: 'New Service' });
    fireEvent.change(within(dialog).getByLabelText('Name (EN) *'), { target: { value: '  New fixture  ' } });
    fireEvent.change(within(dialog).getByLabelText('Price'), { target: { value: '2,50' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(state.create).toHaveBeenCalledWith({
      provider_id: 'provider-a', category_id: null, name_en: 'New fixture', name_ru: 'New fixture',
      description_en: null, description_ru: null, price: 2.5, currency: 'THB', duration_minutes: null, images: [], is_active: false,
    }));
    expect(state.update).not.toHaveBeenCalled();
  });

  it('retains foreign currency and clears optional text and the last image on the same service', async () => {
    const dialog = await edit();
    expect(within(dialog).getByRole('combobox', { name: 'Currency' })).toHaveTextContent('EUR');
    fireEvent.change(within(dialog).getByLabelText('Description (EN)'), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove last fixture photo' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(state.update).toHaveBeenCalledWith('service-a', expect.objectContaining({
      currency: 'EUR', price: 84.5, description_en: null, images: [], is_active: false,
    })));
    expect(state.update.mock.calls[0][1]).not.toHaveProperty('approval_status');
  });

  it('blocks malformed numbers and does not publish if the supplier is inactive', async () => {
    const dialog = await edit();
    const price = within(dialog).getByLabelText('Price');
    fireEvent.change(price, { target: { value: '123x' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save$/ }));
    expect(state.update).not.toHaveBeenCalled();
    fireEvent.change(price, { target: { value: '85' } });
    state.provider.is_active = false;
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve and publish' }));
    expect(state.update).not.toHaveBeenCalled();
    state.provider.is_active = true;
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve and publish' }));
    await waitFor(() => expect(state.update).toHaveBeenCalledWith('service-a', expect.objectContaining({
      approval_status: 'approved', is_active: true, currency: 'EUR', price: 85,
    })));
  });
});
