import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AdminProviders from '../AdminProviders';
import { ProviderDetailHeader } from '@/components/admin/provider-detail/ProviderDetailHeader';
import type { Provider } from '@/hooks/useAdmin';

const state = vi.hoisted(() => ({
  language: 'en', isLoading: false, isAdmin: true, adminLoading: false,
  providers: [] as Provider[],
  create: vi.fn(), update: vi.fn(), remove: vi.fn(), error: vi.fn(), from: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' }, isLoading: false }) }));
vi.mock('@/hooks/useAdmin', () => ({
  useAdminCheck: () => ({ isAdmin: state.isAdmin, isLoading: state.adminLoading }),
  useAdminProviders: () => ({ providers: state.providers, isLoading: state.isLoading, createProvider: state.create, updateProvider: state.update, deleteProvider: state.remove }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));
vi.mock('@/components/admin/BusinessCardScanButton', () => ({ BusinessCardScanButton: () => null }));
vi.mock('@/components/admin/ContentCreatorMenu', () => ({ ContentCreatorMenu: () => null }));
vi.mock('sonner', () => ({ toast: { error: state.error, success: vi.fn() } }));

const provider = {
  id: 'provider-b', name: 'Synthetic Provider B', business_category: 'legal',
  description_en: 'Existing provider description', email: 'provider-b@example.test',
  is_active: true, is_verified: false, created_at: '2026-01-01', updated_at: '2026-01-01',
};
const Location = () => <output aria-label="Current route">{useLocation().pathname}{useLocation().search}</output>;
function view(path: string) {
  return <MemoryRouter initialEntries={[path]}><Location /><Routes>
    <Route path="/admin/providers/:id" element={<ProviderDetailHeader provider={{ ...provider, business_category: 'legal' }} />} />
    <Route path="/admin/providers" element={<AdminProviders />} />
    <Route path="/" element={<p>Home</p>} />
  </Routes></MemoryRouter>;
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  state.language = 'en'; state.isLoading = false; state.isAdmin = true; state.adminLoading = false;
  state.providers = [{ ...provider, id: 'provider-a', name: 'Synthetic Provider A' }, provider] as Provider[];
});

describe('provider edit query route', () => {
  it.each(['en', 'ru'])('opens the matching populated edit form from detail and cancels without writes (%s)', async language => {
    state.language = language;
    const ru = language === 'ru';
    render(view('/admin/providers/provider-b'));
    fireEvent.click(screen.getByRole('button', { name: ru ? 'Редактировать' : 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: ru ? 'Редактировать провайдера' : 'Edit Provider' });
    expect(within(dialog).getByDisplayValue(provider.name)).toBeTruthy();
    expect(within(dialog).getByDisplayValue('Existing provider description')).toBeTruthy();
    expect(within(dialog).getByDisplayValue('provider-b@example.test')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: ru ? 'Отмена' : 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin/providers');
    expect(state.create).not.toHaveBeenCalled(); expect(state.update).not.toHaveBeenCalled();
    expect(state.remove).not.toHaveBeenCalled(); expect(state.from).not.toHaveBeenCalled();
  });
  it('waits for data, ignores list filtering for target selection, and preserves unrelated query state', async () => {
    state.isLoading = true; state.providers = [];
    const result = render(view('/admin/providers?edit=provider-b&q=unmatched&filter=inactive'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('edit=provider-b');
    state.isLoading = false; state.providers = [provider as Provider];
    result.rerender(view('/admin/providers?edit=provider-b&q=unmatched&filter=inactive'));
    expect(await screen.findByRole('dialog', { name: 'Edit Provider' })).toBeTruthy();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin/providers?q=unmatched&filter=inactive');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'new search' } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('does not treat an unknown edit target as a create command', async () => {
    render(view('/admin/providers?edit=unavailable&action=new&q=keep'));
    await waitFor(() => expect(state.error).toHaveBeenCalledWith('Provider not found or unavailable'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin/providers?q=keep');
    expect(state.from).not.toHaveBeenCalled();
  });
  it('keeps the existing admin gate before processing edit', () => {
    state.isAdmin = false;
    render(view('/admin/providers?edit=provider-b'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Home')).toBeTruthy();
    expect(state.from).not.toHaveBeenCalled();
  });
  it('preserves the new-provider deep link and consumes it once', async () => {
    render(view('/admin/providers?action=new&q=keep'));
    const dialog = await screen.findByRole('dialog', { name: 'New Provider' });
    expect(within(dialog).getByPlaceholderText('Thai Massage & Spa')).toHaveValue('');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'other' } });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
