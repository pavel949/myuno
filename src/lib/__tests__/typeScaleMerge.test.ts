import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';
import { TYPE_SCALE } from '@/design-system/typeScale';
import { buttonVariants } from '@/components/ui/button';

describe('canonical typography merge contract', () => {
  it.each(Object.keys(TYPE_SCALE))('keeps %s size independent from semantic text colors', role => {
    const size = `text-${role}`;
    expect(cn(size, 'text-primary-foreground')).toBe(`${size} text-primary-foreground`);
    expect(cn('text-danger', size)).toBe(`text-danger ${size}`);
    expect(cn(size, 'text-sm')).toBe('text-sm');
    expect(cn('text-sm', size)).toBe(size);
    expect(cn(`md:${size}`, 'md:text-primary')).toBe(`md:${size} md:text-primary`);
  });
  it.each(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const)('keeps default button size and %s color', variant => {
    const result = cn(buttonVariants({ variant }));
    expect(result.split(' ')).toContain('text-body');
    expect(cn(buttonVariants({ variant, size: 'sm' })).split(' ')).not.toContain('text-body');
    expect(cn(buttonVariants({ variant, size: 'sm' })).split(' ')).toContain('text-sm');
  });
});
