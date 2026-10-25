import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import OffplanIndex from '../OffplanIndex';
import { AREA_GUIDES, areaInventoryFilters, areaSearchHref } from '@/content/areas/areaRegistry';
const state = vi.hoisted(() => ({ filters: {} as { district?: string } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({
 useOffplanProjects: (filters: { district?: string }) => { state.filters = filters; return { data: [], isLoading: false }; },
 useProjectDistricts: () => ({ data: ['Laguna', 'Bang Tao', 'Nai Yang', 'Kamala'] }),
}));
vi.mock('@/hooks/useDevelopers', () => ({ useDevelopers: () => ({ data: [] }) }));
vi.mock('@/components/property/SaveOffplanSearchDialog', () => ({ SaveOffplanSearchDialog: () => null }));
vi.mock('@/components/property/OffplanProjectCard', () => ({ OffplanProjectCard: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createBreadcrumbSchema: () => ({}) }));
afterEach(cleanup);
function History() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="url">{location.search}</output><button onClick={() => navigate('?district=Kamala&opaque=keep')}>Other district</button><button onClick={() => navigate(-1)}>Back</button></>; }
function mount(entry: string) { return render(<MemoryRouter initialEntries={[entry]}><History /><Routes><Route path="/property/offplan" element={<OffplanIndex />} /></Routes></MemoryRouter>); }
it.each(AREA_GUIDES)('hydrates $key from its area link with exactly the count resolver district', area => {
 mount(areaSearchHref(area, 'projects'));
 expect(state.filters.district).toBe(areaInventoryFilters(area).projects.district);
});
it('follows history and clears only the district query when filters reset', async () => {
 mount('/property/offplan?district=Laguna&opaque=keep');
 expect(state.filters.district).toBe('Laguna');
 fireEvent.click(screen.getByRole('button', { name: 'Other district' }));
 await waitFor(() => expect(state.filters.district).toBe('Kamala'));
 fireEvent.click(screen.getByRole('button', { name: 'Back' }));
 await waitFor(() => expect(state.filters.district).toBe('Laguna'));
 fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
 await waitFor(() => expect(state.filters.district).toBeUndefined());
 expect(screen.getByTestId('url').textContent).toContain('opaque=keep');
});
