import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminUnifiedCatalog from '../AdminUnifiedCatalog';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminProviders: () => ({ providers: [{ id: 'provider-1', name: 'Provider One', is_verified: true }] }) }));
vi.mock('@/components/admin/catalog/UnifiedCatalogTable', () => ({ UnifiedCatalogTable: ({ providerId }: { providerId?: string }) => <output data-testid="records">{providerId || 'all'}</output> }));
vi.mock('@/components/admin/ContentCreatorMenu', () => ({ ContentCreatorMenu: ({ providerId }: { providerId: string }) => <output data-testid="creator">{providerId}</output> }));
vi.mock('@/components/uno/PageContainer', () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => <select aria-label="Provider" value={value} onChange={event => onValueChange(event.target.value)}><option value="_all">All providers</option><option value="provider-1">Provider One</option></select>,
  SelectContent: () => null, SelectItem: () => null, SelectTrigger: () => null, SelectValue: () => null,
}));
afterEach(cleanup);
const openTab = (name: string) => fireEvent.mouseDown(screen.getByRole('tab', { name }), { button: 0, ctrlKey: false });
describe('existing catalog records and canonical editors', () => {
  it.each(['ru', 'en'])('opens real domain editors in %s', language => {
    state.language = language;
    render(<MemoryRouter><AdminUnifiedCatalog /></MemoryRouter>);
    expect(screen.getByTestId('records')).toHaveTextContent('all');
    openTab(language === 'ru' ? 'Редакторы каталогов' : 'Catalog editors');
    const destinations = screen.getAllByRole('link').map(link => link.getAttribute('href'));
    expect(destinations).toContain('/admin/experiences');
    expect(destinations).toContain('/admin/catalog?tab=services');
    expect(destinations).toContain('/admin/properties');
    expect(destinations).not.toContain('/admin/catalog');
  });
  it('keeps provider context when switching between editors and records', () => {
    state.language = 'en';
    render(<MemoryRouter><AdminUnifiedCatalog /></MemoryRouter>);
    fireEvent.change(screen.getByRole('combobox', { name: 'Provider' }), { target: { value: 'provider-1' } });
    expect(screen.getByTestId('records')).toHaveTextContent('provider-1');
    expect(screen.getByTestId('creator')).toHaveTextContent('provider-1');
    openTab('Catalog editors');
    openTab('Data');
    expect(screen.getByTestId('records')).toHaveTextContent('provider-1');
    expect(screen.getByTestId('creator')).toHaveTextContent('provider-1');
  });
});
