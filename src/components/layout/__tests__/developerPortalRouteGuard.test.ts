import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('developer portal route boundary', () => {
  it('wraps the write-capable portal subtree in the existing AuthGuard', () => {
    const source = readFileSync('src/components/layout/AnimatedRoutes.tsx', 'utf8');
    const route = source.slice(source.indexOf('path="/developer-portal"'));
    expect(route).toMatch(/element=\{<AuthGuard>/);
    expect(route).toContain('Pages.DeveloperPortalLayout');
  });
});
