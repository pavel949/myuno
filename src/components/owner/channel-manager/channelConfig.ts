import type { ChannelConfig } from './ChannelCard';
import { CHANNEL_REGISTRY, detectChannelFromUrl } from './channelRegistry';

/**
 * Build CHANNELS array from registry for backward compatibility.
 */
export const CHANNELS: ChannelConfig[] = CHANNEL_REGISTRY.map(entry => ({
  id: entry.id,
  name: entry.name,
  logo: entry.icon,
  color: entry.color,
  bgColor: entry.bgColor.split(' ')[0], // strip hover class
  textColor: entry.textColor,
}));

/**
 * Detect channel config from source name or iCal URL.
 * First tries URL-pattern matching, then falls back to name matching.
 */
export function getChannelConfig(source: string): ChannelConfig {
  const normalized = source.toLowerCase();

  // Try URL-pattern detection first (works when source is actually a URL)
  const detected = detectChannelFromUrl(source);
  if (detected) {
    return {
      id: detected.id,
      name: detected.name,
      logo: detected.icon,
      color: detected.color,
      bgColor: detected.bgColor.split(' ')[0],
      textColor: detected.textColor,
    };
  }

  // Fallback: match by channel id in source name
  const match = CHANNEL_REGISTRY.find(c => normalized.includes(c.id));
  if (match) {
    return {
      id: match.id,
      name: match.name,
      logo: match.icon,
      color: match.color,
      bgColor: match.bgColor.split(' ')[0],
      textColor: match.textColor,
    };
  }

  // Default: manual/unknown
  const manual = CHANNEL_REGISTRY.find(c => c.id === 'manual')!;
  return {
    id: manual.id,
    name: manual.name,
    logo: manual.icon,
    color: manual.color,
    bgColor: manual.bgColor,
    textColor: manual.textColor,
  };
}
