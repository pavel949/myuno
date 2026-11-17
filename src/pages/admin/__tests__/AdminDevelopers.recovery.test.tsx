import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ error: null as Error | null, isLoading: false, isFetching: false, refetch: vi.fn(), data: [] as unknown[], language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useAdminDevelopers', () => ({
  useAdminDevelopers: () => fixture,
  useCreateDeveloper: () => ({}), useUpdateDeveloper: () => ({}), useDeleteDeveloper: () => ({}),
}));
vi.mock('@/components/forms/TranslatableInput', () => ({ TranslatableInput: () => null }));
vi.mock('@/components/upload/AirbnbStyleImageUpload', () => ({ AirbnbStyleImageUpload: () => null }));
vi.mock('@/components/admin/developers/BulkLogoUploadModal', () => ({ BulkLogoUploadModal: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('No real network allowed'); } }) }));
import AdminDevelopers from '../AdminDevelopers';
beforeEach(() => { fixture.error = null; fixture.isLoading = false; fixture.isFetching = false; fixture.data = []; fixture.language = 'en'; vi.clearAllMocks(); });
afterEach(cleanup);
const show = () => render(<MemoryRouter><AdminDevelopers /></MemoryRouter>);
it('distinguishes load errors from an empty registry and retries safely', () => {
  fixture.error = new Error('private backend detail'); show();
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
  expect(screen.queryByText(/No developers yet/)).toBeNull();
  expect(screen.queryByText('private backend detail')).toBeNull();
  expect(screen.getAllByText('—')).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'Bulk Logos' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(fixture.refetch).toHaveBeenCalledOnce();
});
it('keeps a confirmed empty catalogue distinct', () => {
  show(); expect(screen.getByText('No developers yet. Add your first!')).toBeVisible();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getAllByText('0')).toHaveLength(4);
});
it('does not claim zero counts while loading', () => {
  fixture.isLoading = true; show(); expect(screen.getAllByText('—')).toHaveLength(4);
  expect(screen.queryByText(/No developers yet/)).toBeNull();
});
it('localizes recovery and prevents overlapping retries', () => {
  fixture.language = 'ru'; fixture.error = new Error('offline'); fixture.isFetching = true; show();
  expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить данные');
  expect(screen.getByRole('button', { name: 'Повторить' })).toBeDisabled();
});
