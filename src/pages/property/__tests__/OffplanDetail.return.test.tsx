import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OffplanDetail from '../OffplanDetail';
const state = vi.hoisted(() => ({
  isLoading: false, isError: false, retry: vi.fn(), docs: [] as Array<Record<string, unknown>>,
  docsLoading: false, docsError: false, docsRetry: vi.fn(), docsRead: vi.fn(),
  media: null as Record<string, unknown> | null, project: null as Record<string, unknown> | null,
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `THB ${n}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/hooks/useOffplanProjects', () => ({ useOffplanProject: () => ({ data: state.project, ...state, refetch: state.retry }) }));
vi.mock('@/hooks/useDevelopers', () => ({ useDeveloper: () => ({ data: null }) }));
vi.mock('@/hooks/useNewbuildProjects', () => ({ useNewbuildProject: () => ({ data: state.media }) }));
vi.mock('@/components/newbuilds/NewbuildProjectDeepTabs', () => ({ NewbuildProjectDeepTabs: () => null }));
vi.mock('@/hooks/useProjectDocuments', () => ({
  useProjectDocuments: (...args: unknown[]) => {
    state.docsRead(...args);
    return { data: state.docs, isLoading: state.docsLoading, isError: state.docsError, refetch: state.docsRetry };
  },
  DOCUMENT_CATEGORIES: [],
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw new Error('Hosted data forbidden in isolated detail QA'); } }) }));
function Position() { const l = useLocation(); return <output data-testid="position">{l.pathname + l.search + l.hash}</output>; }
vi.mock('@/components/property/DevelopmentUnitsSection', () => ({ DevelopmentUnitsSection: ({ onSelectUnit }: { onSelectUnit: (unit: unknown) => void }) => <><p>Synthetic project units boundary</p><button onClick={() => onSelectUnit({ id: 'unit-a', property_id: 'property-a' })}>Ask unit A</button></> }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => open ? <div><button onClick={() => onOpenChange(false)}>Close enquiry</button>{children}</div> : null }));
vi.mock('@/components/landings/LandingLeadForm', () => ({ LandingLeadForm: ({ contextMetadata, universalRequestType }: { contextMetadata: unknown; universalRequestType: string }) => <output data-testid="enquiry-context" data-request-type={universalRequestType}>{JSON.stringify(contextMetadata)}</output> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}), createBreadcrumbSchema: () => ({}) }));
beforeEach(() => {
  state.docs = []; state.docsLoading = false; state.docsError = false; state.docsRead.mockClear(); state.docsRetry.mockClear();
  state.media = null; state.project = null; state.isLoading = false; state.isError = false; state.retry.mockClear();
});
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

it('opens only the verified developer price source and labels the official renderings', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [], coverImage: '/cover.jpg', sourceUrl: 'https://www.sudaraphuket.com/pricing' };
  state.media = { id: 'synthetic-project', images: ['/catalog/sudara/main-pool.webp'] };
  const app = () => <MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>;
  const view = render(app());
  const pricing = screen.getByRole('link', { name: /Developer’s live pricing/ });
  expect(pricing).toHaveAttribute('href', 'https://www.sudaraphuket.com/pricing');
  expect(pricing).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.getByText('The gallery includes developer renderings of the project.')).toBeVisible();
  state.project.sourceUrl = 'https://www.sudaraphuket.com.invalid/pricing';
  view.rerender(app());
  expect(screen.queryByRole('link', { name: /Developer’s live pricing/ })).not.toBeInTheDocument();
});

it('uses one tab row, preserves URL context, and shows only eligible document links', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [] };
  state.media = { id: 'synthetic-project', description_en: 'Synthetic editorial overview.' };
  const officialApproval = 'https://eia.onep.go.th/services/web//doc/download-eia-approval?id=12345';
  state.docs = [
    { id: 'official', project_id: 'synthetic-project', is_current: true, title: 'Official environmental approval', category: 'permits', visibility: 'public', file_url: officialApproval, version: 1 },
    { id: 'official-private', project_id: 'synthetic-project', is_current: true, title: 'Private permit record', category: 'permits', visibility: 'admin_only', file_url: officialApproval, version: 1 },
    { id: 'official-other', project_id: 'other-project', is_current: true, title: 'Approval for a different project', category: 'permits', visibility: 'public', file_url: officialApproval, version: 1 },
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
  const approvalLink = screen.getByRole('link', { name: /Official environmental approval/ });
  expect(approvalLink).toHaveAttribute('href', officialApproval);
  expect(approvalLink).toHaveAttribute('rel', 'noopener noreferrer');
  expect(screen.queryByText('Private permit record')).not.toBeInTheDocument();
  expect(screen.queryByText('Approval for a different project')).not.toBeInTheDocument();
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

describe('project reference plans', () => {
  const hosted = '/catalog/synthetic-project/floor-plans/';
  const documentRow = {
    id: 'type-example', project_id: 'synthetic-project', is_current: true, title: 'Type A layout',
    category: 'floor_plans', visibility: 'public', file_url: hosted + 'type-a.webp', version: 1,
  };
  const tree = (hash = '#project-units') => (
    <MemoryRouter initialEntries={['/property/offplan/synthetic-project?ref=plans' + hash]}>
      <Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes>
      <Position />
    </MemoryRouter>
  );
  beforeEach(() => {
    state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [] };
  });

  it('separates site plan, illustrations and exact units without showing unsanctioned plan files', () => {
    state.docs = [
      documentRow,
      { ...documentRow, id: 'duplicate', title: 'Duplicate copy' },
      { ...documentRow, id: 'master', title: 'Published master site diagram', file_url: hosted + 'masterplan.webp' },
      { ...documentRow, id: 'pdf', title: 'Type B PDF', file_url: hosted + 'type-b.pdf' },
      { ...documentRow, id: 'private', title: 'Hidden draft', visibility: 'admin_only' },
      { ...documentRow, id: 'archive', title: 'Old plan', is_current: false },
      { ...documentRow, id: 'misfiled', title: 'Off-project plan', project_id: 'different-project' },
      { ...documentRow, id: 'malicious', title: 'SVG plan', file_url: hosted + 'active.svg' },
      { ...documentRow, id: 'query', title: 'Query plan', file_url: hosted + 'type-z.webp?ref=external' },
      { ...documentRow, id: 'remote', title: 'Remote image', file_url: 'https://outside.invalid/type-c.webp' },
      { ...documentRow, id: 'wrongfolder', title: 'Wrong folder', file_url: '/catalog/synthetic-project/documents/type-a.webp' },
      { ...documentRow, id: 'wrongcategory', title: 'Brochure artwork', category: 'marketing', file_url: hosted + 'brochure.webp' },
    ];
    const view = render(tree());
    expect(state.docsRead).toHaveBeenCalledWith('synthetic-project', { publicOnly: true });
    expect(screen.getByRole('heading', { name: 'Site plan' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Typical layouts' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Individual units' })).toBeVisible();
    expect(screen.getByText('Reference plans only. Total area may include outdoor space. An individual unit’s layout, price and availability must be confirmed separately.')).toBeVisible();
    const raster = screen.getByRole('link', { name: 'Type A layout: Open full size (new tab)' });
    expect(raster).toHaveAttribute('href', documentRow.file_url);
    expect(raster).toHaveAttribute('rel', 'noopener noreferrer');
    expect(raster.querySelector('img')).toHaveAttribute('src', documentRow.file_url);
    const pdf = screen.getByRole('link', { name: 'Type B PDF: Open PDF (new tab)' });
    expect(pdf).toHaveAttribute('href', hosted + 'type-b.pdf');
    expect(pdf.querySelector('img')).toBeNull();
    expect(view.container.querySelectorAll('img[src*="/floor-plans/"]')).toHaveLength(2);
    expect(screen.queryByText(/Hidden draft|Old plan|Off-project plan|SVG plan|Query plan|Remote image|Wrong folder|Brochure artwork|Duplicate copy/)).not.toBeInTheDocument();
    fireEvent.error(raster.querySelector('img')!);
    expect(raster.querySelector('img')).toBeNull();
    expect(raster).toHaveAttribute('href', documentRow.file_url);
    fireEvent.click(screen.getByRole('button', { name: 'Ask unit A' }));
    expect(JSON.parse(screen.getByTestId('enquiry-context').textContent!)).toMatchObject({ project_id: 'synthetic-project', unit_id: 'unit-a', request_only: true });
  });

  it('reveals remaining plans on demand in document order without collapsing the site plan or inventory', () => {
    state.docs = [
      { ...documentRow, id: 'master', title: 'Synthetic masterplan', file_url: hosted + 'masterplan.webp' },
      ...Array.from({ length: 8 }, (_, index) => ({
        ...documentRow, id: `type-${index + 1}`, title: `Layout ${index + 1}`, file_url: hosted + `layout-${index + 1}.webp`,
      })),
    ];
    render(tree());
    expect(screen.getAllByRole('link', { name: /^Layout/ }).map(link => link.textContent)).toEqual(
      Array.from({ length: 6 }, (_, index) => `Layout ${index + 1}Open full size`),
    );
    const showAll = screen.getByRole('button', { name: 'Show all 8 layouts' });
    expect(showAll).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(showAll);
    expect(showAll).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: /^Layout/ })).toHaveLength(8);
    fireEvent.click(screen.getByRole('button', { name: 'Show fewer layouts' }));
    expect(screen.queryByRole('link', { name: /^Layout 8/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Site plan' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Individual units' })).toBeVisible();
  });

  it('links from Docs to Plans without duplicate cards or lost query context', () => {
    state.docs = [documentRow];
    render(tree('#project-documents'));
    const link = screen.getByRole('link', { name: 'See project plans' });
    expect(link).toHaveAttribute('href', '#project-units');
    expect(screen.queryByText('Type A layout')).not.toBeInTheDocument();
    expect(screen.queryByText('No public documents have been published yet.')).not.toBeInTheDocument();
    fireEvent.click(link);
    expect(screen.getByTestId('position')).toHaveTextContent('/property/offplan/synthetic-project?ref=plans#project-units');
    expect(screen.getByRole('link', { name: 'Type A layout: Open full size (new tab)' })).toBeVisible();
  });

  it('loads only when either materials tab opens and distinguishes pending, failure and empty results', () => {
    const view = render(tree('#project-overview'));
    expect(state.docsRead).toHaveBeenCalledWith(undefined, { publicOnly: true });
    state.docsLoading = true;
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Units and plans' }), { button: 0, ctrlKey: false });
    expect(screen.getByRole('status', { name: 'Loading plans' })).toBeVisible();
    state.docsLoading = false;
    state.docsError = true;
    state.docs = [documentRow];
    view.rerender(tree('#project-overview'));
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('Type A layout')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.docsRetry).toHaveBeenCalledOnce();
    state.docs = [];
    state.docsError = false;
    view.rerender(tree('#project-overview'));
    expect(screen.getByText('No project plans have been published here yet.')).toBeVisible();
    expect(screen.getByText('Synthetic project units boundary')).toBeVisible();
  });
});

it('identifies the Sudara show-unit photo distinctly from the architectural renderings', () => {
  state.project = { id: 'synthetic-project', nameEn: 'Synthetic project', district: 'Bang Tao', amenities: [], coverImage: '/cover.jpg' };
  const showUnit = '/catalog/sudara/sudara-show-unit-2br-garden.webp';
  state.media = { id: 'synthetic-project', images: ['/catalog/sudara/sudara-main-pool.webp', showUnit] };
  render(<MemoryRouter initialEntries={['/property/offplan/synthetic-project']}><Routes><Route path="/property/offplan/:id" element={<OffplanDetail />} /></Routes></MemoryRouter>);
  expect(screen.getByText('The gallery includes developer renderings of the project.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Photo 3 of 3' }));
  expect(screen.getByRole('img', { name: 'Synthetic project · Photo 3 of 3' })).toHaveAttribute('src', showUnit);
  expect(screen.getByText('Photo of the Sudara two-bedroom garden show unit. This is not a photo of a specific home for sale.')).toBeVisible();
  expect(screen.queryByText('The gallery includes developer renderings of the project.')).not.toBeInTheDocument();
});
