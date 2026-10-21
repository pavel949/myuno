import type { PropertyBooking } from '@/hooks/usePropertyBookings';

export type FixtureLanguage = 'ru' | 'en';
export type BookingListFixture = PropertyBooking & {
  owner_properties: { title: string; address: string };
};

// Synthetic fixtures only: no account, property or order from the live database.
export function bookingsListFixtures(language: FixtureLanguage): BookingListFixture[] {
  return [
    {
      id: 'fixture-booking-01',
      property_id: 'fixture-property-01',
      owner_id: 'fixture-owner',
      guest_name: language === 'ru'
        ? 'Александра Константиновна Константинопольская — семейное бронирование'
        : 'Alexandra Constantina Montgomery-Wellington — extended family reservation',
      guest_email: 'alexandra.montgomery-wellington.extended.family@example.invalid',
      guest_phone: '+00 (000) 000-00-00 ext. 123456',
      owner_properties: {
        title: language === 'ru'
          ? 'Просторные семейные апартаменты с дополнительной спальней и видом на море'
          : 'Spacious family apartment with additional bedroom and panoramic sea view',
        address: 'Synthetic fixture address',
      },
      check_in: '2030-11-10', check_out: '2030-11-13',
      guests_count: 6, total_amount: 123456.78, currency: 'THB',
      source: 'booking.com', status: 'pending',
      created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z',
    },
    {
      id: 'fixture-booking-02', property_id: 'fixture-property-02', owner_id: 'fixture-owner',
      guest_name: language === 'ru' ? 'Михаил Александрович Петров' : 'Michael Alexander Peterson',
      guest_email: 'second.guest@example.invalid',
      owner_properties: { title: language === 'ru' ? 'Вторая тестовая квартира' : 'Second fixture apartment', address: 'Synthetic fixture address' },
      check_in: '2030-10-01', check_out: '2030-10-04', guests_count: 2,
      total_amount: 6000, currency: 'THB', source: 'manual', status: 'confirmed',
      created_at: '2030-01-01T00:00:00Z', updated_at: '2030-01-01T00:00:00Z',
    },
  ];
}