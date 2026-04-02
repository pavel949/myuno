/**
 * OTA / manual channel colors for unified STAYS owner calendar (Block 2).
 */
export const STAYS_CHANNEL_COLORS: Record<string, string> = {
  airbnb: '#FF5A5F',
  booking: '#003580',
  agoda: '#E23434',
  vrbo: '#3D5A80',
  manual: '#888888',
};

export type StaysChannelKey = keyof typeof STAYS_CHANNEL_COLORS;

const ALIASES: Record<string, StaysChannelKey> = {
  airbnb: 'airbnb',
  'booking.com': 'booking',
  booking_com: 'booking',
  booking: 'booking',
  agoda: 'agoda',
  vrbo: 'vrbo',
  homeaway: 'vrbo',
  manual: 'manual',
  direct: 'manual',
  uno: 'manual',
  myuno: 'manual',
};

/**
 * Normalize DB `channel_type`, booking `source`, or calendar name to a channel key.
 */
export function normalizeStaysChannelKey(raw: string | null | undefined): StaysChannelKey {
  if (!raw || !raw.trim()) return 'manual';
  const k = raw.trim().toLowerCase().replace(/[\s.]+/g, '_');
  if (k in ALIASES) return ALIASES[k];
  if (k.includes('airbnb')) return 'airbnb';
  if (k.includes('booking')) return 'booking';
  if (k.includes('agoda')) return 'agoda';
  if (k.includes('vrbo') || k.includes('homeaway')) return 'vrbo';
  return 'manual';
}

export function getStaysChannelColor(key: string): string {
  const k = normalizeStaysChannelKey(key);
  return STAYS_CHANNEL_COLORS[k] ?? STAYS_CHANNEL_COLORS.manual;
}
