import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OffplanDetail from '../OffplanDetail';
const state = vi.hoisted(() => ({ isLoading: false, isError: false, retry: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProject: () => ({ data: null, ...state, refetch: state.retry }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: null }) }));
vi.mock('@/hooks/useProjectDocuments', () => ({ useProjectDocuments: () => ({ data: [] }), DOCUMENT_CATEGORIES: [] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('Hosted data forbidden in isolated detail QA'); } }) }));
function Position() { const l = useLocation(); return <output data-testid="position">{l.pathname + l.search}</output>; }
beforeEach(() => { state.isLoading = false; state.isError = false; state.retry.mockClear(); });
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
