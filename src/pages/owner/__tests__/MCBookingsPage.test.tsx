import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { bookingsListFixtures, type FixtureLanguage } from './bookingsList.fixtures';

const mocks = vi.hoisted(() => ({
  language: 'ru' as 'ru' | 'en',
  loading: false,
  empty: false,
  queryError: null as Error | null, refetch: vi.fn(),
  customBookings: null as ReturnType<typeof bookingsListFixtures> | null,
  from: vi.fn(), update: vi.fn(), in: vi.fn(), error: vi.fn(), command: vi.fn(), bind: vi.fn(), success: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'operator' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: 'company' } }) }));
vi.mock('@/lib/manualPropertyBooking', () => ({ executePropertyBookingChange: mocks.command }));
vi.mock('@/lib/propertyReservationReceipt', () => ({ bindPropertyReservationReader: mocks.bind }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `${n} THB` }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({
  useAllPropertyBookings: () => ({ bookings: mocks.empty ? [] : mocks.customBookings ?? bookingsListFixtures(mocks.language), isLoading: mocks.loading, error: mocks.queryError, refetch: mocks.refetch }),
}));
// The real client and detail queries never load. An in-memory rejected response
// exercises submission without a write, success notification or window reload.
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: mocks.success } }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
vi.mock('@/components/owner/BookingDetailSheet', () => ({
  BookingDetailSheet: ({ open, booking, onOpenChange }: {
    open: boolean; booking: { id: string } | null; onOpenChange: (open: boolean) => void;
  }) => open ? <div role="dialog" aria-label="Fixture booking details">
    {booking?.id}<button onClick={() => onOpenChange(false)}>Close fixture</button>
  </div> : null,
}));

import MCBookingsPage from '../MCBookingsPage';

function mount(language: FixtureLanguage) {
  mocks.language = language;
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MCBookingsPage /></MemoryRouter>);
}
function selectFirst(language: FixtureLanguage) {
  const name = bookingsListFixtures(language)[0].guest_name;
  fireEvent.click(screen.getByRole('checkbox', { name: `${language === 'ru' ? 'Выбрать бронирование' : 'Select booking'}: ${name}` }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loading = false; mocks.empty = false;
  mocks.queryError = null; mocks.customBookings = null;
  mocks.from.mockReturnValue({ update: mocks.update });
  mocks.update.mockReturnValue({ in: mocks.in });
  mocks.in.mockResolvedValue({ error: new Error('Isolated fixture rejection') });
  mocks.bind.mockResolvedValue({}); mocks.command.mockRejectedValue(new Error('Isolated checked command rejection'));
});
afterEach(cleanup);

describe.each(['ru', 'en'] as const)('isolated bookings list (%s)', language => {
  it('failed query hides stale selectable bookings and permits retry', () => {
    mocks.queryError = new Error('denied'); mount(language);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Повторить' : 'Retry' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('Bangkok arrival is active before UTC midnight, excluding cancelled and checkout stays', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T18:00:00Z'));
    try {
      const base = bookingsListFixtures(language)[0];
      mocks.customBookings = [
        { ...base, id: 'arrival', guest_name: 'Arrival fixture', status: 'confirmed', check_in: '2026-10-17', check_out: '2026-10-18' },
        { ...base, id: 'departed', guest_name: 'Departure fixture', status: 'checked_in', check_in: '2026-10-16', check_out: '2026-10-17' },
        { ...base, id: 'cancelled', guest_name: 'Cancelled fixture', status: 'cancelled', check_in: '2026-10-17', check_out: '2026-10-18' },
      ];
      mount(language);
      fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Активные' : 'Active' }));
      expect(screen.getByText('Arrival fixture')).toBeInTheDocument();
      expect(screen.queryByText('Departure fixture')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancelled fixture')).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });

  it.each(['active', 'upcoming'] as const)('%s list and KPI omit released and finished orders, retaining pending and unknown holds', filter => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T18:00:00Z'));
    try {
      const base = bookingsListFixtures(language)[0];
      const statuses = ['confirmed', 'pending', 'no_show', 'future_hold', 'cancelled', 'refunded', 'expired', 'completed', 'checked_out'];
      mocks.customBookings = statuses.map(status => ({
        ...base, id: status, guest_name: `Status fixture ${status}`, status,
        check_in: filter === 'active' ? '2026-10-17' : '2026-10-18', check_out: '2026-10-20',
      }));
      mount(language);
      const label = filter === 'active' ? (language === 'ru' ? 'Активные' : 'Active') : (language === 'ru' ? 'Предстоящие' : 'Upcoming');
      const tileLabel = filter === 'active' ? (language === 'ru' ? 'Сейчас' : 'Active') : (language === 'ru' ? 'Скоро' : 'Upcoming');
      const tile = screen.getByRole('button', { name: new RegExp(`^4 ${tileLabel}$`) });
      fireEvent.click(tile);
      expect(screen.getAllByRole('checkbox')).toHaveLength(4);
      for (const status of statuses.slice(0, 4)) expect(screen.getByText(`Status fixture ${status}`)).toBeInTheDocument();
      for (const status of statuses.slice(4)) expect(screen.queryByText(`Status fixture ${status}`)).not.toBeInTheDocument();
      // The matching filter button and summary tile must agree; history remains accessible.
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Все' : 'All' }));
      expect(screen.getAllByRole('checkbox')).toHaveLength(statuses.length);
      expect(mocks.from).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('completed includes early checkout but excludes released orders from inferred past stays', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T18:00:00Z'));
    try {
      const base = bookingsListFixtures(language)[0];
      mocks.customBookings = [
        { ...base, id: 'early-checkout', guest_name: 'Early checkout fixture', status: 'checked_out', check_in: '2026-10-16', check_out: '2026-10-20' },
        { ...base, id: 'completed', guest_name: 'Completed fixture', status: 'completed', check_in: '2026-10-16', check_out: '2026-10-20' },
        { ...base, id: 'past', guest_name: 'Past stay fixture', status: 'confirmed', check_in: '2026-10-14', check_out: '2026-10-16' },
        ...['cancelled', 'refunded', 'expired'].map(status => ({ ...base, id: status, guest_name: `Released history ${status}`, status, check_in: '2026-10-14', check_out: '2026-10-16' })),
      ];
      mount(language);
      fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Завершённые' : 'Completed' }));
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      for (const name of ['Early checkout fixture', 'Completed fixture', 'Past stay fixture']) expect(screen.getByText(name)).toBeInTheDocument();
      for (const status of ['cancelled', 'refunded', 'expired']) expect(screen.queryByText(`Released history ${status}`)).not.toBeInTheDocument();
      expect(mocks.from).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('checkbox selects and deselects without opening details or contacting the client', () => {
    mount(language); selectFirst(language);
    const checkbox = screen.getAllByRole('checkbox').find(el => el.getAttribute('aria-label')?.endsWith(bookingsListFixtures(language)[0].guest_name ?? ''));
    expect(checkbox).toBeChecked();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    selectFirst(language);
    expect(checkbox).not.toBeChecked();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('card opens the selected booking and close clears the detail selection', () => {
    mount(language);
    fireEvent.click(screen.getByText(bookingsListFixtures(language)[0].guest_name ?? ''));
    expect(screen.getByRole('dialog')).toHaveTextContent('fixture-booking-01');
    fireEvent.click(screen.getByRole('button', { name: 'Close fixture' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(['confirm', 'cancel'] as const)('%s requires explicit confirmation; No never submits; Yes only calls the stub', async action => {
    mount(language); selectFirst(language);
    const actionLabel = action === 'confirm' ? (language === 'ru' ? 'Подтвердить' : 'Confirm') : (language === 'ru' ? 'Отменить' : 'Cancel');
    fireEvent.click(screen.getByRole('button', { name: actionLabel }));
    expect(mocks.from).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Нет' : 'No' }));
    expect(mocks.from).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: actionLabel }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Да' : 'Yes' }));
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.command).toHaveBeenCalledExactlyOnceWith({}, 'operator', 'fixture-booking-01',
      { status: action === 'confirm' ? 'confirmed' : 'cancelled' }, bookingsListFixtures(language)[0].updated_at);
    await vi.waitFor(() => expect(mocks.error).toHaveBeenCalledOnce());
  });

  it('select-all and clear work locally without a submission', () => {
    mount(language); selectFirst(language);
    fireEvent.click(screen.getByRole('checkbox', { name: language === 'ru' ? 'Выбрать все видимые бронирования' : 'Select all visible bookings' }));
    expect(screen.getAllByRole('checkbox').every(el => el.getAttribute('aria-checked') === 'true')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Снять выбор' : 'Clear' }));
    expect(screen.getAllByRole('checkbox').every(el => el.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loading and empty fixtures never load the real client or open details', () => {
    mocks.loading = true; mount(language);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    cleanup(); mocks.loading = false; mocks.empty = true; mount(language);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
