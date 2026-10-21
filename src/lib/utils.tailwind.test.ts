import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('shared class merging during the Tailwind 4 migration', () => {
  it('keeps orthogonal spacing and semantic color/size utilities', () => {
    expect(cn('p-3 text-sm text-primary', 'px-0 text-lg text-muted-foreground'))
      .toBe('p-3 px-0 text-lg text-muted-foreground');
    expect(cn('border border-border', 'border-destructive')).toBe('border border-destructive');
  });

  it('resolves responsive and state overrides without dropping unrelated states', () => {
    expect(cn('h-10 w-10 md:h-12 focus:ring-1 hover:bg-muted', 'h-11 w-11 focus:ring-2'))
      .toBe('md:h-12 hover:bg-muted h-11 w-11 focus:ring-2');
    expect(cn('shadow-sm', 'shadow-md')).toBe('shadow-md');
    expect(cn('outline-none', 'outline-hidden')).toBe('outline-hidden');
  });
});
