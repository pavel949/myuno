import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PrefetchProvider } from '../PrefetchProvider';

const prefetchData = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/usePrefetch', () => ({ usePrefetchPopularData: prefetchData }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('preserves data prefetch and does not schedule a startup route fanout', () => {
  const idleRouteWarmup = vi.fn();
  vi.stubGlobal('requestIdleCallback', idleRouteWarmup);
  render(<StrictMode><PrefetchProvider><div>Guest home</div></PrefetchProvider></StrictMode>);
  expect(screen.getByText('Guest home')).toBeInTheDocument();
  expect(prefetchData).toHaveBeenCalled();
  expect(idleRouteWarmup).not.toHaveBeenCalled();
});
