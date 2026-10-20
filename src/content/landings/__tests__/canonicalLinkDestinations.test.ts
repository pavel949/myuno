import { describe, expect, it } from 'vitest';
import { CLUSTER_LANDINGS } from '../clusterLandings';
import { P1_TOURISTS } from '../personas/P1_TOURISTS';
import { P03_LONG_STAY_TOURIST } from '../personas/P03_LONG_STAY_TOURIST';
import { P19_ACCESSIBILITY } from '../personas/P19_ACCESSIBILITY';
import { auditContentRoutes, mountedRoutes } from '../../../../scripts/qa/content-route-inventory.mjs';

describe('verified content-link destinations', () => {
  it('uses mounted destinations for the five verified obsolete path families', () => {
    const links = auditContentRoutes();
    const obsolete = ['/areas', '/clearview', '/dining', '/landing/airport-transfer', '/legal/insurance'];
    expect(links.filter(link => obsolete.includes(link.href.split(/[?#]/)[0]))).toEqual([]);
    for (const target of ['/area', '/property/clearview', '/restaurants', '/transfer', '/insurance']) {
      expect(links.filter(link => link.href === target).length).toBeGreaterThan(0);
      expect(mountedRoutes().some(route => route.path === target)).toBe(true);
    }
  });
  it('keeps transfer information separate from the existing booking workflow', () => {
    const arrival = CLUSTER_LANDINGS.find(landing => landing.clusterCode === 'A')!;
    expect(arrival.services.find(service => service.slug === 'airport-transfer')?.href).toBe('/transfer');
    expect(arrival.primaryCta.href).toBe('/transport/airport-transfer');
    expect(P1_TOURISTS.primaryCta.href).toBe('/transport/airport-transfer');
    expect(P19_ACCESSIBILITY.secondaryCta?.href).toBe('/transport/airport-transfer');
  });
  it('keeps the long-stay persona and rental intent while repairing its insurance and area links', () => {
    expect(P03_LONG_STAY_TOURIST.personaCode).toBe('P3');
    expect(P03_LONG_STAY_TOURIST.secondaryCta?.href).toBe('/property?intent=rent-month');
    expect(P03_LONG_STAY_TOURIST.services.find(service => service.slug === 'travel-insurance')?.href).toBe('/insurance');
    expect(P03_LONG_STAY_TOURIST.services.find(service => service.slug === 'area-guide')?.href).toBe('/area');
  });
});
