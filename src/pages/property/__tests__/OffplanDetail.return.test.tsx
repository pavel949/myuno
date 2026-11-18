import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OffplanDetail from '../OffplanDetail';
const state = vi.hoisted(() => ({ isLoading: false, isError: false, retry: vi.fn(), project: null as Record<string, unknown> | null }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProject: () => ({ data: state.project, ...state, refetch: state.retry }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: null }) }));
vi.mock('@/hooks/useProjectDocuments', () => ({ useProjectDocuments: () => ({ data: [] }), DOCUMENT_CATEGORIES: [] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('Hosted data forbidden in isolated detail QA'); } }) }));
function Position() { const l = useLocation(); return <output data-testid="position">{l.pathname + l.search}</output>; }
vi.mock('@/components/property/DevelopmentUnitsSection', () => ({ DevelopmentUnitsSection: () => <p>Synthetic project units boundary</p> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}), createBreadcrumbSchema: () => ({}) }));
beforeEach(() => { state.project = null; state.isLoading = false; state.isError = false; state.retry.mockClear(); });
afterEach(cleanup);
describe('newbuild detail keeps the complete public catalogue return in every read state', () => {
  it.each(['loading', 'error', 'missing'])('returns from %s to the original budget/search URL', mode => {
    state.isLoading = mode === 'loading'; state.isError = mode === 'error';
    const source = '/property/offplan?budget=lt5&q=Ocean&ref=fixture';
    render(<MemoryRouter initialEntries={[{ pathname: '/property/offplan/synthetic-project', state: { publicJourneyOrigin: { href: source, key: 'source' } } }]}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /><Route path="/property/offplan" element={<p>Catalogue</p>} /></Routes><Position /></MemoryRouter>);
    if (mode === 'error') { expect(screen.getByRole('alert')).toBeVisible(); expect(screen.queryByText('Project not found')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(state.retry).toHaveBeenCalledOnce(); }
    fireEvent.click(screen.getByRole('button', { name: mode === 'missing' ? 'Back to list' : 'Go back' }));
    expect(screen.getByTestId('position')).toHaveTextContent(source);
  });
});

it('opens the unit anchor only after the requested project has loaded', async () => {
  const scroll = vi.fn(); const original = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = scroll;
  const tree = () => <MemoryRouter initialEntries={['/property/offplan/synthetic-project#project-units']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>;
  try {
    state.isLoading = true; const view = render(tree()); expect(scroll).not.toHaveBeenCalled();
    state.isLoading = false; state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', nameRu: 'Тестовый проект', district: 'Bang Tao', amenities: [], coverImage: null };
    view.rerender(tree()); expect(screen.getByText('Synthetic project units boundary')).toBeInTheDocument();
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'start' }));
    expect(document.getElementById('project-units')).toBeTruthy();
  } finally { if (original) HTMLElement.prototype.scrollIntoView = original; else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView; }
});
