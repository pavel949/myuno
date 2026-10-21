import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, SIDEBAR_NAV, getActiveBottomBarItem, getWorkspaceDrawerGroups } from '../navigationModel';

// The pre-redesign admin rail plus its existing Review destination. This guards
// specialist access when regrouping the five everyday destinations.
const EXISTING_ADMIN_PATHS = `
/admin/add /admin /admin/inbox /admin/catalog /admin/operations /admin/crm
/admin/providers /admin/transfer-operators /admin/partner-applications
/admin/restaurants /admin/salons /admin/clinics /admin/gyms /admin/vehicles
/admin/transfers /admin/yachts /admin/water-activities /admin/experiences
/admin/activities /admin/events /admin/education /admin/legal /admin/insurance
/admin/pharmacies /admin/stores /admin/pets /admin/cleaning /admin/babysitters
/admin/flowers /admin/consultations /admin/properties /admin/projects
/admin/newbuilds /admin/developers /admin/pm-companies /admin/mc-dashboard
/admin/investments /admin/nb-leads /admin/contracts /admin/finance /admin/control
/admin/acquisition-metrics /admin/investor-metrics /admin/disputes
/admin/marketing /admin/lifecycle-messaging /admin/tickets /admin/quick-listings
/admin/bulk-publish /admin/vendor-prospects /admin/vendor-content /admin/intake
/admin/data-import /admin/trash /admin/ai-agents /admin/ai-ops /admin/ai-knowledge
/admin/qa-test-runner /admin/master-catalog /admin/taxonomy /admin/lookups
/admin/official-news /admin/legal-documents /admin/experience-categories
/admin/life-situations /admin/users /admin/uno-team /admin/cities
/admin/location-knowledge /admin/translations /admin/relocation-articles
/admin/api-keys /admin/settings /admin/review
`.trim().split(/\s+/).sort();

describe('task-first platform navigation', () => {
  it('foregrounds the same five destinations in the sidebar and mobile bar', () => {
    expect(ADMIN_NAV.map(item => item.labelEn)).toEqual(['Today', 'Orders', 'Review', 'Catalog', 'Participants']);
    expect(SIDEBAR_NAV.admin[0].items.map(item => item.labelEn)).toEqual(['Today', 'Requests & orders', 'Review', 'Catalog', 'Participants']);
    expect(SIDEBAR_NAV.admin[0].items.map(item => item.path)).toEqual(ADMIN_NAV.map(item => item.path));
    expect(SIDEBAR_NAV.admin[0].defaultOpen).toBe(true);
    for (const item of ADMIN_NAV) {
      expect(item.labelRu).toBeTruthy();
      expect(item.labelTh).toBeTruthy();
    }
  });

  it('retains every specialist route exactly once, with reports and settings secondary', () => {
    const paths = SIDEBAR_NAV.admin.flatMap(group => group.items.map(item => item.path));
    expect([...paths].sort()).toEqual(EXISTING_ADMIN_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
    expect(SIDEBAR_NAV.admin[1].items.map(item => item.path)).toEqual(['/admin/finance', '/admin/settings']);
    expect(SIDEBAR_NAV.admin.slice(2).every(group => !group.defaultOpen)).toBe(true);
    expect(SIDEBAR_NAV.admin.every(group => group.labelTh)).toBe(true);
    expect(getWorkspaceDrawerGroups('admin')).toBe(SIDEBAR_NAV.admin);
  });

  it('selects Today only at the exact root and never alongside another daily destination', () => {
    expect(getActiveBottomBarItem('admin', '/admin')?.labelEn).toBe('Today');
    for (const [path, label] of [
      ['/admin/operations', 'Orders'], ['/admin/review', 'Review'],
      ['/admin/catalog', 'Catalog'], ['/admin/users/synthetic', 'Participants'],
    ]) {
      expect(getActiveBottomBarItem('admin', path)?.labelEn).toBe(label);
      expect(getActiveBottomBarItem('admin', path)?.labelEn).not.toBe('Today');
    }
    expect(getActiveBottomBarItem('admin', '/admin/settings')).toBeNull();
  });
});
