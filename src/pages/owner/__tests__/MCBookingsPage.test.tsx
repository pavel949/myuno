import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { bookingsListFixtures, type FixtureLanguage } from './bookingsList.fixtures';

const mocks = vi.hoisted(() => ({
  language: 'ru' as 'ru' | 'en',
  loading: false,
  empty: false,
  from: vi.fn(), update: vi.fn(), in: vi.fn(), error: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (n: number) => `${n} THB` }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({
  useAllPropertyBookings: () => ({ bookings: mocks.empty ? [] : bookingsListFixtures(mocks.language), isLoading: mocks.loading }),
}));
// The real client and detail queries never load. An in-memory rejected response
// exercises submission without a write, success notification or window reload.
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));
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
  render(<MemoryRouter><MCBookingsPage /></MemoryRouter>);
}
function selectFirst(language: FixtureLanguage) {
  const name = bookingsListFixtures(language)[0].guest_name;
  fireEvent.click(screen.getByRole('checkbox', { name: `${language === 'ru' ? 'Выбрать бронирование' : 'Select booking'}: ${name}` }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loading = false; mocks.empty = false;
  mocks.from.mockReturnValue({ update: mocks.update });
  mocks.update.mockReturnValue({ in: mocks.in });
  mocks.in.mockResolvedValue({ error: new Error('Isolated fixture rejection') });
});
afterEach(cleanup);

describe.each(['ru', 'en'] as const)('isolated bookings list (%s)', language => {
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
    fireEvent.click(screen.getByRole('button', { name: actionLabel, exact: true }));
    expect(mocks.from).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Нет' : 'No', exact: true }));
    expect(mocks.from).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: actionLabel, exact: true }));
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Да' : 'Yes', exact: true }));
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith('orders');
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ status: action === 'confirm' ? 'confirmed' : 'cancelled' });
    expect(mocks.in).toHaveBeenCalledExactlyOnceWith('id', ['fixture-booking-01']);
    await vi.waitFor(() => expect(mocks.error).toHaveBeenCalledOnce());
  });

  it('select-all and clear work locally without a submission', () => {
    mount(language); selectFirst(language);
    fireEvent.click(screen.getByRole('checkbox', { name: language === 'ru' ? 'Выбрать все видимые бронирования' : 'Select all visible bookings' }));
    expect(screen.getAllByRole('checkbox').every(el => el.getAttribute('aria-checked') === 'true')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Снять выбор' : 'Clear', exact: true }));
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