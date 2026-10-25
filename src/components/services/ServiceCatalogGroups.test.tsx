import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ServiceCatalogGroups } from './ServiceCatalogGroups';
const state = vi.hoisted(() => ({ error: null as Error | null, loading: false, fromDB: true, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ isFromDB: state.fromDB, isLoading: state.loading, error: state.error, refetch: state.retry,
 categories: [{ id: 'cat-transport', services: [{ id: 'transfer', path: '/transport/airport-transfer', labelEn: 'Transfers', labelRu: 'Трансфер', status: 'available' }, { id: 'fast-track', path: '/transport/fast-track', labelEn: 'Fast Track', labelRu: 'Fast Track', status: 'available' }] }] }) }));
afterEach(() => { cleanup(); state.error = null; state.loading = false; state.fromDB = true; state.retry.mockClear(); });
it('searches active canonical groups and preserves distinct transfer and Fast Track destinations', () => {
 const { rerender } = render(<MemoryRouter><ServiceCatalogGroups search="fast track" /></MemoryRouter>);
 expect(screen.getByRole('link', { name: /Transfers/ })).toHaveAttribute('href', '/transport/airport-transfer');
 expect(screen.getByRole('link', { name: /Airport Fast Track/ })).toHaveAttribute('href', '/transport/fast-track');
 rerender(<MemoryRouter><ServiceCatalogGroups search="unmatched synthetic query" /></MemoryRouter>);
 expect(screen.queryByRole('link')).toBeNull();
});
it('does not promote static fallback or failed taxonomy into a supplied group', () => {
 state.fromDB = false;
 const { rerender } = render(<MemoryRouter><ServiceCatalogGroups search="" /></MemoryRouter>);
 expect(screen.queryByRole('link')).toBeNull();
 state.error = new Error('Synthetic read error');rerender(<MemoryRouter><ServiceCatalogGroups search="" /></MemoryRouter>);
 expect(screen.getByRole('alert')).toBeVisible();fireEvent.click(screen.getByRole('button', { name: 'Try again' }));expect(state.retry).toHaveBeenCalledOnce();
});
