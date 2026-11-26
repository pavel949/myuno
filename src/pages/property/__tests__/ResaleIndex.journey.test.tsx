import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ResaleIndex from '../ResaleIndex';
import ResaleDetail from '../ResaleDetail';
import ResaleOffer from '../ResaleOffer';

const state = vi.hoisted(() => ({
  language: 'en', failed: false, detailFailed: false, loading: false,
  filters: {} as Record<string, unknown>, retry: vi.fn(), rpc: vi.fn(),
  properties: [] as Record<string, unknown>[],
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (amount: number) => `THB ${amount}` }) }));
vi.mock('@/contexts/LocationContext', () => ({ useLocation: () => ({ currentCity: { default_currency: 'THB' } }) }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null, createRealEstateListingSchema: () => ({}) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: state.rpc } }));
vi.mock('@/components/ui/responsive-modal', () => ({
  ResponsiveModal: ({ open, title, children }: { open: boolean; title: string; children: React.ReactNode }) =>
    open ? <section role="dialog" aria-label={title}>{children}</section> : null,
}));
vi.mock('@/hooks/useResaleProperties', async importOriginal => ({
  ...await importOriginal<typeof import('@/hooks/useResaleProperties')>(),
  useResaleProperties: (filters: Record<string, unknown>) => {
    state.filters = filters;
    return { data: state.properties, isError: state.failed, isLoading: state.loading, refetch: state.retry };
  },
  useResaleProperty: (id: string) => ({ data: state.properties.find(item => item.id === id), isError: state.detailFailed, isLoading: false, refetch: state.retry }),
}));

function Trace() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="location">{location.pathname + location.search + location.hash}</output><button onClick={() => navigate(-1)}>History back</button></>;
}
function mount(path = '/property/resale') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/property/resale" element={<ResaleIndex />} /><Route path="/property/resale/:id" element={<ResaleDetail />} /><Route path="/property/resale/:id/offer" element={<ResaleOffer />} /></Routes><Trace /></MemoryRouter>);
}
function choose(label: string, value: string | RegExp) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name: value }));
}
const location = () => new URL(screen.getByTestId('location').textContent!, 'https://myuno.app');

beforeEach(() => {
  window.sessionStorage.clear();
  state.rpc.mockReset();
  state.language = 'en'; state.failed = false; state.detailFailed = false; state.loading = false; state.retry.mockClear();
  state.properties = [{ id: 'unit', status: 'active', title: 'Garden resale', title_ru: 'Вторичная квартира', asking_price: 6000000, currency: 'THB', zone: 'Rawai', property_type: 'condo', media: [], title_type: 'freehold', condition: 'good' }];
  Element.prototype.hasPointerCapture = vi.fn(() => false); Element.prototype.setPointerCapture = vi.fn(); Element.prototype.releasePointerCapture = vi.fn(); Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('resale catalogue journey', () => {
  it('hydrates shared area/type/tab/budget without replacing bookmark context', () => {
    mount('/property/resale?zone=Rawai&property_type=villa&tab=assignment&budget=2&source=bookmark#results');
    expect(state.filters).toMatchObject({ zone: 'Rawai', property_type: 'villa', tab: 'assignment', min_price: 5000000, max_price: 15000000 });
    expect(screen.getByRole('button', { name: 'Assignments' })).toHaveAttribute('aria-pressed', 'true');
    expect(location().searchParams.get('source')).toBe('bookmark');
    expect(location().hash).toBe('#results');
  });
  it('changes type and budget through real controls, preserves history and clears only owned criteria', () => {
    mount('/property/resale?zone=Rawai&source=bookmark#results');
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    choose('Property Type', 'Villa');
    choose('Budget in THB', /5,000,000–15,000,000/);
    expect(state.filters).toMatchObject({ zone: 'Rawai', property_type: 'villa', min_price: 5000000, max_price: 15000000 });
    fireEvent.click(screen.getByRole('button', { name: 'Show results' }));
    fireEvent.click(screen.getByRole('button', { name: 'History back' }));
    expect(location().searchParams.has('budget')).toBe(false);
    expect(state.filters.property_type).toBe('villa');
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(Object.fromEntries(location().searchParams)).toEqual({ source: 'bookmark' });
    expect(location().hash).toBe('#results');
  });
  it('exposes a native named card link and returns from the actual detail without losing filters', () => {
    const path='/property/resale?zone=Rawai&property_type=condo&tab=ready&budget=2&source=bookmark#results';
    mount(path);
    const card = screen.getByRole('link', { name: 'Garden resale' });
    expect(card).toHaveAttribute('href', '/property/resale/unit');
    card.focus(); expect(card).toHaveFocus();
    fireEvent.click(card);
    expect(screen.getByRole('heading', { name: 'Garden resale' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByTestId('location')).toHaveTextContent(path);
    expect(state.filters).toMatchObject({ zone: 'Rawai', property_type: 'condo', tab: 'ready', min_price: 5000000 });
  });
  it('does not treat a different currency as the same THB budget', () => {
    state.properties.push({ ...state.properties[0], id: 'foreign', title: 'USD resale', currency: 'USD' });
    mount('/property/resale?budget=2');
    expect(screen.getByRole('link', { name: 'Garden resale' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'USD resale' })).not.toBeInTheDocument();
  });
  it.each([['en','Try again'],['ru','Повторить'],['th','ลองอีกครั้ง']])('distinguishes a failed read from empty results and retries in %s', (language, retry) => {
    state.language = language; state.failed = true;
    mount();
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText(/Found:|Найдено:|พบ:|No properties match/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: retry })); expect(state.retry).toHaveBeenCalledTimes(1);
  });
  it('retains a safe catalogue return from a failed detail read', () => {
    state.detailFailed = true;
    mount('/property/resale/unit');
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('Property not found')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' })); expect(state.retry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(location().pathname).toBe('/property/resale');
  });
});

it('shows stored USD consistently in the actual card/detail rather than relabelling it THB', () => {
  state.properties[0].currency = 'USD';
  mount();
  expect(screen.getByText('USD 6,000,000.00')).toBeVisible();
  fireEvent.click(screen.getByRole('link', { name: 'Garden resale' }));
  expect(screen.getAllByText('USD 6,000,000.00').length).toBeGreaterThan(0);
  expect(screen.queryByText('THB 6000000')).not.toBeInTheDocument();
});

it('shows a request label rather than a zero asking price in the actual card/detail', () => {
  state.properties[0].asking_price = 0;
  mount();
  expect(screen.getByText('Price on request')).toBeVisible();
  fireEvent.click(screen.getByRole('link', { name: 'Garden resale' }));
  expect(screen.getAllByText('Price on request').length).toBeGreaterThan(0);
  expect(screen.queryByText('THB 0')).not.toBeInTheDocument();
});

it('keeps cards and detail usable with an explicit fallback when their photograph fails', () => {
  mount();
  fireEvent.error(screen.getByAltText('Garden resale'));
  expect(screen.getByRole('img', { name: 'Photo unavailable' })).toBeVisible();
  fireEvent.click(screen.getByRole('link', { name: 'Garden resale' }));
  fireEvent.error(screen.getByAltText('Garden resale'));
  expect(screen.getByRole('img', { name: 'Photo unavailable' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Garden resale' })).toBeVisible();
});

it('lets buyers browse the published listing photos', () => {
  state.properties[0].media = ['/example-first.webp', '/example-second.webp'];
  mount('/property/resale/unit');
  expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
  expect(screen.getByAltText('Garden resale')).toHaveAttribute('src', '/example-first.webp');
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
  expect(screen.getByAltText('Garden resale')).toHaveAttribute('src', '/example-second.webp');
  expect(screen.getByRole('button', { name: 'Next photo' })).toBeDisabled();
});

it('shows the offer form only for an active listing open to negotiation', () => {
  mount('/property/resale/unit/offer');
  expect(screen.getByRole('heading', { name: 'Offer requests are unavailable' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Send offer for review' })).toBeNull();
  expect(state.rpc).not.toHaveBeenCalled();
});

it('persists the proposed price and structured terms through the existing buyer intake', async () => {
  vi.stubGlobal('crypto', webcrypto);
  state.properties[0].price_negotiable = true;
  state.rpc.mockResolvedValue({ data: '11111111-1111-4111-8111-111111111111', error: null });
  mount('/property/resale/unit?source=bookmark#listing');
  fireEvent.click(screen.getByRole('link', { name: 'Make an offer' }));
  expect(location().pathname).toBe('/property/resale/unit/offer');
  expect(location().searchParams.get('source')).toBe('bookmark');

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic Buyer' } });
  fireEvent.change(screen.getByLabelText('Phone or WhatsApp'), { target: { value: '+66000000000' } });
  fireEvent.change(screen.getByLabelText('Offer amount (THB)'), { target: { value: '5750000' } });
  fireEvent.change(screen.getByLabelText('Preferred transfer date'), { target: { value: '2099-10-20' } });
  choose('Payment preference', 'Financing');
  choose('Furniture', 'Include');
  fireEvent.click(screen.getByLabelText('Keep existing rental bookings'));
  fireEvent.click(screen.getByRole('button', { name: 'Send offer for review' }));

  expect(await screen.findByText('Offer received for review')).toBeVisible();
  expect(state.rpc).toHaveBeenCalledOnce();
  expect(state.rpc).toHaveBeenCalledWith('submit_consultation_request', {
    payload: expect.objectContaining({
      request_type: 'property_consultation',
      entry_point: '/property/resale/unit',
      vertical_metadata: {
        marketplace: 'resale',
        resale_listing_id: 'unit',
        intent: 'offer',
        offer: {
          amount: 5750000, currency: 'THB', payment_preference: 'financing', transfer_date: '2099-10-20',
          furniture_preference: 'included', keep_existing_bookings: true,
        },
      },
    }),
  });
});

describe('resale viewing intake', () => {
  function fillViewingForm() {
    fireEvent.click(screen.getByRole('button', { name: 'Request Viewing' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Synthetic Buyer' } });
    fireEvent.change(screen.getByLabelText('Phone or WhatsApp'), { target: { value: '+66000000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));
  }

  it('sends the exact resale context to the existing inbox writer and shows the returned ID', async () => {
    vi.stubGlobal('crypto', webcrypto);
    state.rpc.mockResolvedValue({ data: '11111111-1111-4111-8111-111111111111', error: null });
    mount('/property/resale/unit');
    fillViewingForm();
    expect(await screen.findByText('Request ID 11111111-1111-4111-8111-111111111111')).toBeVisible();
    expect(state.rpc).toHaveBeenCalledOnce();
    expect(state.rpc).toHaveBeenCalledWith('submit_consultation_request', {
      payload: expect.objectContaining({
        request_type: 'property_tour',
        entry_point: '/property/resale/unit',
        vertical_metadata: { marketplace: 'resale', resale_listing_id: 'unit', intent: 'viewing' },
        notes: 'Resale viewing: /property/resale/unit',
      }),
    });
  });

  it('blocks an uncertain replay against the legacy writer after reopening the page', async () => {
    vi.stubGlobal('crypto', webcrypto);
    state.rpc.mockRejectedValue(new Error('Synthetic lost response'));
    const first = mount('/property/resale/unit');
    fillViewingForm();
    expect(await screen.findByRole('alert')).toHaveTextContent('previous request status is unknown');
    first.unmount();
    mount('/property/resale/unit');
    fillViewingForm();
    expect(await screen.findByRole('alert')).toHaveTextContent('previous request status is unknown');
    expect(state.rpc).toHaveBeenCalledOnce();
  });
});
