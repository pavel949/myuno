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
      expect(item.icon).toBeTypeOf('function');
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
    // @ts-expect-error — testing runtime fallback for invalid input
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
