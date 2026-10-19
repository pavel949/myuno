import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePropertyBookings } from '@/hooks/usePropertyBookings';
import { useOperationalTasks } from '@/hooks/useOperationalTasks';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';

const fixture = vi.hoisted(() => ({
  bookings: [{ id: 'synthetic-a', check_in: '2026-10-10', check_out: '2026-10-13', status: 'confirmed' as string | null }, { id: 'synthetic-b', check_in: '2026-10-13', check_out: '2026-10-15', status: 'confirmed' as string | null }],
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({ data: queryKey[0] === 'operational-tasks' ? [{ id: 'synthetic-task', scheduled_date: bangkokTodayISO(), task_type: 'check_out', status: 'pending' }] : fixture.bookings, isLoading: false }),
  useMutation: () => ({ mutate: () => { throw Error('Forbidden mutation'); }, mutateAsync: () => { throw Error('Forbidden mutation'); } }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: new Proxy({}, { get() { throw Error('Production access forbidden'); } }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-user' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: null }) }));
vi.mock('@/contexts/StorefrontContext', () => ({ useStorefront: () => ({ storefront: null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useMyProperties', () => ({ useMyProperties: () => ({ allProperties: [{ property_id: 'synthetic-home' }], isLoading: false }) }));
vi.mock('@/lib/getAccessiblePropertyIds', () => ({ getAccessiblePropertyIds: () => { throw Error('Forbidden query'); } }));

describe('real calendar hook date helpers with synthetic query results', () => {
  it('checkout lookup selects only the subsequent arrival', () => {
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    expect(result.current.getBookingForDate(parseCivilDate('2026-10-12'))?.id).toBe('synthetic-a');
    expect(result.current.getBookingForDate(parseCivilDate('2026-10-13'))?.id).toBe('synthetic-b');
    expect(result.current.isDateBooked(parseCivilDate('2026-10-15'))).toBe(false);
  });
  it('month lookup excludes a booking departing on the first', () => {
    const original = fixture.bookings;
    fixture.bookings = [{ id: 'month-end', check_in: '2026-01-31', check_out: '2026-02-01', status: 'confirmed' }];
    try {
      const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
      expect(result.current.getBookingsForMonth(2026, 0)).toHaveLength(1);
      expect(result.current.getBookingsForMonth(2026, 1)).toHaveLength(0);
    } finally { fixture.bookings = original; }
  });
  it('checkout tasks remain today events in the Bangkok civil date', () => {
    const { result } = renderHook(() => useOperationalTasks());
    expect(result.current.todayTasks.map(t => t.id)).toEqual(['synthetic-task']);
  });
});
it.each(['cancelled', 'refunded', 'expired', null])('released/non-holding %s never blocks occupancy helpers', status => {
  const original = fixture.bookings;
  fixture.bookings = [{ id: 'released', check_in: '2026-10-10', check_out: '2026-10-13', status }];
  try {
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    expect(result.current.isDateBooked(parseCivilDate('2026-10-11'))).toBe(false);
    expect(result.current.getBookingForDate(parseCivilDate('2026-10-11'))).toBeUndefined();
  } finally { fixture.bookings = original; }
});
it('an unknown non-null hold is retained and cancelled records cannot mask the active booking', () => {
  const original = fixture.bookings;
  fixture.bookings = [
    { id: 'cancelled', check_in: '2026-10-10', check_out: '2026-10-13', status: 'cancelled' },
    { id: 'unknown-hold', check_in: '2026-10-10', check_out: '2026-10-13', status: 'future_hold' },
  ];
  try {
    const { result } = renderHook(() => usePropertyBookings('synthetic-home'));
    expect(result.current.isDateBooked(parseCivilDate('2026-10-11'))).toBe(true);
    expect(result.current.getBookingForDate(parseCivilDate('2026-10-11'))?.id).toBe('unknown-hold');
  } finally { fixture.bookings = original; }
});
