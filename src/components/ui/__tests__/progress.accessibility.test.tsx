import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';
afterEach(cleanup);
it.each([0, 25])('announces the known value %s without changing the visual percentage', value => {
  render(<Progress value={value} />);
  const root = screen.getByRole('progressbar');
  expect(root).toHaveAttribute('aria-valuenow', String(value));
  expect(root.firstElementChild).toHaveStyle({ transform: `translateX(-${100 - value}%)` });
});
it('retains an unknown value as indeterminate', () => {
  render(<Progress />);
  expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'indeterminate');
});
