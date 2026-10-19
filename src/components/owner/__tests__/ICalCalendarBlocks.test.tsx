import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AirbnbCalendarGrid } from '../AirbnbCalendarGrid';
import { MultiPropertyTimeline } from '../MultiPropertyTimeline';
import type { UnifiedProperty } from '@/hooks/useMyProperties';

const fixtures = vi.hoisted(() => ({ loading: false, error: null as Error | null, language: 'en', retry: vi.fn(), mutation: vi.fn() }));
const blocks = [{ id: 'block-a', property_id: 'home-a', source_calendar_id: 'calendar-a', external_id: 'event-a', check_in: '2026-11-01', check_out: '2026-11-04' }];
vi.mock('@/hooks/usePropertyBookings', () => ({ usePropertyBookings: () => ({ bookings: [], inventoryBlocks: blocks,
  inventoryBlocksLoading: fixtures.loading, inventoryBlocksError: fixtures.error, refetchInventoryBlocks: fixtures.retry, refetch: fixtures.retry }) }));
vi.mock('@/hooks/useMultiPropertyBookings', () => ({ useMultiPropertyBookings: () => ({ bookingsByProperty: new Map(), inventoryBlocks: blocks,
  inventoryBlocksLoading: fixtures.loading, inventoryBlocksError: fixtures.error, refetchCalendar: fixtures.retry }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixtures.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'actor-a' } }) }));
vi.mock('@/hooks/useOperationalTasks', () => ({ useOperationalTasks: () => ({ tasks: [], completeTask: { mutate: fixtures.mutation }, updateTaskStatus: { mutate: fixtures.mutation } }) }));
vi.mock('@/hooks/usePropertyAvailabilityManagement', () => ({ usePropertyAvailabilityManagement: () => ({ availability: [] }) }));
vi.mock('@/hooks/usePropertyAvailability', () => ({ usePropertyRentalTerms: () => ({ data: { price_per_night: 4500 } }) }));
vi.mock('@/hooks/usePropertyRateSeasons', () => ({ usePropertyRateSeasons: () => ({ data: [] }) }));
vi.mock('@/hooks/usePropertyProjects', () => ({ usePropertyProjects: () => ({ data: [] }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Production access forbidden'); } }) }));
vi.mock('../BookingDetailSheet', () => ({ BookingDetailSheet: () => null }));
vi.mock('../LegacyTaskDetailSheet', () => ({ TaskDetailSheet: () => null }));
vi.mock('../CreateServiceTaskDialog', () => ({ CreateServiceTaskDialog: () => null }));
vi.mock('../AddBookingFromCalendarDialog', () => ({ AddBookingFromCalendarDialog: () => null }));
vi.mock('../BlockDatesDialog', () => ({ BlockDatesDialog: () => null }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, children, footer }: { open: boolean; children: React.ReactNode; footer: React.ReactNode }) => open ? <div role="dialog">{children}{footer}</div> : null }));
const properties = [{ property_id: 'home-a', id: 'home-a', title: 'Home A', title_ru: 'Объект А' }] as UnifiedProperty[];

beforeEach(() => {
  cleanup(); fixtures.loading = false; fixtures.error = null; fixtures.language = 'en'; fixtures.retry.mockClear(); fixtures.mutation.mockClear();
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
for (const kind of ['single', 'portfolio']) describe(`${kind} PMS calendar iCal visibility`, () => {
  const renderCalendar = () => render(kind === 'single' ? <AirbnbCalendarGrid propertyId="home-a" /> : <MultiPropertyTimeline properties={properties} />);
  it('shows occupied nights as iCal blocks and checkout stays free', () => {
    renderCalendar();
    const occupied = screen.getByRole('button', { name: kind === 'single' ? /^1 Nov 2026: iCal availability block$/ : /^Home A: 1 Nov 2026: iCal availability block$/ });
    expect(occupied).toBeInTheDocument();
    expect(screen.getByRole('button', { name: kind === 'single' ? /^4 Nov 2026$/ : /^Home A: 4 Nov 2026$/ })).toBeInTheDocument();
    fireEvent.click(occupied);
    expect(screen.getByRole('dialog')).toHaveTextContent('iCal availability block');
    expect(screen.queryByRole('button', { name: 'Book' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unblock' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Guest');
    expect(fixtures.mutation).not.toHaveBeenCalled();
  });
  it('loading does not render a seemingly available grid', () => {
    fixtures.loading = true; renderCalendar();
    expect(screen.getByRole('status')).toHaveTextContent('Checking unavailable dates');
    expect(screen.queryByRole('button', { name: /1 Nov 2026/ })).not.toBeInTheDocument();
  });
  it('failed inventory read shows unknown availability and retry', () => {
    fixtures.error = Error('Synthetic unavailable data'); renderCalendar();
    expect(screen.getByRole('alert')).toHaveTextContent('Availability is unknown');
    expect(screen.queryByRole('button', { name: /1 Nov 2026/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(fixtures.retry).toHaveBeenCalled();
  });
  it('Russian overlay labels do not promote a block to a confirmed stay', () => {
    fixtures.language = 'ru'; renderCalendar();
    fireEvent.click(screen.getAllByRole('button', { name: /блокировка iCal/ })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Блокировка доступности iCal');
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Подтверждено');
    expect(screen.queryByRole('button', { name: 'Открыть' })).not.toBeInTheDocument();
  });
});
