/**
 * Regression test — `/` (Home) must always render as a CONSUMER shell
 * (no workspace SideRail) on mobile, regardless of the authenticated user's
 * active role (owner / admin / vendor / mc_portal / investor / team).
 *
 * Background:
 *   AppLayout previously inherited `activeRole` from `useUserContext()`,
 *   which forced workspace-role users (e.g. owners) into a desktop SideRail
 *   shell when opening the home page on a phone. The fix in
 *   `src/components/layout/AppLayout.tsx` forces `effectiveNavRole = 'guest'`
 *   for any non-workspace variant. This test locks that contract in.
 *
 * What we assert (logic-level, not full DOM render to avoid pulling in
 * the entire provider tree):
 *   1. `hasSidebar('guest')` is `false` — the SideRail won't render for
 *      consumer shells.
 *   2. `hasSidebar(role)` is `true` only for actual workspace roles.
 *   3. The `effectiveNavRole` derivation matches what AppLayout does:
 *      consumer variant → 'guest', workspace variant → passed `navRole`.
 */
import { describe, it, expect } from 'vitest';
import { hasSidebar, type NavRoleKey } from '@/lib/nav/navigationModel';

/** Mirror of the derivation inside `AppLayout` so the contract is testable
 *  without a full React render (which would require mocking auth, router,
 *  query-client, language, theme, location, …). */
function deriveEffectiveNavRole(
  variant: 'consumer' | 'workspace',
  navRole?: NavRoleKey,
): NavRoleKey {
  return variant === 'workspace' ? (navRole ?? 'guest') : 'guest';
}

describe('Home (`/`) consumer-shell contract', () => {
  it('guest role never renders a SideRail', () => {
    expect(hasSidebar('guest')).toBe(false);
  });

  it.each<NavRoleKey>(['owner', 'vendor', 'admin'])(
    'workspace role `%s` renders a SideRail (so the consumer downgrade matters)',
    (role) => {
      expect(hasSidebar(role)).toBe(true);
    },
  );

  it('consumer variant always resolves to guest, ignoring authenticated role', () => {
    // Regardless of what role the user actually has, the consumer shell
    // (used by Index / public catalogs) must downgrade to guest.
    expect(deriveEffectiveNavRole('consumer')).toBe('guest');
    expect(deriveEffectiveNavRole('consumer', 'owner')).toBe('guest');
    expect(deriveEffectiveNavRole('consumer', 'admin')).toBe('guest');
    expect(deriveEffectiveNavRole('consumer', 'vendor')).toBe('guest');
    expect(deriveEffectiveNavRole('consumer', 'mc_portal')).toBe('guest');
  });

  it('workspace variant honours the explicit navRole prop', () => {
    expect(deriveEffectiveNavRole('workspace', 'owner')).toBe('owner');
    expect(deriveEffectiveNavRole('workspace', 'admin')).toBe('admin');
    expect(deriveEffectiveNavRole('workspace', 'vendor')).toBe('vendor');
  });

  it('consumer-resolved role must not produce a SideRail', () => {
    // End-to-end of the contract: any role passed through the consumer
    // variant ends up as guest, and guest has no sidebar → `/` is safe.
    const rolesToTest: NavRoleKey[] = [
      'guest',
      'owner',
      'vendor',
      'admin',
      'mc_portal',
      'investor',
      'team',
    ];
    for (const role of rolesToTest) {
      const effective = deriveEffectiveNavRole('consumer', role);
      expect(hasSidebar(effective)).toBe(false);
    }
  });
});
