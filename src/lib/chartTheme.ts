/**
 * Unified Chart Theme — DS 2.1 civic infrastructure
 * Uses CSS variables from tokens.css; stays in sync with design-system.
 * Fonts resolve via --font-body (Geist) so locale-switching JustWorks.
 */

export const CHART_THEME = {
  /** Axis tick styling */
  axisTick: {
    fontSize: 11,
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fill: 'hsl(var(--muted-foreground))',
    letterSpacing: '0.01em',
  },

  /** Tooltip container */
  tooltip: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-elevated)',
    padding: '10px 14px',
    fontSize: '12px',
    fontFamily: 'var(--font-body)',
  },

  /** Tooltip label */
  tooltipLabel: {
    color: 'hsl(var(--foreground))',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '4px',
  },

  /** Tooltip item */
  tooltipItem: {
    color: 'hsl(var(--muted-foreground))',
    fontWeight: 500,
  },

  /** Grid styling */
  grid: {
    strokeDasharray: '4 4',
    stroke: 'hsl(var(--border))',
    strokeOpacity: 0.5,
  },

  /** Area chart curve */
  area: {
    strokeWidth: 2.5,
    type: 'monotone' as const,
    animationDuration: 800,
    animationEasing: 'ease-out' as const,
  },

  /** Bar chart */
  bar: {
    radius: [6, 6, 0, 0] as [number, number, number, number],
    radiusHorizontal: [0, 6, 6, 0] as [number, number, number, number],
    maxBarSize: 32,
    animationDuration: 600,
  },

  /** Pie/Donut */
  pie: {
    innerRadius: '55%',
    outerRadius: '80%',
    paddingAngle: 3,
    cornerRadius: 4,
    animationDuration: 700,
  },

  /** Legend styling */
  legend: {
    dotSize: 'h-2 w-2 rounded-full',
    textClass: 'text-[11px] font-medium tracking-wide text-muted-foreground',
    containerClass: 'flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/40',
  },

  /** Semantic color palette */
  colors: {
    primary: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    destructive: 'hsl(var(--destructive))',
    warning: 'hsl(var(--warning))',
    info: 'hsl(var(--info))',
    purple: 'hsl(var(--accent-purple))',
    cyan: 'hsl(var(--accent-cyan))',
    amber: 'hsl(var(--accent-amber))',
    coral: 'hsl(var(--accent-coral))',
    teal: 'hsl(var(--accent-teal))',
  },

  /** Ordered palette for multi-series */
  palette: [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--accent-coral))',
    'hsl(var(--accent-cyan))',
    'hsl(var(--accent-purple))',
    'hsl(var(--warning))',
    'hsl(var(--accent-teal))',
    'hsl(var(--info))',
    'hsl(var(--accent-amber))',
    'hsl(var(--destructive))',
  ],
} as const;

/** Create a gradient def for area charts */
export function createGradientId(name: string) {
  return `chart-gradient-${name}`;
}
