import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OffplanDetail from '../OffplanDetail';
const state = vi.hoisted(() => ({ isLoading: false, isError: false, retry: vi.fn(), docs: [] as Array<Record<string, unknown>>, media: null as Record<string, unknown> | null, project: null as Record<string, unknown> | null }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProject: () => ({ data: state.project, ...state, refetch: state.retry }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: state.media }) }));
vi.mock('@/components/newbuilds/NewbuildProjectDeepTabs', () => ({ NewbuildProjectDeepTabs: () => null }));
vi.mock('@/hooks/useProjectDocuments', () => ({ useProjectDocuments: () => ({ data: state.docs }), DOCUMENT_CATEGORIES: [] }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('Hosted data forbidden in isolated detail QA'); } }) }));
function Position() { const l = useLocation(); return <output data-testid="position">{l.pathname + l.search + l.hash}</output>; }
vi.mock('@/components/property/DevelopmentUnitsSection', () => ({ DevelopmentUnitsSection: ({ onSelectUnit }: { onSelectUnit: (unit: unknown) => void }) => <><p>Synthetic project units boundary</p><button onClick={() => onSelectUnit({ id: 'unit-a', property_id: 'property-a' })}>Ask unit A</button></> }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => open ? <div><button onClick={() => onOpenChange(false)}>Close enquiry</button>{children}</div> : null }));
vi.mock('@/components/landings/LandingLeadForm', () => ({ LandingLeadForm: ({ contextMetadata, universalRequestType }: { contextMetadata: unknown; universalRequestType: string }) => <output data-testid="enquiry-context" data-request-type={universalRequestType}>{JSON.stringify(contextMetadata)}</output> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}), createBreadcrumbSchema: () => ({}) }));
beforeEach(() => { state.docs = []; state.media = null; state.project = null; state.isLoading = false; state.isError = false; state.retry.mockClear(); });
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
  fireEvent.mouseDown(screen.getByRole('tab',{name:'Units and plans'}),{button:0,ctrlKey:false});fireEvent.click(screen.getByRole('button', { name: 'Ask unit A' }));
  expect(JSON.parse(screen.getByTestId('enquiry-context').textContent!)).toMatchObject({ project_id: 'synthetic-project', unit_id: 'unit-a', property_id: 'property-a', request_only: true });
  fireEvent.click(screen.getByRole('button', { name: 'Close enquiry' }));
  fireEvent.click(screen.getAllByRole('button').find(button => button.textContent?.includes('Discuss'))!);
  const context = JSON.parse(screen.getByTestId('enquiry-context').textContent!);
  expect(context).toMatchObject({ project_id: 'synthetic-project', intent: 'consultation', request_only: true, schema_version: 1 });
  expect(screen.getByTestId('enquiry-context')).toHaveAttribute('data-request-type', 'property_consultation');
  expect(context).not.toHaveProperty('unit_id');
  expect(context).not.toHaveProperty('property_id');
});

it('keeps document requests explicit and clears a previous unit context', () => {
 state.project = {id:'synthetic-project',nameEn:'Synthetic project',nameRu:'Проект',district:'Bang Tao',amenities:[],coverImage:null};
 render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>);
 fireEvent.mouseDown(screen.getByRole('tab',{name:'Units and plans'}),{button:0,ctrlKey:false});fireEvent.click(screen.getByRole('button',{name:'Ask unit A'}));fireEvent.click(screen.getByRole('button',{name:'Close enquiry'}));
 fireEvent.mouseDown(screen.getByRole('tab',{name:'Docs'}),{button:0,ctrlKey:false});fireEvent.click(screen.getByRole('button',{name:'Request document package'}));
 const context=JSON.parse(screen.getByTestId('enquiry-context').textContent!);expect(context).toMatchObject({project_id:'synthetic-project',intent:'documents',request_only:true});expect(context).not.toHaveProperty('unit_id');
 expect(screen.getByTestId('enquiry-context')).toHaveAttribute('data-request-type','property_consultation');
});

it('shows the ordered public project gallery, selects a photo and opens only a safe video link', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [], coverImage: '/cover.jpg' };
  state.media = { id: 'synthetic-project', gallery_urls: ['/second.jpg', '/third.jpg', '/cover.jpg'], video_url: 'https://youtu.be/abcdefghijk' };
  render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>);
  const secondPhoto = screen.getByRole('button', { name: 'Photo 2 of 3' });
  expect(screen.getByRole('img', { name: 'Synthetic project · Photo 1 of 3' })).toHaveAttribute('src', '/cover.jpg');
  fireEvent.click(secondPhoto);
  expect(secondPhoto).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: 'Synthetic project · Photo 2 of 3' })).toHaveAttribute('src', '/second.jpg');
  expect(screen.getByRole('link', { name: 'Project video (opens in new tab)' })).toHaveAttribute('href', 'https://youtu.be/abcdefghijk');
});


it('uses one tab row, preserves URL context, and shows only eligible document links', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [] };
  state.media = { id: 'synthetic-project', description_en: 'Synthetic editorial overview.' };
  state.docs = [
    { id: 'pub', project_id: 'synthetic-project', is_current: true, title: 'Construction update', category: 'construction', visibility: 'public', file_url: 'https://synthetic.supabase.co/storage/v1/object/sign/project-documents/synthetic-project/construction/public-update.pdf?token=synthetic.test', version: 2 },
    { id: 'private', project_id: 'synthetic-project', is_current: true, title: 'Private document', category: 'contracts', visibility: 'kyc', file_url: '/restricted.pdf', version: 1 },
    { id: 'wrong-project', project_id: 'synthetic-project', is_current: true, title: 'Other project attachment', category: 'construction', visibility: 'public', file_url: 'https://synthetic.supabase.co/storage/v1/object/sign/project-documents/other-project/construction/update.pdf?token=synthetic.test', version: 1 },
    { id: 'archive', project_id: 'synthetic-project', is_current: false, title: 'Superseded file', category: 'construction', visibility: 'public', file_url: '/assets/old.pdf', version: 1 },
    { id: 'misfiled', project_id: 'other-project', is_current: true, title: 'Misfiled public row', category: 'construction', visibility: 'public', file_url: '/assets/misfiled.pdf', version: 1 },
    { id: 'bad', project_id: 'synthetic-project', is_current: true, title: 'Unsafe URL', category: 'other', visibility: 'public', file_url: 'javascript:alert(1)', version: 1 },
  ];
  const catalogue = '/property/offplan/search?budget=5to10';
  const detail = '/property/offplan/synthetic-project?ref=fixture';
  render(<MemoryRouter initialEntries={[{ pathname: '/property/offplan/synthetic-project', search: '?ref=fixture', state: { publicJourneyOrigin: { href: catalogue, key: 'source' } } }]}>
    <Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /><Route path="/property/offplan/search" element={<p>Catalogue</p>} /></Routes><Position />
  </MemoryRouter>);
  expect(screen.getAllByRole('tablist')).toHaveLength(1);
  expect(screen.getByText('Synthetic editorial overview.')).toBeVisible();
  fireEvent.mouseDown(screen.getByRole('tab', { name: /^Docs/ }), { button: 0, ctrlKey: false });
  expect(screen.getByTestId('position')).toHaveTextContent(detail + '#project-documents');
  expect(screen.getByRole('link', { name: /Construction update/ })).toHaveAttribute('href', 'https://synthetic.supabase.co/storage/v1/object/sign/project-documents/synthetic-project/construction/public-update.pdf?token=synthetic.test');
  expect(screen.getByRole('button', { name: 'Request document package' })).toBeVisible();
  expect(screen.queryByText('Private document')).not.toBeInTheDocument();
  expect(screen.queryByText('Unsafe URL')).not.toBeInTheDocument();
  expect(screen.queryByText('Superseded file')).not.toBeInTheDocument();
  expect(screen.queryByText('Misfiled public row')).not.toBeInTheDocument();
  expect(screen.queryByText('Other project attachment')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('position')).toHaveTextContent(catalogue);
});
