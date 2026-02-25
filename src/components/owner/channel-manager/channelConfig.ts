import type { ChannelConfig } from './ChannelCard';

export const CHANNELS: ChannelConfig[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '🏠',
    color: 'from-destructive to-destructive/80',
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: '🅱️',
    color: 'from-info to-primary',
    bgColor: 'bg-info/10',
    textColor: 'text-info',
  },
  {
    id: 'vrbo',
    name: 'VRBO',
    logo: '🏡',
    color: 'from-accent-cyan to-accent-teal',
    bgColor: 'bg-accent-teal/10',
    textColor: 'text-accent-teal',
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: '✈️',
    color: 'from-warning to-accent-amber',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
  },
  {
    id: 'google',
    name: 'Google Calendar',
    logo: '📅',
    color: 'from-success to-success/80',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
  },
  {
    id: 'manual',
    name: 'Manual',
    logo: '✏️',
    color: 'from-muted-foreground to-muted-foreground/80',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  },
];

export function getChannelConfig(source: string) {
  const normalized = source.toLowerCase();
  return CHANNELS.find(c => normalized.includes(c.id)) || CHANNELS[CHANNELS.length - 1];
}
