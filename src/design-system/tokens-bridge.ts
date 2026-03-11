/**
 * myUNO Design System — DS 2.0 token bridge
 * Typed exports from tokens.json for use in JS/TS (charts, Canvas, dynamic styles).
 * CSS vars are the source of truth at runtime; this file provides types and helpers.
 */

import tokensJson from './tokens.json';

export const DS_VERSION = (tokensJson as { version?: string }).version ?? '2.0.0';

/** Semantic accent keys for charts and UI */
export const ACCENT_KEYS = [
  'primary',
  'success',
  'warning',
  'coral',
  'cyan',
  'purple',
  'teal',
  'info',
  'amber',
  'danger',
] as const;

export type AccentKey = (typeof ACCENT_KEYS)[number];

/** CSS variable names for semantic colors (use with getComputedStyle or className) */
export const CSS_VAR_NAMES = {
  primary: '--primary',
  primaryHover: '--primary-hover',
  primaryForeground: '--primary-foreground',
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  success: '--success',
  warning: '--warning',
  info: '--info',
  border: '--border',
  borderStrong: '--border-strong',
  borderSubtle: '--border-subtle',
  ring: '--ring',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
} as const;

/** Build hsl() string from CSS var name (raw HSL components). Use in inline styles. */
export function hslVar(varName: string): string {
  return `hsl(var(${varName}))`;
}

/** Chart palette: ordered CSS var names for multi-series charts */
export const CHART_PALETTE_VARS: readonly string[] = [
  CSS_VAR_NAMES.primary,
  CSS_VAR_NAMES.chart2,
  CSS_VAR_NAMES.chart3,
  CSS_VAR_NAMES.chart4,
  CSS_VAR_NAMES.chart5,
];

/** Spacing scale from tokens.json (base 4px) */
export const SPACING = (tokensJson as { spacing?: { scale?: Record<string, string> } }).spacing?.scale ?? {};

/** Radius scale */
export const RADIUS = (tokensJson as { radius?: Record<string, string> }).radius ?? {};

/** Breakpoints (for JS media queries or layout logic) */
export const BREAKPOINTS = (tokensJson as { breakpoints?: Record<string, string> }).breakpoints ?? {
  xs: '400px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
};

/** Motion durations */
export const MOTION_DURATION = (tokensJson as { motion?: { duration?: Record<string, string> } }).motion?.duration ?? {};
