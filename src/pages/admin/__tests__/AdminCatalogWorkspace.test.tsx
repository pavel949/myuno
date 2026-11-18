import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminCatalogWorkspace from '../AdminCatalogWorkspace';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('../AdminUnifiedCatalog', () => ({ default: () => <p>Existing listings editor</p> }));
vi.mock('../AdminMasterCatalog', () => ({ default: () => <p>Existing category editor</p> }));
vi.mock('../AdminTaxonomyManager', () => ({ default: () => <p>Existing taxonomy editor</p> }));
vi.mock('../AdminLookups', () => ({ default: () => <p>Existing lookup editor</p> }));
vi.mock('../AdminServices', () => ({ default: () => <p>Existing service editor</p> }));
const Probe = () => <output>{useLocation().search}</output>;
const show = (entry: string) => render(<MemoryRouter initialEntries={[entry]}><AdminCatalogWorkspace /><Probe /></MemoryRouter>);
afterEach(cleanup);
describe('catalog workspace navigation', () => {
  it('starts with task-based catalogs without mounting unrelated data editors', () => {
    show('/admin/catalog');
    expect(screen.getByRole('heading', { name: 'Впечатления' })).toBeInTheDocument();
    expect(screen.queryByText(/Existing .* editor/)).not.toBeInTheDocument();
  });
  it('keeps existing service deep links and provider query context', () => {
    show('/admin/catalog?tab=services&provider=synthetic');
    expect(screen.getByText('Existing service editor')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Каталог' }), { button: 0, ctrlKey: false });
    expect(screen.getByText('Existing listings editor')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('tab=catalog&provider=synthetic');
  });
  it('returns from an existing editor to the three catalogs', () => {
    show('/admin/catalog?tab=categories');
    fireEvent.click(screen.getByRole('link', { name: '← Все каталоги' }));
    expect(screen.getByRole('heading', { name: 'Сервисы' })).toBeInTheDocument();
  });
});
