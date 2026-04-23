/**
 * M6 · Track D.3 — render-tests для <PersonaAwareSections />.
 *
 * Проверяет, что обёртка:
 *  1. Рендерит дефолтный порядок при `disabled=true`.
 *  2. Рендерит дефолтный порядок при loading.
 *  3. Перестраивает порядок по profile (P9 → FeaturedPropertiesCarousel поднимается).
 *  4. Тихо пропускает отсутствующие в `sections` ключи.
 *  5. Anon (profile=null) → дефолтный порядок.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PersonaAwareSections } from './PersonaAwareSections';
import type { HomeSectionKey } from '@/lib/segmentation/prioritizeHomeSections';
import type { CanonicalProfile } from '@/types/canonical';

const profileMock = vi.fn();
vi.mock('@/hooks/useCanonicalProfile', () => ({
  useCanonicalProfile: () => profileMock(),
}));

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

const ORDER: HomeSectionKey[] = [
  'PersonaPromptBanner',
  'CategoryGrid',
  'FeaturedPropertiesCarousel',
  'OfflineEmergencyCard',
];

const sections = {
  PersonaPromptBanner: <div data-testid="s-banner">B</div>,
  CategoryGrid: <div data-testid="s-cat">C</div>,
  FeaturedPropertiesCarousel: <div data-testid="s-feat">F</div>,
  OfflineEmergencyCard: <div data-testid="s-em">E</div>,
};

const getOrder = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-testid]')).map((n) =>
    n.getAttribute('data-testid'),
  );

describe('<PersonaAwareSections />', () => {
  it('1. disabled → renders defaultOrder 1:1', () => {
    profileMock.mockReturnValue({
      profile: baseProfile({ detectedPersona: 'P9', activeClusters: ['invest'] }),
      isLoading: false,
    });
    const { container } = render(
      <PersonaAwareSections defaultOrder={ORDER} sections={sections} disabled />,
    );
    expect(getOrder(container)).toEqual(['s-banner', 's-cat', 's-feat', 's-em']);
  });

  it('2. loading → renders defaultOrder 1:1', () => {
    profileMock.mockReturnValue({ profile: null, isLoading: true });
    const { container } = render(
      <PersonaAwareSections defaultOrder={ORDER} sections={sections} />,
    );
    expect(getOrder(container)).toEqual(['s-banner', 's-cat', 's-feat', 's-em']);
  });

  it('3. P9 HNW (invest) → FeaturedPropertiesCarousel jumps near the top', () => {
    profileMock.mockReturnValue({
      profile: baseProfile({
        detectedPersona: 'P9',
        lifecycleStage: 'resident',
        activeClusters: ['invest'],
      }),
      isLoading: false,
    });
    const { container } = render(
      <PersonaAwareSections defaultOrder={ORDER} sections={sections} />,
    );
    const order = getOrder(container);
    // FeaturedPropertiesCarousel должен подняться выше CategoryGrid.
    expect(order.indexOf('s-feat')).toBeLessThan(order.indexOf('s-cat'));
  });

  it('4. tolerates missing keys in sections', () => {
    profileMock.mockReturnValue({ profile: null, isLoading: false });
    const partial = { CategoryGrid: <div data-testid="s-cat">C</div> };
    const { container } = render(
      <PersonaAwareSections defaultOrder={ORDER} sections={partial} />,
    );
    expect(getOrder(container)).toEqual(['s-cat']);
  });

  it('5. anon (profile=null, not loading) → defaultOrder', () => {
    profileMock.mockReturnValue({ profile: null, isLoading: false });
    const { container } = render(
      <PersonaAwareSections defaultOrder={ORDER} sections={sections} />,
    );
    expect(getOrder(container)).toEqual(['s-banner', 's-cat', 's-feat', 's-em']);
  });
});
