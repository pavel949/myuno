/**
 * Unit tests for the role-based bottom-bar relevance mapping.
 *
 * Locks in the product-level invariants:
 *  - Every role exposes exactly 5 slots (mobile bottom-bar constraint).
 *  - Each slot has a unique route, label, and icon.
 *  - Per-role role-relevance: each role's bar contains the routes the
 *    product team has signed off as "most important" for that persona.
 *  - The fallback resolver never returns an empty bar.
 */
import { describe, it, expect } from 'vitest';
import {
  BOTTOM_BAR_BY_ROLE,
  getBottomBarItems,
  isBottomBarRoute,
  isBottomBarItemActive,
  getActiveBottomBarItem,
  PRIMARY_NAV,
  NAV_BY_ROLE,
  resolveNavRole,
  type NavRoleKey,
} from '../navigationModel';
import { APP_ROUTES } from '@/lib/config/routes';

const ALL_ROLES: NavRoleKey[] = [
  'guest', 'investor', 'mc_portal', 'owner', 'vendor', 'admin', 'team',
];

describe('BOTTOM_BAR_BY_ROLE — structural invariants', () => {
  it('exposes exactly 7 roles', () => {
    expect(Object.keys(BOTTOM_BAR_BY_ROLE).sort()).toEqual([...ALL_ROLES].sort());
  });

  it.each(ALL_ROLES)('role "%s" has exactly 5 bottom-bar slots', (role) => {
    expect(BOTTOM_BAR_BY_ROLE[role]).toHaveLength(5);
  });

  it.each(ALL_ROLES)('role "%s" items have unique paths', (role) => {
    const paths = BOTTOM_BAR_BY_ROLE[role].map((i) => i.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it.each(ALL_ROLES)('role "%s" items have unique labels (en + ru)', (role) => {
    const en = BOTTOM_BAR_BY_ROLE[role].map((i) => i.labelEn);
    const ru = BOTTOM_BAR_BY_ROLE[role].map((i) => i.labelRu);
    expect(new Set(en).size).toBe(en.length);
    expect(new Set(ru).size).toBe(ru.length);
  });

  it.each(ALL_ROLES)('role "%s" items have icon and bilingual labels', (role) => {
    BOTTOM_BAR_BY_ROLE[role].forEach((item) => {
      expect(item.path).toMatch(/^\//);
      // Lucide icons are forwardRef components — either a function or an object.
      expect(['function', 'object']).toContain(typeof item.icon);
      expect(item.icon).toBeTruthy();
      expect(item.labelEn.length).toBeGreaterThan(0);
      expect(item.labelRu.length).toBeGreaterThan(0);
    });
  });

  it('PRIMARY_NAV is the same SSOT as BOTTOM_BAR_BY_ROLE and NAV_BY_ROLE', () => {
    expect(PRIMARY_NAV).toBe(NAV_BY_ROLE);
    expect(BOTTOM_BAR_BY_ROLE).toBe(NAV_BY_ROLE);
  });
});

describe('BOTTOM_BAR_BY_ROLE — per-role relevance', () => {
  it('guest → consumer browsing + monetization', () => {
    const paths = BOTTOM_BAR_BY_ROLE.guest.map((i) => i.path);
    expect(paths).toEqual([
      APP_ROUTES.HOME,
      APP_ROUTES.DISCOVER,
      APP_ROUTES.MARKET,
      APP_ROUTES.PROPERTY,
      APP_ROUTES.ACCOUNT,
    ]);
  });

  it('investor → invest workflow first', () => {
    const paths = BOTTOM_BAR_BY_ROLE.investor.map((i) => i.path);
    expect(paths[0]).toBe(APP_ROUTES.HOME);
    expect(paths).toContain(APP_ROUTES.INVEST_DASHBOARD);
    expect(paths).toContain(APP_ROUTES.PROPERTY);
    expect(paths).toContain(APP_ROUTES.ACCOUNT);
  });

  it('mc_portal → owner read-only portal (finance + comms)', () => {
    const paths = BOTTOM_BAR_BY_ROLE.mc_portal.map((i) => i.path);
    expect(paths).toContain('/my-property');
    expect(paths).toContain('/my-property/statements');
    expect(paths).toContain('/my-property/signatures');
    expect(paths).toContain(APP_ROUTES.MC_MESSAGES);
  });

  it('owner → operator daily PMS loop', () => {
    const paths = BOTTOM_BAR_BY_ROLE.owner.map((i) => i.path);
    expect(paths).toEqual([
      APP_ROUTES.MC,
      APP_ROUTES.MC_PROPERTIES,
      APP_ROUTES.MC_CALENDAR,
      APP_ROUTES.MC_FINANCE,
      APP_ROUTES.MC_MESSAGES,
    ]);
  });

  it('vendor → fulfilment + payouts workflow', () => {
    const paths = BOTTOM_BAR_BY_ROLE.vendor.map((i) => i.path);
    expect(paths).toEqual([
      APP_ROUTES.VENDOR,
      APP_ROUTES.VENDOR_SERVICES,
      APP_ROUTES.VENDOR_BOOKINGS,
      APP_ROUTES.VENDOR_PAYOUTS,
      APP_ROUTES.PROFILE,
    ]);
  });

  it('admin → support + governance', () => {
    const paths = BOTTOM_BAR_BY_ROLE.admin.map((i) => i.path);
    expect(paths).toEqual([
      APP_ROUTES.ADMIN,
      APP_ROUTES.ADMIN_CRM,
      APP_ROUTES.ADMIN_TICKETS,
      APP_ROUTES.ADMIN_MODERATION,
      APP_ROUTES.PROFILE,
    ]);
  });

  it('team → content & moderation workflow', () => {
    const paths = BOTTOM_BAR_BY_ROLE.team.map((i) => i.path);
    expect(paths).toEqual([
      APP_ROUTES.TEAM,
      APP_ROUTES.TEAM_CONTENT,
      APP_ROUTES.ADMIN_MODERATION,
      APP_ROUTES.ADMIN_CRM,
      APP_ROUTES.PROFILE,
    ]);
  });

  it('guest does NOT include workspace routes', () => {
    const paths = BOTTOM_BAR_BY_ROLE.guest.map((i) => i.path);
    expect(paths).not.toContain(APP_ROUTES.MC);
    expect(paths).not.toContain(APP_ROUTES.ADMIN);
    expect(paths).not.toContain(APP_ROUTES.VENDOR);
  });

  it('owner does NOT include consumer-only routes', () => {
    const paths = BOTTOM_BAR_BY_ROLE.owner.map((i) => i.path);
    expect(paths).not.toContain(APP_ROUTES.MARKET);
    expect(paths).not.toContain(APP_ROUTES.DISCOVER);
  });
});

describe('getBottomBarItems — helper', () => {
  it.each(ALL_ROLES)('returns the canonical 5 items for "%s"', (role) => {
    expect(getBottomBarItems(role)).toBe(BOTTOM_BAR_BY_ROLE[role]);
  });

  it('falls back to guest for an unknown role', () => {
    expect(getBottomBarItems('captain')).toBe(BOTTOM_BAR_BY_ROLE.guest);
  });

  it('falls back to guest for null / undefined', () => {
    expect(getBottomBarItems(null)).toBe(BOTTOM_BAR_BY_ROLE.guest);
    expect(getBottomBarItems(undefined)).toBe(BOTTOM_BAR_BY_ROLE.guest);
  });

  it('never returns an empty array', () => {
    [...ALL_ROLES, 'unknown', '', null, undefined].forEach((r) => {
      expect(getBottomBarItems(r as NavRoleKey).length).toBeGreaterThan(0);
    });
  });
});

describe('isBottomBarRoute — membership check', () => {
  it('returns true for routes that belong to the role bar', () => {
    expect(isBottomBarRoute('owner', APP_ROUTES.MC_FINANCE)).toBe(true);
    expect(isBottomBarRoute('vendor', APP_ROUTES.VENDOR_PAYOUTS)).toBe(true);
    expect(isBottomBarRoute('guest', APP_ROUTES.MARKET)).toBe(true);
  });

  it('returns false for routes that are not in the role bar', () => {
    expect(isBottomBarRoute('guest', APP_ROUTES.MC_FINANCE)).toBe(false);
    expect(isBottomBarRoute('owner', APP_ROUTES.MARKET)).toBe(false);
    expect(isBottomBarRoute('admin', APP_ROUTES.VENDOR_PAYOUTS)).toBe(false);
  });
});

describe('resolveNavRole + bottom-bar integration', () => {
  it('authenticated owner on a marketing page still gets the owner bar', () => {
    const role = resolveNavRole({ activeRole: 'owner', pathname: '/pricing' });
    expect(role).toBe('owner');
    expect(getBottomBarItems(role)[0].path).toBe(APP_ROUTES.MC);
  });

  it('unauthenticated user on /admin/* sees admin bar (URL fallback)', () => {
    const role = resolveNavRole({ activeRole: null, pathname: '/admin/users' });
    expect(role).toBe('admin');
    expect(getBottomBarItems(role)).toBe(BOTTOM_BAR_BY_ROLE.admin);
  });

  it('isMCPortal flag overrides URL-based fallback', () => {
    const role = resolveNavRole({ activeRole: null, isMCPortal: true, pathname: '/' });
    expect(role).toBe('mc_portal');
    expect(getBottomBarItems(role)).toBe(BOTTOM_BAR_BY_ROLE.mc_portal);
  });

  it('defaults to guest when no auth and no matching URL prefix', () => {
    const role = resolveNavRole({ pathname: '/' });
    expect(role).toBe('guest');
    expect(getBottomBarItems(role)).toBe(BOTTOM_BAR_BY_ROLE.guest);
  });
});

describe('isBottomBarItemActive — exact-match items', () => {
  const home = BOTTOM_BAR_BY_ROLE.guest[0]; // / (exact)
  const ownerDash = BOTTOM_BAR_BY_ROLE.owner[0]; // /mc (exact)

  it('matches only the exact pathname', () => {
    expect(isBottomBarItemActive(home, '/')).toBe(true);
    expect(isBottomBarItemActive(home, '/discover')).toBe(false);
    expect(isBottomBarItemActive(ownerDash, '/mc')).toBe(true);
    expect(isBottomBarItemActive(ownerDash, '/mc/properties')).toBe(false);
  });
});

describe('isBottomBarItemActive — prefix items', () => {
  const market = BOTTOM_BAR_BY_ROLE.guest[2]; // /market
  const property = BOTTOM_BAR_BY_ROLE.guest[3]; // /property
  const ownerProps = BOTTOM_BAR_BY_ROLE.owner[1]; // /mc/properties

  it('matches the path itself and any nested route', () => {
    expect(isBottomBarItemActive(market, '/market')).toBe(true);
    expect(isBottomBarItemActive(market, '/market/store/123')).toBe(true);
    expect(isBottomBarItemActive(property, '/property/browse')).toBe(true);
    expect(isBottomBarItemActive(ownerProps, '/mc/properties/abc/edit')).toBe(true);
  });

  it('does not match unrelated routes (respects "/" boundary)', () => {
    expect(isBottomBarItemActive(market, '/marketing')).toBe(false);
    expect(isBottomBarItemActive(property, '/properties')).toBe(false);
    expect(isBottomBarItemActive(ownerProps, '/mc/finance')).toBe(false);
  });
});

describe('isBottomBarItemActive — alias groups', () => {
  const account = BOTTOM_BAR_BY_ROLE.guest[4]; // /account

  it('treats /profile and /me as part of the /account tab', () => {
    expect(isBottomBarItemActive(account, '/account')).toBe(true);
    expect(isBottomBarItemActive(account, '/account/settings')).toBe(true);
    expect(isBottomBarItemActive(account, '/profile')).toBe(true);
    expect(isBottomBarItemActive(account, '/profile/edit')).toBe(true);
    expect(isBottomBarItemActive(account, '/me')).toBe(true);
    expect(isBottomBarItemActive(account, '/me/services')).toBe(true);
  });

  it('does not over-match unrelated paths', () => {
    expect(isBottomBarItemActive(account, '/messages')).toBe(false);
    expect(isBottomBarItemActive(account, '/discover')).toBe(false);
  });
});

describe('getActiveBottomBarItem — most-specific wins', () => {
  it('returns null when no item matches', () => {
    expect(getActiveBottomBarItem('owner', '/totally/unknown')).toBeNull();
  });

  it('guest on /market highlights Market', () => {
    const item = getActiveBottomBarItem('guest', '/market');
    expect(item?.path).toBe('/market');
    expect(item?.labelEn).toBe('Market');
  });

  it('guest on / highlights Home (exact)', () => {
    expect(getActiveBottomBarItem('guest', '/')?.labelEn).toBe('Home');
  });

  it('guest on /profile/edit highlights Me via alias', () => {
    expect(getActiveBottomBarItem('guest', '/profile/edit')?.path).toBe('/account');
  });

  it('owner on /mc highlights Dashboard, on /mc/finance highlights Finance', () => {
    expect(getActiveBottomBarItem('owner', '/mc')?.labelEn).toBe('Dashboard');
    expect(getActiveBottomBarItem('owner', '/mc/finance/transactions')?.labelEn).toBe('Finance');
  });

  it('mc_portal on /my-property/statements highlights Statements (longest prefix)', () => {
    const item = getActiveBottomBarItem('mc_portal', '/my-property/statements');
    expect(item?.path).toBe('/my-property/statements');
  });

  it('admin on /admin/crm/123 highlights CRM', () => {
    expect(getActiveBottomBarItem('admin', '/admin/crm/123')?.labelEn).toBe('CRM');
  });

  it('vendor on /vendor highlights Dashboard (exact match)', () => {
    expect(getActiveBottomBarItem('vendor', '/vendor')?.labelEn).toBe('Dashboard');
  });

  it('investor on /invest/dashboard/projects highlights Invest', () => {
    expect(
      getActiveBottomBarItem('investor', '/invest/dashboard/projects')?.labelEn,
    ).toBe('Invest');
  });
});
