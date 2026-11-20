import type { Yacht } from '@/hooks/useYachts';

export const YACHT_SUGGESTED_TIMES = {
  half_day: ['09:00', '14:00'],
  full_day: ['08:00', '09:00', '10:00'],
  sunset: ['16:00', '16:30', '17:00'],
  overnight: ['10:00', '12:00'],
} as const;

export function getYachtPreferredTimes(yacht: Pick<Yacht, 'departure_times' | 'booking_flow'>, charter: keyof typeof YACHT_SUGGESTED_TIMES): string[] {
  const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const configured = [...new Set(yacht.departure_times?.filter(value => validTime.test(value)) ?? [])];
  return configured.length || yacht.booking_flow === 'instant' ? configured : [...YACHT_SUGGESTED_TIMES[charter]];
}
