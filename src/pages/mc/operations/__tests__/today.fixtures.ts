import type { TodayBooking, TodayRequest, TodayUnit } from '@/hooks/usePmsToday';

export type TodayScenario = 'populated' | 'empty' | 'loading' | 'error' | 'no-properties';
export function todayFixtures(language: 'ru' | 'en', scenario: TodayScenario = 'populated') {
  const guest = language === 'ru' ? 'Александра Константинопольская — семья с двумя детьми и длинным именем' : 'Alexandra Constantinopoulos — family with children and a very long name';
  const title = language === 'ru' ? 'Просторные семейные апартаменты с панорамным видом на море — длинное название объекта' : 'Spacious family apartment with panoramic sea view — exceptionally long property name';
  const booking: TodayBooking = { id: 'synthetic-booking', property_id: 'synthetic-property', guest_name: guest, guest_phone: '+000000000', guests_count: 4, check_in: '2026-10-17', check_out: '2026-10-18', status: 'confirmed', source: 'SyntheticBookingChannelWithAnExceptionallyLongUnbrokenName' };
  const requests: TodayRequest[] = ['urgent', 'high', 'normal'].map(priority => ({ id: `synthetic-${priority}`, property_id: 'synthetic-property', service_type: `synthetic_${priority}_request`, status: 'in_progress', priority, guest_name: guest, description: `${title}. ${guest}. ${'LongUnbrokenSyntheticDescription'.repeat(6)}`, scheduled_at: '2026-10-17T01:00:00Z', created_at: '2026-10-16T12:00:00Z' }));
  const units: TodayUnit[] = ['maintenance', 'dirty', 'occupied', 'clean'].map((state, index) => ({ property_id: index ? `synthetic-property-${index}` : 'synthetic-property', title: `${title} ${index}`, state: state as TodayUnit['state'], booking: state === 'occupied' ? booking : null }));
  const populated = scenario === 'populated' || scenario === 'error';
  return {
    isLoading: scenario === 'loading', error: scenario === 'error' ? new Error('Synthetic query failure') : null,
    hasProperties: scenario !== 'no-properties', arrivals: populated ? [booking] : [],
    departures: populated ? [{ ...booking, id: 'synthetic-departure', check_in: '2026-10-16', check_out: '2026-10-17' }] : [],
    inHouse: populated ? [booking] : [], guestRequests: populated ? requests : [], units: populated ? units : [],
    titleOf: () => title,
  };
}