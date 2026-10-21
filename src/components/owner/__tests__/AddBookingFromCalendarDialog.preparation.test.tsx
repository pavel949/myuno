import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddBookingFromCalendarDialog } from '../AddBookingFromCalendarDialog';

const state = vi.hoisted(() => ({ language: 'en', create: vi.fn(), success: vi.fn(), notify: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/usePropertyBookings', () => ({ usePropertyBookings: () => ({ createBooking: state.create, bookings: [], isCreating: false }) }));
vi.mock('@/hooks/usePropertyAvailabilityManagement', () => ({ usePropertyAvailabilityManagement: () => ({ availability: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('sonner', () => ({ toast: Object.assign(state.notify, { warning: state.warning, error: state.error }) }));
vi.mock('@/components/ui/calendar', () => ({ Calendar: ({ onSelect }: { onSelect: (date: Date) => void }) => <button onClick={() => onSelect(new Date(2030, 0, 12))}>Choose synthetic checkout</button> }));
const initialDate = new Date(2030, 0, 10);
function Harness() {
  const [open, setOpen] = useState(true);
  return <AddBookingFromCalendarDialog open={open} onOpenChange={setOpen} propertyId="synthetic-home" initialDate={initialDate} onSuccess={state.success} />;
}
async function submit() {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: state.language === 'ru' ? 'Выбрать' : 'Select' }));
  fireEvent.click(screen.getByRole('button', { name: 'Choose synthetic checkout' }));
  fireEvent.click(screen.getByRole('button', { name: state.language === 'ru' ? 'Добавить бронирование' : 'Add Booking' }));
  await waitFor(() => expect(state.create).toHaveBeenCalledTimes(1));
}
beforeEach(() => { vi.clearAllMocks(); state.language = 'en'; });
afterEach(cleanup);
describe('calendar booking preparation feedback', () => {
  it.each(['en', 'ru'])('reports saved record + preparation warning in %s and closes without retry', async language => {
    state.language = language;
    state.create.mockResolvedValue({ id: 'saved-order', preparation: { status: 'needs_attention', unconfirmedTaskTypes: ['cleaning'] } });
    await submit();
    await waitFor(() => expect(state.warning).toHaveBeenCalledWith(
      language === 'ru' ? 'Запись о бронировании сохранена. Подготовка требует внимания' : 'Booking record saved. Preparation needs attention',
      expect.objectContaining({ description: expect.stringContaining(language === 'ru' ? 'Не создавайте бронирование повторно' : 'Do not create the booking again') }),
    ));
    expect(state.error).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
    expect(state.success).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(state.create).toHaveBeenCalledTimes(1);
  });
  it('keeps ordinary saved-record success when preparation succeeds', async () => {
    state.create.mockResolvedValue({ id: 'saved-order', preparation: { status: 'complete', unconfirmedTaskTypes: [] } });
    await submit();
    await waitFor(() => expect(state.notify).toHaveBeenCalledWith('Booking record saved', expect.any(Object)));
    expect(state.warning).not.toHaveBeenCalled();
    expect(state.success).toHaveBeenCalledTimes(1);
  });
  it('retains primary failure behavior instead of claiming the record was saved', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      state.create.mockRejectedValue(new Error('Synthetic order failure'));
      await submit();
      await waitFor(() => expect(state.error).toHaveBeenCalledWith('Error', { description: 'Failed to create booking' }));
      expect(state.warning).not.toHaveBeenCalled();
      expect(state.notify).not.toHaveBeenCalled();
      expect(state.success).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeTruthy();
    } finally { consoleError.mockRestore(); }
  });
});
