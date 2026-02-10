import type { ChannelConfig } from './ChannelCard';

export const CHANNELS: ChannelConfig[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '🏠',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: '🅱️',
    color: 'from-blue-600 to-indigo-700',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'vrbo',
    name: 'VRBO',
    logo: '🏡',
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    textColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: '✈️',
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'google',
    name: 'Google Calendar',
    logo: '📅',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'manual',
    name: 'Manual',
    logo: '✏️',
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
];

export function getChannelConfig(source: string) {
  const normalized = source.toLowerCase();
  return CHANNELS.find(c => normalized.includes(c.id)) || CHANNELS[CHANNELS.length - 1];
}
