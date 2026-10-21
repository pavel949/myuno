import { describe, expect, it } from 'vitest';
import { mountedRoutes, auditContentRoutes } from '../../../scripts/qa/content-route-inventory.mjs';

describe('mounted route ownership', () => {
  const routes = mountedRoutes();
  it.each(['/invest', '/property/clearview', '/property/clearview/apply', '/mc/sequences'])('has exactly one declaration for %s', path => {
    expect(routes.filter(route => route.path === path && !route.index)).toHaveLength(1);
  });
  it('retains the investment landing rather than a self redirect', () => {
    const route = routes.find(route => route.path === '/invest' && !route.index)!;
    expect(route.element).toContain('InvestmentHubLanding');
    expect(route.element).not.toContain('Navigate');
  });
  it.each(['/property/clearview', '/property/clearview/apply'])('keeps %s inside the property layout and its existing transition', path => {
    const route = routes.find(route => route.path === path)!;
    expect(route.ancestors.join(' ')).toContain('PropertyHub');
    expect(route.element).toContain('LazyPage');
  });
  it('retains protected MC CRM sequences separately from public outreach', () => {
    const sequences = routes.find(route => route.path === '/mc/sequences')!;
    expect(sequences.element).toContain('CrmSequencesPage');
    expect(sequences.ancestors.join(' ')).toContain('MCGuard');
    expect(sequences.ancestors.join(' ')).toContain('MCLayout');
    expect(sequences.ancestors.join(' ')).toContain('ActiveCompanyProvider');
    const outreach = routes.find(route => route.path === '/outreach')!;
    expect(outreach.element).toContain('OutreachHub');
    expect(outreach.ancestors.join(' ')).not.toContain('MCGuard');
  });
  it('does not count catch-all NotFound routes as usable content destinations', () => {
    expect(auditContentRoutes().find(link => link.href === '/services/health/recovery')?.status).toBe('unmatched');
  });
});
