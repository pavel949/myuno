/**
 * Discover situation navigation contract.
 *
 * Guards the click path of a life-situation row/card in the /discover block:
 *  1. the link points at the expected destination (catalog list `/discover/:code`
 *     or an explicit marketing-landing override — i.e. the situation "filter" is
 *     applied through the URL, not through hidden local state);
 *  2. the same situation never renders twice across the "For you" block and the
 *     cluster sections (de-duplication guarantee of `buildSituationSections`);
 *  3. the map entry point stays a single, stable `/map` link.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const trackSituationClick = vi.fn();
const trackSituationImpression = vi.fn();

vi.mock('@/lib/analytics/track', () => ({
  trackSituationClick: (...args: unknown[]) => trackSituationClick(...args),
  trackSituationImpression: (...args: unknown[]) => trackSituationImpression(...args),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', t: (k: string) => k }),
}));

import { SituationList } from '../SituationList';
import { SituationCard } from '../SituationCard';
import { resolveSituationHref, SITUATION_LANDING_OVERRIDES } from '@/lib/navigation/situationLandingMap';
import { buildSituationSections } from '@/lib/navigation/situationSections';
import type { ClusterId } from '@/lib/catalog/taxonomy';

type TestSituation = {
  id: string;
  code: string;
  title_ru: string;
  title_en: string;
  description_ru: string | null;
  description_en: string | null;
  icon: string | null;
  color: string | null;
  cluster: ClusterId;
};

function situation(code: string, cluster: ClusterId): TestSituation {
  return {
    id: `id-${code}`,
    code,
    title_ru: `RU ${code}`,
    title_en: `EN ${code}`,
    description_ru: null,
    description_en: null,
    icon: 'Compass',
    color: null,
    cluster,
  };
}

const SITUATIONS: TestSituation[] = [
  situation('arrival', 'arrive'),
  situation('emergency', 'live'),
  situation('rent_long_term', 'live'),
  situation('buy_property', 'invest'),
  situation('visa_extension', 'legal'),
  situation('developer', 'invest'),
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const asLifeSituations = (list: TestSituation[]) => list as unknown as any[];

function renderList(list: TestSituation[], source = 'navigator_v3_for_you') {
  return render(
    <MemoryRouter>
      <SituationList situations={asLifeSituations(list)} source={source} />
    </MemoryRouter>,
  );
}

/**
 * jsdom has no real IntersectionObserver — the global setup stub never fires.
 * Replace it with one that reports the element as visible right away so the
 * impression layer can be asserted.
 */
class ImmediateIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.cb(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

beforeEach(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    ImmediateIntersectionObserver;
  trackSituationClick.mockClear();
  trackSituationImpression.mockClear();
});

describe('resolveSituationHref', () => {
  it('routes a plain situation to its filtered catalog list', () => {
    expect(resolveSituationHref('arrival')).toBe('/discover/arrival');
  });

  it('honours marketing-landing overrides', () => {
    for (const [code, href] of Object.entries(SITUATION_LANDING_OVERRIDES)) {
      expect(resolveSituationHref(code)).toBe(href);
    }
  });
});

describe('situation rows link to the expected list', () => {
  it('renders one link per situation, pointing at the resolved destination', () => {
    renderList(SITUATIONS);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(SITUATIONS.length);
    for (const s of SITUATIONS) {
      const link = screen.getByRole('link', { name: new RegExp(`EN ${s.code}`) });
      expect(link).toHaveAttribute('href', resolveSituationHref(s.code));
    }
  });

  it('tracks the click with the resolved href and source', () => {
    renderList([situation('arrival', 'arrive')], 'cluster_section');
    screen.getByRole('link').click();
    expect(trackSituationClick).toHaveBeenCalledWith(
      'arrival',
      expect.objectContaining({
        source: 'cluster_section',
        href: '/discover/arrival',
        variant: 'compact',
      }),
    );
  });

  it('sends the same click payload shape for the prominent variant', () => {
    render(
      <MemoryRouter>
        <SituationList
          situations={asLifeSituations([situation('arrival', 'arrive')])}
          source="navigator_v3_for_you"
          variant="prominent"
          counts={{ 'id-arrival': 4 }}
        />
      </MemoryRouter>,
    );
    screen.getByRole('link').click();
    expect(trackSituationClick).toHaveBeenCalledWith(
      'arrival',
      expect.objectContaining({
        source: 'navigator_v3_for_you',
        href: '/discover/arrival',
        variant: 'prominent',
        count: 4,
      }),
    );
  });

  it('renders a situation card link to the same destination as the row', () => {
    const s = situation('buy_property', 'invest');
    render(
      <MemoryRouter>
        <SituationCard situation={asLifeSituations([s])[0]} clusterId="invest" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/discover/buy_property');
  });
});

describe('no duplicate situations across the Discover block', () => {
  const allowed: ClusterId[] = ['arrive', 'live', 'manage', 'invest', 'legal', 'build'];

  const build = (flat = false) =>
    buildSituationSections({
      situations: SITUATIONS,
      clusterOf: (s) => s.cluster,
      allowedClusters: allowed,
      featuredLimit: 3,
      flat,
    });

  it('claims each situation exactly once', () => {
    const { featured, byCluster } = build();
    const ids = [...featured, ...allowed.flatMap((c) => byCluster[c])].map((s) => s.id);
    expect(ids).toHaveLength(SITUATIONS.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('renders every situation exactly once through SituationList', () => {
    const { featured, byCluster, clustersWithContent } = build();
    render(
      <MemoryRouter>
        <SituationList situations={asLifeSituations(featured)} source="for_you" />
        {clustersWithContent.map((cid) => (
          <SituationList
            key={cid}
            situations={asLifeSituations(byCluster[cid])}
            source="cluster_section"
          />
        ))}
      </MemoryRouter>,
    );
    const hrefs = screen.getAllByRole('link').map((el) => el.getAttribute('href'));
    expect(hrefs).toHaveLength(SITUATIONS.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('search mode (flat) has no featured block and still never repeats', () => {
    const { featured, byCluster } = build(true);
    expect(featured).toHaveLength(0);
    const ids = allowed.flatMap((c) => byCluster[c]).map((s) => s.id);
    expect(new Set(ids).size).toBe(SITUATIONS.length);
  });

  it('drops situations from clusters that are not allowed', () => {
    const { featured, byCluster, clustersWithContent } = buildSituationSections({
      situations: SITUATIONS,
      clusterOf: (s) => s.cluster,
      allowedClusters: ['live'],
      featuredLimit: 1,
      flat: false,
    });
    const rendered = [...featured, ...clustersWithContent.flatMap((c) => byCluster[c])];
    expect(rendered.every((s) => s.cluster === 'live')).toBe(true);
    expect(new Set(rendered.map((s) => s.id)).size).toBe(rendered.length);
  });
});

describe('map entry point', () => {
  it('Discover header exposes exactly one /map link', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/navigation/v3/NavigatorPageV3.tsx'),
      'utf8',
    );
    const matches = src.match(/to="\/map"/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});

describe('unified situation tracking layer', () => {
  it('emits one batched impression per list, whatever the variant', () => {
    render(
      <MemoryRouter>
        <SituationList
          situations={asLifeSituations([situation('a1', 'arrive'), situation('a2', 'live')])}
          source="impression_compact"
          variant="compact"
        />
        <SituationList
          situations={asLifeSituations([situation('b1', 'arrive')])}
          source="impression_prominent"
          variant="prominent"
        />
      </MemoryRouter>,
    );
    const calls = trackSituationImpression.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toEqual(['a1', 'a2']);
    expect(calls[0][1]).toMatchObject({ source: 'impression_compact', variant: 'compact' });
    expect(calls[1][0]).toEqual(['b1']);
    expect(calls[1][1]).toMatchObject({ source: 'impression_prominent', variant: 'prominent' });
  });

  it('never repeats an impression for the same situation + source', () => {
    const list = asLifeSituations([situation('dedupe_me', 'live')]);
    render(
      <MemoryRouter>
        <SituationList situations={list} source="impression_dedupe" variant="compact" />
      </MemoryRouter>,
    );
    render(
      <MemoryRouter>
        <SituationList situations={list} source="impression_dedupe" variant="compact" />
      </MemoryRouter>,
    );
    const sent = trackSituationImpression.mock.calls.flatMap((c) => c[0] as string[]);
    expect(sent.filter((code) => code === 'dedupe_me')).toHaveLength(1);
  });

  it('cards report through the same layer', () => {
    render(
      <MemoryRouter>
        <SituationCard
          situation={asLifeSituations([situation('card_code', 'invest')])[0]}
          clusterId="invest"
          serviceCount={7}
        />
      </MemoryRouter>,
    );
    expect(trackSituationImpression).toHaveBeenCalledWith(
      ['card_code'],
      expect.objectContaining({ source: 'situation_card', variant: 'card', cluster: 'invest' }),
    );
    screen.getByRole('link').click();
    expect(trackSituationClick).toHaveBeenCalledWith(
      'card_code',
      expect.objectContaining({
        source: 'situation_card',
        variant: 'card',
        cluster: 'invest',
        href: '/discover/card_code',
        count: 7,
      }),
    );
  });
});
