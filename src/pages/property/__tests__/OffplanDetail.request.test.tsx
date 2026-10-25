import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OffplanDetail from '../OffplanDetail';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `${n} THB` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: null }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProject: () => ({ data: { id: 'synthetic-project', nameEn: 'Synthetic project', nameRu: 'Тест', projectStatus: 'completed', amenities: [] }, isLoading: false }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: null }) }));
vi.mock('@/hooks/useProjectDocuments', () => ({ useProjectDocuments: () => ({ data: [] }), DOCUMENT_CATEGORIES: {} }));
vi.mock('@/components/newbuilds/ClearViewReport', () => ({ ClearViewReport: () => null }));
vi.mock('@/components/newbuilds/NewbuildProjectDeepTabs', () => ({ NewbuildProjectDeepTabs: () => null }));
vi.mock('@/components/newbuilds/BuyerProjectUnits', () => ({ BuyerProjectUnits: () => null }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}), createBreadcrumbSchema: () => ({}) }));
vi.mock('@/components/newbuilds/BuyerRequestForm', () => ({ BuyerRequestForm: (props: {projectId: string; intent: string}) => <output data-testid="request-context">{JSON.stringify(props)}</output> }));
afterEach(cleanup);
describe('actual project route CTA wiring', () => {
  it('consultation opens canonical buyer form with project context', () => { render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>); fireEvent.click(screen.getByRole('button', { name: 'Consultation' })); expect(screen.getByTestId('request-context')).toHaveTextContent('"projectId":"synthetic-project"'); expect(screen.getByTestId('request-context')).toHaveTextContent('"intent":"consultation"'); expect(screen.queryByText('Vertical not found')).toBeNull(); });
  it('document CTA preserves documents intent', async () => { render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>); fireEvent.mouseDown(screen.getByRole('tab', { name: 'Docs' }), { button: 0, ctrlKey: false }); fireEvent.click(await screen.findByRole('button', { name: 'Request document package' })); expect(screen.getByTestId('request-context')).toHaveTextContent('"intent":"documents"'); });
  it('resets intent after Documents → Close → Consultation on the same mounted page', async () => {
    render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Docs' }), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('button', { name: 'Request document package' }));
    expect(screen.getByTestId('request-context')).toHaveTextContent('"intent":"documents"');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Consultation' }));
    expect(screen.getByTestId('request-context')).toHaveTextContent('"intent":"consultation"');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Risk Report' }));
    expect(screen.getByTestId('request-context')).toHaveTextContent('"intent":"documents"');
  });

});
