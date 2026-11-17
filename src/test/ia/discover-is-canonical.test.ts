/** Legacy catalogue entries remain aliases of the single Discover destination. */
import { describe, it, expect } from 'vitest';
import { buildRouteRegister } from '../../../scripts/design-system-audit.mjs';
import { APP_ROUTES } from '@/lib/config/routes';

const routes = buildRouteRegister(process.cwd()).declarations;

describe('IA Wave-1 — Discover canonicalisation', () => {
  it.each(['/catalog', '/categories', '/navigator'])('%s must redirect to /discover (not render its own page)', path => {
    const declarations = routes.filter(route => route.resolvedPathPattern === path);
    expect(declarations).toHaveLength(1);
    expect(declarations[0].kind).toBe('redirect-adapter');
    expect(declarations[0].redirectTargets.map(target => target.resolvedTarget)).toEqual([APP_ROUTES.DISCOVER]);
  });
});
