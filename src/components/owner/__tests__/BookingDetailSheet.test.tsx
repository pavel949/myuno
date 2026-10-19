import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BookingStatusEvent } from '@/components/bookings/BookingStatusTimeline';
import type { PropertyBooking } from '@/hooks/usePropertyBookings';
const fixture = vi.hoisted(() => ({ language: 'en', error: null as Error | null, history: vi.fn(), events: [] as BookingStatusEvent[] }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: fixture.language }) }));
vi.mock('@/hooks/useBookingStatusHistory', () => ({ useBookingStatusHistory: (options: unknown) => {
  fixture.history(options); return { events: fixture.events, isLoading: false, error: fixture.error, highlightIds: new Set() };
} }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
import { BookingDetailSheet } from '../BookingDetailSheet';
const booking: PropertyBooking = { id: 'order-a', order_id: 'order-a', property_id: 'home-a', owner_id: '', check_in: '2030-01-10', check_out: '2030-01-12', created_at: '2030-01-01T00:00:00Z', updated_at: '', status: 'checked_out', total_amount: 0 };
function mount(value = booking, path = '/mc/bookings-list') { return render(<MemoryRouter initialEntries={[path]}><BookingDetailSheet open onOpenChange={vi.fn()} booking={value} /></MemoryRouter>); }
beforeEach(() => { vi.clearAllMocks(); fixture.language = 'en'; fixture.error = null; fixture.events = []; });
afterEach(cleanup);
describe.each(['ru', 'en'])('truthful PMS detail (%s)', language => {
  it('queries order history with the order ID and displays actual checkout', () => {
    fixture.language = language; mount();
    expect(fixture.history).toHaveBeenCalledWith({ table: 'order_status_history', bookingId: 'order-a', enabled: true });
    expect(screen.getByText(language === 'ru' ? 'Выехал' : 'Checked out')).toBeInTheDocument();
  });
  it('preserves zero amount and unknown currency/payment instead of inventing THB or paid state', () => {
    fixture.language = language; mount();
    expect(screen.getByText(language === 'ru' ? '0 (валюта неизвестна)' : '0 (currency unavailable)')).toBeInTheDocument();
    expect(screen.getByText(language === 'ru' ? /Полученная оплата, остаток/ : /Received payment, balance/)).toBeInTheDocument();
  });
  it('shows an unknown status explicitly and history failure instead of an invented timeline', () => {
    fixture.language = language; fixture.error = new Error('denied'); mount({ ...booking, status: 'future_state' });
    expect(screen.getByText(language === 'ru' ? 'Неизвестный статус: future_state' : 'Unknown status: future_state')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: language === 'ru' ? 'История статусов' : 'Status history' })).not.toBeInTheDocument();
  });
});
it('uses inventory history only for real inventory records', () => {
  mount({ ...booking, id: 'inventory-a', order_id: undefined });
  expect(fixture.history).toHaveBeenCalledWith({ table: 'property_booking_status_history', bookingId: 'inventory-a', enabled: true });
});
it('links the correct property and does not expose management shortcuts in owner surfaces', () => {
  mount();
  expect(screen.getByRole('link', { name: 'Property calendar and tasks' })).toHaveAttribute('href', '/mc/calendar?property=home-a');
  expect(screen.getByRole('link', { name: 'Open property' })).toHaveAttribute('href', '/mc/properties/home-a');
  cleanup(); mount(booking, '/owner/calendar');
  expect(screen.queryByRole('link', { name: 'Open property' })).not.toBeInTheDocument();
});
it('missing dates and total render unknown without crashing', () => {
  mount({ ...booking, check_in: '', check_out: '', total_amount: undefined });
  expect(screen.getAllByText('Date unavailable')).toHaveLength(2);
  expect(screen.getByText('Total unavailable')).toBeInTheDocument();
});

it('an empty audit trail never invents checkout at order creation', () => {
  mount();
  expect(screen.getByText('No status history yet')).toBeInTheDocument();
  expect(screen.queryByRole('list', { name: 'Status history' })).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Booking status' })).toHaveTextContent('Checked out');
});
it('renders only persisted events without synthesizing an earlier creation transition', () => {
  fixture.events = [{ id: 'saved-checkout', from_status: 'checked_in', to_status: 'checked_out', created_at: '2030-01-12T12:00:00Z' }];
  mount();
  expect(screen.getByRole('list', { name: 'Status history' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
});
