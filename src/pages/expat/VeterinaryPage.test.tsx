import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VeterinaryPage from './VeterinaryPage';

const fixture = vi.hoisted(() => ({
  loading: false,
  clinics: [{ id: 'vet-one', name_ru: 'Тестовая клиника', services: [], specializations: [], languages: [], rating: 0, is_featured: false }],
}));
vi.mock('@/hooks/useVeterinaryClinics', () => ({ useVeterinaryClinics: () => ({ clinics: fixture.loading ? [] : fixture.clinics, isLoading: fixture.loading, getName: (clinic: { name_ru: string }) => clinic.name_ru, getDescription: () => '' }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: React.PropsWithChildren) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
function Probe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="url">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Back test</button><button onClick={() => navigate(1)}>Forward test</button></>;
}
const tree = (entry: string) => <MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><VeterinaryPage /><Probe /></MemoryRouter>;
beforeEach(() => { fixture.loading = false; });
describe('Veterinary clinic public deep links', () => {
  it('waits for the public clinics query then opens the linked clinic', () => {
    fixture.loading = true;
    const { rerender } = render(tree('/veterinary?clinic=vet-one'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fixture.loading = false;
    rerender(tree('/veterinary?clinic=vet-one'));
    expect(screen.getByRole('dialog', { name: 'Тестовая клиника' })).toBeInTheDocument();
  });
  it('does not open unknown/non-public IDs', () => {
    render(tree('/veterinary?clinic=not-in-public-query'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('list selection sets the URL and dialog close preserves unrelated params', () => {
    render(tree('/veterinary?campaign=map'));
    fireEvent.click(screen.getByRole('heading', { name: 'Тестовая клиника' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/veterinary?campaign=map&clinic=vet-one');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('/veterinary?campaign=map');
  });
  it('synchronizes selection with Back and Forward', () => {
    render(tree('/veterinary'));
    fireEvent.click(screen.getByRole('heading', { name: 'Тестовая клиника' }));
    // Radix makes controls outside a modal inaccessible; history is still usable.
    fireEvent.click(screen.getByText('Back test'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Forward test'));
    expect(screen.getByRole('dialog', { name: 'Тестовая клиника' })).toBeInTheDocument();
  });
});
