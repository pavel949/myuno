import { describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CalendarDayEventsSheet } from './CalendarDayEventsSheet';
import { parseCivilDate } from '@/lib/hotelDates';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => <div>{children}{footer}</div> }));
vi.mock('./BookingDetailSheet', () => ({ BookingDetailSheet: () => null }));
vi.mock('./LegacyTaskDetailSheet', () => ({ TaskDetailSheet: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Production access forbidden'); } }) }));

const departure = { id: 'synthetic-a', property_id: 'synthetic-home', owner_id: 'synthetic-owner', check_in: '2026-10-10', check_out: '2026-10-13', created_at: '', updated_at: '', guest_name: 'Departing guest' };
function renderDay(bookings = [departure], day = '2026-10-13') {
  cleanup();
  render(<CalendarDayEventsSheet open onOpenChange={vi.fn()} date={parseCivilDate(day)} bookings={bookings} tasks={[]} onAddTask={vi.fn()} onViewBooking={vi.fn()} onCompleteTask={() => { throw Error('Forbidden mutation'); }} onAddBooking={vi.fn()} onBlockDate={vi.fn()} />);
}
describe('departure metadata versus occupied nights', () => {
  it('keeps departure visible while allowing arrival on checkout day', () => {
    renderDay();
    expect(screen.getByText(/Check-out/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument();
  });
  it('arrival night is occupied and does not offer another booking', () => {
    renderDay([departure], '2026-10-10');
    expect(screen.getByText(/Check-in/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Book' })).toBeNull();
  });
  it('back-to-back arrival occupies checkout day without hiding departure', () => {
    renderDay([departure, { ...departure, id: 'synthetic-b', guest_name: 'Arriving guest', check_in: '2026-10-13', check_out: '2026-10-15' }]);
    expect(screen.getByText(/Check-out/)).toBeInTheDocument();
    expect(screen.getByText(/Check-in/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Book' })).toBeNull();
  });
});