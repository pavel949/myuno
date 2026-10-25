import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

afterEach(cleanup);

it('announces a known value and keeps the existing visual transform', () => {
  render(<Progress value={25} />);
  const root = screen.getByRole('progressbar');
  expect(root).toHaveAttribute('aria-valuenow', '25');
  expect(root.firstElementChild).toHaveClass('bg-primary');
  expect(root.firstElementChild).toHaveStyle({ transform: 'translateX(-75%)' });
});

it('announces zero as a known value', () => {
  render(<Progress value={0} />);
  const root = screen.getByRole('progressbar');
  expect(root).toHaveAttribute('aria-valuenow', '0');
  expect(root.firstElementChild).toHaveStyle({ transform: 'translateX(-100%)' });
});

it('allows a semantic indicator override without leaking its prop to the root', () => {
  render(<Progress value={25} className="bg-muted" indicatorClassName="bg-media-foreground" />);
  const root = screen.getByRole('progressbar');
  expect(root).toHaveClass('bg-muted');
  expect(root).not.toHaveAttribute('indicatorclassname');
  expect(root.firstElementChild).toHaveClass('bg-media-foreground');
  expect(root.firstElementChild).not.toHaveClass('bg-primary');
  expect(root.firstElementChild).toHaveStyle({ transform: 'translateX(-75%)' });
});

it('keeps an unknown value indeterminate', () => {
  render(<Progress />);
  const root = screen.getByRole('progressbar');
  expect(root).not.toHaveAttribute('aria-valuenow');
  expect(root).toHaveAttribute('data-state', 'indeterminate');
});
