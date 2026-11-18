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
vi.mock('@/components/property/DevelopmentUnitsSection', () => ({ DevelopmentUnitsSection: ({ onSelectUnit }: { onSelectUnit: (unit: unknown) => void }) => <><p>Synthetic project units boundary</p><button onClick={() => onSelectUnit({ id: 'unit-a', property_id: 'property-a' })}>Ask unit A</button></> }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => open ? <div><button onClick={() => onOpenChange(false)}>Close enquiry</button>{children}</div> : null }));
vi.mock('@/components/landings/LandingLeadForm', () => ({ LandingLeadForm: ({ contextMetadata, universalRequestType }: { contextMetadata: unknown; universalRequestType: string }) => <output data-testid="enquiry-context" data-request-type={universalRequestType}>{JSON.stringify(contextMetadata)}</output> }));
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

it('clears a previous unit when the project enquiry is reopened', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', nameRu: 'Тестовый проект', district: 'Bang Tao', amenities: [], coverImage: null };
  render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Ask unit A' }));
  expect(JSON.parse(screen.getByTestId('enquiry-context').textContent!)).toMatchObject({ project_id: 'synthetic-project', unit_id: 'unit-a', property_id: 'property-a', request_only: true });
  fireEvent.click(screen.getByRole('button', { name: 'Close enquiry' }));
  fireEvent.click(screen.getAllByRole('button').find(button => button.textContent?.includes('Discuss'))!);
  const context = JSON.parse(screen.getByTestId('enquiry-context').textContent!);
  expect(context).toMatchObject({ project_id: 'synthetic-project', intent: 'consultation', request_only: true, schema_version: 1 });
  expect(screen.getByTestId('enquiry-context')).toHaveAttribute('data-request-type', 'property_consultation');
  expect(context).not.toHaveProperty('unit_id');
  expect(context).not.toHaveProperty('property_id');
});
