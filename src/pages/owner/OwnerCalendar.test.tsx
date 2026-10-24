vi.mock('@/components/owner/pricing/CalendarPriceEditor', () => ({ CalendarPriceEditor: ({property,calendarContext}: {property:{property_id:string};calendarContext?:boolean}) => <div data-testid="calendar-price-editor" data-property={property.property_id} data-calendar-context={String(!!calendarContext)} /> }));
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import OwnerCalendar from './OwnerCalendar';
import RateManagementPage from './RateManagementPage';

const state = vi.hoisted(() => ({
  properties: [{ property_id: 'p1', title: 'First villa', price_per_night: 1000 }, { property_id: 'p2', title: 'Second villa', price_per_night: 2000 }],
  loading: false,
  rates: vi.fn(), ai: vi.fn(), write: vi.fn(), query: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: state.properties, isLoading: state.loading }) }));
vi.mock('@/hooks/usePropertyComplexes', () => ({ usePropertyComplexes: () => ({ data: [] }) }));
vi.mock('@/hooks/usePropertyProjects', () => ({ usePropertyProjects: () => ({ data: [] }) }));
vi.mock('@/components/owner/AirbnbCalendarGrid', () => ({ AirbnbCalendarGrid: ({ propertyId }: { propertyId?: string }) => <div data-testid="calendar-property-id">{propertyId}</div> }));
vi.mock('@/components/owner/MultiPropertyTimeline', () => ({ MultiPropertyTimeline: () => <div data-testid="portfolio">Portfolio dates</div> }));
vi.mock('@/components/owner/CalendarTodayTasks', () => ({ CalendarTodayTasks: () => null }));
vi.mock('@/components/owner/CalendarSyncManager', () => ({ CalendarSyncManager: () => null }));
vi.mock('@/components/owner/CreateServiceTaskDialog', () => ({ CreateServiceTaskDialog: () => null }));
vi.mock('@/components/owner/AddBookingFromCalendarDialog', () => ({ AddBookingFromCalendarDialog: ({ open, propertyId }: { open: boolean; propertyId: string }) => open ? <div data-testid="booking-property-id">{propertyId}</div> : null }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB', symbol: '฿' }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({
  useOwnerRateSeasons: (owner: string | undefined, property: string | undefined) => { state.rates(owner, property); return { data: [], isLoading: false }; },
  useDeleteRateSeason: () => ({ mutate: state.write }), useSaveRateSeason: () => ({ mutate: state.write }),
}));
vi.mock('@/hooks/useAIPricingSuggestions', () => ({ useAIPricingSuggestions: (property: string | undefined) => {
  state.ai(property); return { suggestions: [], generateSuggestions: { mutate: state.write }, acceptSuggestion: { mutate: state.write }, dismissSuggestion: { mutate: state.write } };
} }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }), useQuery: (options: unknown) => { state.query(options); return { data: [], isLoading: false }; } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get: () => { throw new Error('No backend access in navigation tests'); } }) }));
function Location() {
  const location = useLocation(); const navigate = useNavigate();
  return <><div data-testid="url">{location.pathname}{location.search}</div><button onClick={() => navigate(-1)}>History back</button></>;
}
function Harness({ path }: { path: string }) {
  return <MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/mc/calendar" element={<OwnerCalendar />} />
    <Route path="/mc/rates" element={<RateManagementPage />} />
    <Route path="/mc/properties/*" element={<p>Property destination</p>} />
    <Route path="/mc" element={<p>Management home</p>} />
  </Routes><Location /></MemoryRouter>;
}
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); Element.prototype.hasPointerCapture = vi.fn(() => false); });
beforeEach(() => {
  state.properties = [{ property_id: 'p1', title: 'First villa', price_per_night: 1000 }, { property_id: 'p2', title: 'Second villa', price_per_night: 2000 }];
  state.loading = false;
  vi.clearAllMocks();
});
function selectProperty(name: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Property' }), { key: 'Enter' });
  fireEvent.click(screen.getByRole('option', { name }));
}
describe('owner property navigation', () => {
  it('opens an accessible property deep link in single calendar view even on desktop', () => {
    render(<Harness path="/mc/calendar?property=p2" />);
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p2');
    expect(screen.queryByTestId('portfolio')).toBeNull();
    fireEvent.click(screen.getByText('Add Booking'));
    expect(screen.getByTestId('booking-property-id')).toHaveTextContent('p2');
    expect(state.write).not.toHaveBeenCalled();
  });
  it('restores portfolio view when browser Back removes a property selection', () => {
    render(<Harness path="/mc/calendar" />);
    expect(screen.getByTestId('portfolio')).toBeVisible();
    fireEvent.click(screen.getByText('Single property'));
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p1');
    fireEvent.click(screen.getByText('History back'));
    expect(screen.getByTestId('portfolio')).toBeVisible();
  });
  it('retains property and unrelated context through calendar → rates → Back', () => {
    render(<Harness path="/mc/calendar?property=p2&ref=owner" />);
    fireEvent.click(screen.getByText('Property rates'));
    expect(state.rates).toHaveBeenLastCalledWith('owner', 'p2');
    expect(screen.getByRole('combobox', { name: 'Property' })).toHaveTextContent('Second villa');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/mc/calendar?property=p2&ref=owner');
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p2');
  });
  it('writes calendar selections to URL and browser Back restores the previous property', () => {
    render(<Harness path="/mc/calendar?property=p1&ref=owner" />);
    selectProperty('Second villa');
    expect(screen.getByTestId('url')).toHaveTextContent('property=p2&ref=owner');
    fireEvent.click(screen.getByText('History back'));
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p1');
  });
  it('updates Rates selection and returns to that property rather than stale owner home', () => {
    render(<Harness path="/mc/rates?property=p1&ref=owner" />);
    selectProperty('Second villa');
    expect(screen.getByTestId('url')).toHaveTextContent('property=p2&ref=owner');
    expect(state.rates).toHaveBeenLastCalledWith('owner', 'p2');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/mc/properties/p2');
  });
  it.each(['/mc/calendar', '/mc/rates'])('rejects inaccessible property context at %s without fallback to All', path => {
    render(<Harness path={path + '?property=unavailable'} />);
    expect(screen.getByRole('status')).toHaveTextContent('This property is unavailable');
    expect(screen.queryByTestId('portfolio')).toBeNull();
    expect(screen.queryByTestId('calendar-property-id')).toBeNull();
    expect(screen.queryByText('Season')).toBeNull();
    if (path.endsWith('rates')) {
      expect(state.rates).toHaveBeenLastCalledWith(undefined, undefined);
      expect(state.ai).toHaveBeenLastCalledWith(undefined);
      expect(state.query.mock.lastCall?.[0]).toMatchObject({ enabled: false });
    }
  });
  it.each(['/mc/calendar', '/mc/rates'])('waits for accessible list before selecting property at %s', path => {
    state.loading = true;
    const result = render(<Harness path={path + '?property=p2'} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading properties');
    state.loading = false;
    result.rerender(<Harness path={path + '?property=p2'} />);
    expect(screen.queryByText('Loading properties…')).toBeNull();
    if (path.endsWith('calendar')) expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p2');
    else expect(state.rates).toHaveBeenLastCalledWith('owner', 'p2');
  });
  it.each(['/mc/calendar', '/mc/rates'])('clears stale selected property when access list changes at %s', path => {
    const result = render(<Harness path={path + '?property=p2'} />);
    state.properties = state.properties.slice(0, 1);
    result.rerender(<Harness path={path + '?property=p2'} />);
    expect(screen.getByRole('status')).toHaveTextContent('This property is unavailable');
    expect(screen.queryByTestId('calendar-property-id')).toBeNull();
    expect(state.write).not.toHaveBeenCalled();
  });
  it('returns from Rates to the calendar with a newly selected property', () => {
    render(<Harness path="/mc/calendar?property=p1&ref=owner" />);
    fireEvent.click(screen.getByText('Property rates'));
    selectProperty('Second villa');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/mc/calendar?property=p2&ref=owner');
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p2');
  });
  it('restores Rates property selection on browser Back', () => {
    render(<Harness path="/mc/rates?property=p1" />);
    selectProperty('Second villa');
    fireEvent.click(screen.getByText('History back'));
    expect(screen.getByRole('combobox', { name: 'Property' })).toHaveTextContent('First villa');
    expect(state.rates).toHaveBeenLastCalledWith('owner', 'p1');
  });
  it('does not treat an empty accessible list as All in Rates', () => {
    state.properties = [];
    render(<Harness path="/mc/rates" />);
    expect(screen.getByRole('status')).toHaveTextContent('No accessible properties');
    expect(state.rates).toHaveBeenLastCalledWith(undefined, undefined);
    expect(state.query.mock.lastCall?.[0]).toMatchObject({ enabled: false });
  });
  it('only shows All after an explicit reset, preserving unrelated query fields', () => {
    render(<Harness path="/mc/rates?property=p2&ref=owner" />);
    selectProperty('All Properties');
    expect(screen.getByTestId('url')).toHaveTextContent('/mc/rates?ref=owner');
    expect(state.rates).toHaveBeenLastCalledWith('owner', 'all');
  });
  it('keeps category pricing in the canonical calendar without a parent-unit booking action', () => {
    render(<Harness path="/mc/calendar?property=p1&category=category&date=2026-10-21" />);
    expect(screen.getByTestId('calendar-price-editor')).toHaveAttribute('data-property','p1');
    expect(screen.getByTestId('calendar-price-editor')).toHaveAttribute('data-calendar-context','true');
    expect(screen.queryByTestId('calendar-property-id')).toBeNull();
    expect(screen.queryByRole('button',{name:'Add Booking'})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Property rates'}));
    expect(screen.getByTestId('url')).toHaveTextContent('category=category');
    expect(screen.getByTestId('url')).toHaveTextContent('date=2026-10-21');
  });
  it('clears the old category when the calendar property changes explicitly', () => {
    render(<Harness path="/mc/calendar?property=p1&category=category" />);
    selectProperty('Second villa');
    expect(screen.getByTestId('url')).not.toHaveTextContent('category=');
    expect(screen.getByTestId('calendar-property-id')).toHaveTextContent('p2');
  });

  it('does not carry a previous property category through the Rates back destination', () => {
    const returnTo=encodeURIComponent('/mc/calendar?property=p1&category=category&date=2026-10-21');
    render(<Harness path={'/mc/rates?property=p1&category=category&returnTo='+returnTo} />);
    selectProperty('Second villa');
    fireEvent.click(screen.getByRole('button',{name:'Back'}));
    expect(screen.getByTestId('url')).toHaveTextContent('/mc/calendar?property=p2&date=2026-10-21');
    expect(screen.getByTestId('url')).not.toHaveTextContent('category=');
  });

});
