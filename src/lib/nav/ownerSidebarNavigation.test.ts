import { describe, expect, it } from 'vitest';
import {
  getActiveOwnerSidebarPath,
  getBottomBarItems,
  getOwnerSidebarForRole,
  getOwnerSidebarForViewport,
} from './navigationModel';

const hrefs = (groups: ReturnType<typeof getOwnerSidebarForRole>) => groups.flatMap(group => group.items.map(item => item.path));

describe('management workspace sidebar', () => {
  for (const profile of [
    { role: 'general', propertyCount: 1 },
    { role: 'general', propertyCount: 2 },
    { role: 'property_manager', propertyCount: 3 },
    { role: 'sales_agent', propertyCount: 3 },
    { role: 'service_provider', propertyCount: 3 },
  ] as const) {
    it(`preserves the same destinations without duplicates on mobile for ${profile.role}/${profile.propertyCount}`, () => {
      const allowed = getOwnerSidebarForRole(profile.role, profile);
      const wide = getOwnerSidebarForViewport(allowed, false);
      const phone = getOwnerSidebarForViewport(allowed, true);
      const tabPaths = new Set(getBottomBarItems('owner').map(item => item.path));
      const fallback = phone.filter(group => group.mobileQuickLinks);

      expect(wide).toBe(allowed);
      expect(fallback).toHaveLength(1);
      expect(fallback[0].defaultOpen).toBeUndefined();
      expect(hrefs(fallback).sort()).toEqual(hrefs(wide).filter(path => tabPaths.has(path)).sort());
      expect(hrefs(phone.filter(group => !group.mobileQuickLinks)).some(path => tabPaths.has(path))).toBe(false);
      expect(new Set(hrefs(phone)).size).toBe(hrefs(phone).length);
      expect(hrefs(phone).sort()).toEqual(hrefs(wide).sort());
    });
  }

  it('places finances and CRM in distinct workflow groups without exposing either to service providers', () => {
    const wide = getOwnerSidebarForRole('property_manager');
    expect(wide.find(group => group.labelEn === 'Finance')?.items.some(item => item.path === '/mc/finance')).toBe(true);
    expect(wide.find(group => group.labelEn === 'Sales & CRM')?.items.some(item => item.path === '/mc/crm-dashboard')).toBe(true);

    const providerPhone = getOwnerSidebarForViewport(getOwnerSidebarForRole('service_provider'), true);
    expect(hrefs(providerPhone)).not.toContain('/mc/finance');
    expect(hrefs(providerPhone)).not.toContain('/mc/crm-dashboard');
    expect(getActiveOwnerSidebarPath(providerPhone, '/mc/reports')).toBeUndefined();
  });

  it('tracks active links in both layouts, including related financial routes and collapsed quick links', () => {
    for (const mobile of [false, true]) {
      const groups = getOwnerSidebarForViewport(getOwnerSidebarForRole('property_manager'), mobile);
      expect(getActiveOwnerSidebarPath(groups, '/mc')).toBe('/mc');
      expect(getActiveOwnerSidebarPath(groups, '/mc/properties/published/')).toBe('/mc/properties');
      expect(getActiveOwnerSidebarPath(groups, '/mc/reports')).toBe('/mc/finance');
      expect(getActiveOwnerSidebarPath(groups, '/mc/financials')).toBe('/mc/finance');
      expect(getActiveOwnerSidebarPath(groups, '/mc/budget')).toBe('/mc/finance');
      expect(getActiveOwnerSidebarPath(groups, '/mc/finance/planning')).toBe('/mc/finance');
      expect(getActiveOwnerSidebarPath(groups, '/mc/unlisted')).toBeUndefined();
    }
  });
});
