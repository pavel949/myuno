/**
 * M6 · Track D.5 — Unit tests for `prioritizeHomeSections`.
 *
 * Покрытие:
 *  1. Anon → default order
 *  2. Authed без сигналов → default order
 *  3. P1 RU tourist (cluster: arrive) → emergency/now-in-phuket в топе
 *  4. P9 HNW (cluster: invest) → FeaturedPropertiesCarousel в топе
 *  5. P10 operator (cluster: manage) → LifeOSStatusBlock в топе
 *  6. P13 pet-owner (cluster: live + arrive) → CategoryGrid + emergency бустятся
 *  7. PersonaPromptBanner: показывается в топе для authed БЕЗ persona
 *  8. Permutation invariant: длина и состав сохраняются всегда
 *  9. maxJump ограничивает прыжок вверх
 *  10. Стабильность: при равных score сохраняется ordinal
 */
import { describe, it, expect } from 'vitest';
import {
  prioritizeHomeSections,
  isSamePermutation,
  type HomeSectionKey,
} from '../prioritizeHomeSections';
import type { CanonicalProfile } from '@/types/canonical';

const DEFAULT: HomeSectionKey[] = [
  'PersonaPromptBanner',
  'HomeContextChips',
  'ActiveSituation',
  'LifecycleSmartTip',
  'CategoryGrid',
  'ClusterGrid',
  'ClusterHub',
  'NowInPhuket',
  'OfflineEmergencyCard',
  'FeaturedPropertiesCarousel',
  'HomeDiscoveryCarousel',
  'LifeOSStatusBlock',
  'ConciergeCard',
  'ConciergeBanner',
  'ActivityFeed',
  'InlinePersonaSelector',
];

const baseProfile = (over: Partial<CanonicalProfile> = {}): CanonicalProfile => ({
  id: 'u1',
  primaryRole: 'consumer',
  secondaryRoles: [],
  lifecycleStage: null,
  nextLifecycleStageEta: null,
  householdType: null,
  kidsAges: [],
  visitsCount: 0,
  totalDaysInThailand: 0,
  detectedPersona: null,
  detectedPersonaConfidence: null,
  activeClusters: [],
  triggersActive: [],
  specialStatus: [],
  preferredLanguage: 'en',
  ...over,
});

describe('prioritizeHomeSections', () => {
  it('1. anon → returns default order verbatim', () => {
    const out = prioritizeHomeSections(null, DEFAULT);
    expect(out).toEqual(DEFAULT);
  });

  it('2. authed without any signals → default order', () => {
    const out = prioritizeHomeSections(baseProfile(), DEFAULT);
    expect(out).toEqual(DEFAULT);
  });

  it('3. P1 RU tourist (arrive cluster) bumps emergency + now-in-phuket near the top', () => {
    const profile = baseProfile({
      detectedPersona: 'P1',
      lifecycleStage: 'tourist',
      activeClusters: ['arrive'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT);
    const top5 = out.slice(0, 5);
    expect(top5).toContain('OfflineEmergencyCard');
    expect(top5).toContain('NowInPhuket');
    expect(isSamePermutation(out, DEFAULT)).toBe(true);
  });

  it('4. P9 HNW (invest cluster) puts FeaturedPropertiesCarousel into the top 3', () => {
    const profile = baseProfile({
      detectedPersona: 'P9',
      lifecycleStage: 'resident',
      activeClusters: ['invest'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT);
    expect(out.slice(0, 3)).toContain('FeaturedPropertiesCarousel');
  });

  it('5. P10 STR operator (manage) bumps LifeOSStatusBlock to the top 3', () => {
    const profile = baseProfile({
      detectedPersona: 'P10',
      lifecycleStage: 'resident',
      activeClusters: ['manage'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT);
    expect(out.slice(0, 3)).toContain('LifeOSStatusBlock');
  });

  it('6. P13 pet-owner (live + arrive) keeps CategoryGrid and emergency in the top 5', () => {
    const profile = baseProfile({
      detectedPersona: 'P13',
      lifecycleStage: 'tourist',
      activeClusters: ['live', 'arrive'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT);
    const top5 = out.slice(0, 5);
    expect(top5).toContain('CategoryGrid');
    expect(top5).toContain('OfflineEmergencyCard');
  });

  it('7. authed WITHOUT persona → PersonaPromptBanner stays first', () => {
    const profile = baseProfile({
      detectedPersona: null,
      lifecycleStage: 'tourist',
      activeClusters: ['arrive'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT);
    expect(out[0]).toBe('PersonaPromptBanner');
  });

  it('8. permutation invariant — length & set of keys never change', () => {
    const cases: Partial<CanonicalProfile>[] = [
      {},
      { activeClusters: ['arrive', 'invest', 'live'] },
      { detectedPersona: 'P9', activeClusters: ['invest'] },
      { lifecycleStage: 'absentee' },
      { detectedPersona: 'P25' /* nothing in PERSONA_TO_SECTIONS */ },
    ];
    for (const over of cases) {
      const out = prioritizeHomeSections(baseProfile(over), DEFAULT);
      expect(out).toHaveLength(DEFAULT.length);
      expect(new Set(out)).toEqual(new Set(DEFAULT));
    }
  });

  it('9. maxJump=1 prevents a section from leaping more than one slot up', () => {
    const profile = baseProfile({
      detectedPersona: 'P9',
      activeClusters: ['invest'],
    });
    const out = prioritizeHomeSections(profile, DEFAULT, { maxJump: 1 });
    const idxBefore = DEFAULT.indexOf('FeaturedPropertiesCarousel');
    const idxAfter = out.indexOf('FeaturedPropertiesCarousel');
    expect(idxBefore - idxAfter).toBeLessThanOrEqual(1);
  });

  it('10. stable sort — equal scores preserve ordinal', () => {
    // Профиль без сигналов вообще; все score = 0; должен вернуть default 1:1.
    const out = prioritizeHomeSections(baseProfile(), DEFAULT);
    expect(out).toEqual(DEFAULT);
  });
});
