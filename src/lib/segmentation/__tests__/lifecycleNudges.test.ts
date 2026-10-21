import { describe, it, expect } from 'vitest';
import { computeLifecycleNudges, type LifecycleNudgeInput } from '../lifecycleNudges';

const base: LifecycleNudgeInput = {
  lifecycleStage: null,
  visitsCount: 0,
  totalDaysInThailand: 0,
  kidsAges: [],
  specialStatus: [],
};

describe('computeLifecycleNudges — § 9.4 lifecycle triggers', () => {
  it('returns [] for null profile (anon — regression-safe)', () => {
    expect(computeLifecycleNudges(null)).toEqual([]);
  });

  it('returns [] when no signal crosses a threshold', () => {
    expect(computeLifecycleNudges({ ...base })).toEqual([]);
  });

  it('emits tax-residency nudge when total_days_in_thailand > 175', () => {
    const r = computeLifecycleNudges({ ...base, totalDaysInThailand: 180 });
    expect(r.map((n) => n.id)).toContain('tax-residency-175');
    expect(r[0].severity).toBe('high'); // sorted first
  });

  it('no tax nudge at exactly 175 (strict greater-than)', () => {
    const r = computeLifecycleNudges({ ...base, totalDaysInThailand: 175 });
    expect(r.map((n) => n.id)).not.toContain('tax-residency-175');
  });

  it('emits snowbird nudge when visits>=2 and days>21 in an early stage', () => {
    const r = computeLifecycleNudges({
      ...base,
      lifecycleStage: 'tourist',
      visitsCount: 2,
      totalDaysInThailand: 22,
    });
    expect(r.map((n) => n.id)).toContain('snowbird-eligible');
  });

  it('suppresses snowbird nudge once the user is a resident', () => {
    const r = computeLifecycleNudges({
      ...base,
      lifecycleStage: 'resident',
      visitsCount: 5,
      totalDaysInThailand: 300,
    });
    expect(r.map((n) => n.id)).not.toContain('snowbird-eligible');
  });

  it('emits family nudge when any kid is under 18', () => {
    const r = computeLifecycleNudges({ ...base, kidsAges: [4, 9] });
    expect(r.map((n) => n.id)).toContain('family-hub');
  });

  it('emits pet nudge from special_status', () => {
    const r = computeLifecycleNudges({ ...base, specialStatus: ['pet-owner'] });
    expect(r.map((n) => n.id)).toContain('pet-section');
  });

  it('orders nudges high → medium → low', () => {
    const r = computeLifecycleNudges({
      ...base,
      totalDaysInThailand: 200,
      visitsCount: 2,
      specialStatus: ['pet-owner'],
    });
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const sev = r.map((n) => n.severity);
    expect(sev).toEqual([...sev].sort((a, b) => rank[a] - rank[b]));
  });

  it('respects the limit option', () => {
    const r = computeLifecycleNudges(
      { ...base, totalDaysInThailand: 200, kidsAges: [3], specialStatus: ['pet-owner'] },
      { limit: 1 },
    );
    expect(r).toHaveLength(1);
  });
});
