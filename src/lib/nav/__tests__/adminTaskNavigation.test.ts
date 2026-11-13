import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ADMIN_NAV, SIDEBAR_NAV, getActiveBottomBarItem, getWorkspaceDrawerGroups } from '../navigationModel';

// Consolidated destinations only: merged tools remain available through tabs and
// query-preserving legacy redirects, not duplicate sidebar entries.
const EXISTING_ADMIN_PATHS = `
/admin/add /admin /admin/inbox /admin/catalog /admin/operations /admin/crm
/admin/providers /admin/partner-applications /admin/claims /admin/thai-business
/admin/restaurants /admin/restaurants/data-quality /admin/salons /admin/clinics /admin/gyms
/admin/transfers /admin/yachts /admin/water-activities /admin/experiences
/admin/events /admin/education /admin/legal /admin/insurance
/admin/pharmacies /admin/stores /admin/pets /admin/cleaning /admin/babysitters
/admin/flowers /admin/consultations /admin/properties /admin/newbuilds
/admin/pm-companies /admin/mc-dashboard /admin/investments /admin/nb-leads
/admin/contracts /admin/finance /admin/analytics /admin/disputes
/admin/lifecycle-messaging /admin/tickets /admin/vendor-prospects /admin/trash
/admin/ai-agents /admin/ai-ops /admin/ai-knowledge /admin/qa-test-runner
/admin/official-news /admin/legal-documents /admin/experience-categories
/admin/life-situations /admin/users /admin/uno-team /admin/cities
/admin/location-knowledge /admin/translations /admin/relocation-articles
/admin/api-keys /admin/settings /admin/settings/forms /admin/settings/google-maps /admin/review
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

  it('retains specialist destinations once, with finance and settings secondary', () => {
    const paths = SIDEBAR_NAV.admin.flatMap(group => group.items.map(item => item.path));
    expect([...paths].sort()).toEqual(EXISTING_ADMIN_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
    // Duplicate water editor is hidden from the rail, not removed: legacy action=new survives.
    expect(readFileSync('src/components/layout/routes/adminRoutes.tsx','utf8')).toContain('path="/admin/activities" element={<Pages.AdminActivities />}');
    expect(SIDEBAR_NAV.admin[1].items.map(item => item.path)).toEqual(['/admin/finance', '/admin/settings']);
    expect(SIDEBAR_NAV.admin.slice(2).every(group => !group.defaultOpen)).toBe(true);
    expect(SIDEBAR_NAV.admin.every(group => group.labelTh)).toBe(true);
    const verticals = SIDEBAR_NAV.admin.find(group => group.labelEn === 'Verticals')!;
    expect(verticals.items.map(item => item.labelRu)).toEqual([...verticals.items.map(item => item.labelRu)].sort((a, b) => a.localeCompare(b, 'ru')));
    const routes = readFileSync('src/components/layout/routes/adminRoutes.tsx', 'utf8');
    for (const legacyRoute of ['/admin/control', '/admin/master-catalog', '/admin/acquisition-metrics', '/admin/investor-metrics', '/admin/marketing', '/admin/lead-configs', '/admin/intake-configs', '/admin/transfer-operators', '/admin/transfers/sla', '/admin/diagnostics/google-maps']) {
      expect(routes).toContain(`path="${legacyRoute}"`);
    }
    expect(routes).toContain('path="/admin/control" element={<Navigate to="/admin" replace />}');
    expect(routes).toContain('path="/admin/thai-business" element={<Pages.AdminThaiBusiness />}');
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
