import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assertRouteRegisterFresh } from '../../../scripts/design-system-adoption-register.mjs';

const current = JSON.parse(readFileSync('docs/design-system/route-surface-register.json', 'utf8'));
describe('route inventory freshness before component adoption checks', () => {
  it('accepts the current source inventory', () => {
    expect(() => assertRouteRegisterFresh(process.cwd(), current)).not.toThrow();
  });
  it('rejects a stale route count even when the component inventory did not change', () => {
    const stale = structuredClone(current);
    stale.summary.declarations--;
    expect(() => assertRouteRegisterFresh(process.cwd(), stale)).toThrow('Route surface register is stale');
  });
});
