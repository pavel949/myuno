import { describe, it, expect } from 'vitest';
import { detectPersona } from '../detectPersona';

describe('detectPersona — M5 fallback matrix', () => {
  it('Scout + investor-passive → P11 + invest cluster', () => {
    const r = detectPersona({ lifecycle: 'scout', role: 'investor-passive', modifiers: [] });
    expect(r.detected_persona).toBe('P11');
    expect(r.active_clusters).toContain('invest');
    expect(r.triggers).toContain('first_visit');
    expect(r.triggers).toContain('investment_intent_detected');
  });

  it('Tourist + consumer → P2 + arrive cluster', () => {
    const r = detectPersona({ lifecycle: 'tourist', role: 'consumer', modifiers: [] });
    expect(r.detected_persona).toBe('P2');
    expect(r.active_clusters).toEqual(['arrive']);
    expect(r.triggers).toContain('first_visit');
  });

  it('Snowbird + resident-user → P5 + arrive/live clusters', () => {
    const r = detectPersona({ lifecycle: 'snowbird', role: 'resident-user', modifiers: [] });
    expect(r.detected_persona).toBe('P5');
    expect(r.active_clusters).toEqual(expect.arrayContaining(['arrive', 'live', 'legal']));
    expect(r.triggers).toContain('long_stay_eligible');
  });

  it('Nomad + resident-user → P7 + live/legal clusters', () => {
    const r = detectPersona({ lifecycle: 'nomad', role: 'resident-user', modifiers: [] });
    expect(r.detected_persona).toBe('P7');
    expect(r.active_clusters).toEqual(expect.arrayContaining(['live', 'legal']));
  });

  it('Settler + resident-user with family-young → P8 + live cluster', () => {
    const r = detectPersona({
      lifecycle: 'settler',
      role: 'resident-user',
      modifiers: ['family-young'],
    });
    expect(r.detected_persona).toBe('P8');
    expect(r.active_clusters).toContain('live');
    expect(r.triggers).toContain('family_with_kids_arriving');
  });

  it('Resident + operator → P17 + manage cluster', () => {
    const r = detectPersona({ lifecycle: 'resident', role: 'operator', modifiers: [] });
    expect(r.detected_persona).toBe('P17');
    expect(r.active_clusters).toContain('manage');
  });

  it('Absentee + investor-passive → P18 + manage/invest clusters', () => {
    const r = detectPersona({ lifecycle: 'absentee', role: 'investor-passive', modifiers: [] });
    expect(r.detected_persona).toBe('P18');
    expect(r.active_clusters).toEqual(expect.arrayContaining(['manage', 'invest']));
  });

  it('Returnee + resident-user → P10 + arrive/live clusters', () => {
    const r = detectPersona({ lifecycle: 'returnee', role: 'resident-user', modifiers: [] });
    expect(r.detected_persona).toBe('P10');
    expect(r.triggers).toContain('returning_guest');
  });

  it('Resident + provider → P19 + build/manage clusters', () => {
    const r = detectPersona({ lifecycle: 'resident', role: 'provider', modifiers: [] });
    expect(r.detected_persona).toBe('P19');
    expect(r.active_clusters).toEqual(expect.arrayContaining(['build', 'manage']));
  });

  it('Resident + investor-active with multiple modifiers → P14 + higher confidence', () => {
    const r = detectPersona({
      lifecycle: 'resident',
      role: 'investor-active',
      modifiers: ['pet-owner', 'family-school', 'medical'],
    });
    expect(r.detected_persona).toBe('P14');
    expect(r.active_clusters).toEqual(expect.arrayContaining(['live', 'invest', 'build', 'legal']));
    expect(r.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('Unknown matrix combo falls back to role default', () => {
    const r = detectPersona({ lifecycle: 'absentee', role: 'consumer', modifiers: [] });
    expect(r.detected_persona).toBe('P2');
    expect(r.confidence).toBeLessThan(0.75);
  });
});
