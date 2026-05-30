/**
 * Tests for ClusterLandingPage routing logic (M6 · Track B.5).
 *
 * Контракт B.5 (симметрично B.4):
 *  - Неизвестный slug → 404.
 *  - Известный, но `draft` → 404.
 *  - Известный + `live` → рендер страницы.
 *  - Cross-link «По персонам» — только live-персоны из `relatedPersonas`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { ClusterLanding, PersonaLanding } from '@/lib/landings/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'ru' }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));
vi.mock('@/pages/NotFound', () => ({
  default: () => <div data-testid="not-found">404</div>,
}));

let MOCK_CLUSTERS: ClusterLanding[] = [];
let MOCK_PERSONAS: PersonaLanding[] = [];
vi.mock('@/content/landings/clusterLandings', () => ({
  get CLUSTER_LANDINGS() {
    return MOCK_CLUSTERS;
  },
  LIVE_CLUSTER_SLUGS: [],
}));
vi.mock('@/content/landings/personaLandings', () => ({
  get PERSONA_LANDINGS() {
    return MOCK_PERSONAS;
  },
  LIVE_PERSONA_SLUGS: [],
}));

import ClusterLandingPage from '../ClusterLandingPage';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/cluster/:cluster" element={<ClusterLandingPage />} />
      </Routes>
    </MemoryRouter>,
  );

const liveCluster: ClusterLanding = {
  clusterCode: 'A',
  slug: 'arrival',
  status: 'live',
  h1: { ru: 'Прибытие на Пхукет', en: 'Arrival on Phuket' },
  subtitle: { ru: 'Подзаголовок', en: 'Subtitle' },
  jobs: [{ ru: 'Заказать трансфер', en: 'Book transfer' }],
  services: [
    { slug: 'transfer', label: { ru: 'Трансфер', en: 'Transfer' }, href: '/transfer' },
  ],
  faq: [{ q: { ru: 'q', en: 'q' }, a: { ru: 'a', en: 'a' } }],
  primaryCta: { label: { ru: 'Начать', en: 'Start' }, href: '/start' },
  relatedPersonas: ['P1', 'P9'],
  seo: {
    metaTitle: { ru: 'T', en: 'T' },
    metaDescription: { ru: 'D', en: 'D' },
    ogImage: 'https://example.com/og.jpg',
    canonicalPath: '/cluster/arrival',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://x/ru' },
      { lang: 'en', href: 'https://x/en' },
    ],
  },
};

const draftCluster: ClusterLanding = {
  clusterCode: 'D',
  slug: 'investment',
  status: 'draft',
  h1: { ru: 'Инвестиции', en: 'Investment' },
  subtitle: { ru: 'sub', en: 'sub' },
  jobs: [],
  services: [],
  faq: [],
  primaryCta: { label: { ru: 'На главную', en: 'Go home' }, href: '/' },
  relatedPersonas: ['P9'],
};

const livePersonaP1: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: { ru: 'Туристы', en: 'Tourists' },
  subtitle: { ru: 's', en: 's' },
  pains: [{ ru: 'p', en: 'p' }],
  services: [{ slug: 'sim', label: { ru: 'SIM', en: 'SIM' }, href: '/sim' }],
  faq: [{ q: { ru: 'q', en: 'q' }, a: { ru: 'a', en: 'a' } }],
  primaryCta: { label: { ru: 'Начать', en: 'Start' }, href: '/start' },
  seo: {
    metaTitle: { ru: 'T', en: 'T' },
    metaDescription: { ru: 'D', en: 'D' },
    ogImage: 'https://example.com/og.jpg',
    canonicalPath: '/for/tourists',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://x/ru' },
      { lang: 'en', href: 'https://x/en' },
    ],
  },
};

const draftPersonaP9: PersonaLanding = {
  personaCode: 'P9',
  slug: 'hnw',
  status: 'draft',
  h1: { ru: 'HNW', en: 'HNW' },
  subtitle: { ru: 's', en: 's' },
  pains: [],
  services: [],
  faq: [],
  primaryCta: { label: { ru: 'На главную', en: 'Go home' }, href: '/' },
};

describe('ClusterLandingPage — B.5 routing', () => {
  it('renders 404 for unknown slug', () => {
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [];
    renderAt('/cluster/random-unknown');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders 404 for draft landing (contract: hidden until B.8 content)', () => {
    MOCK_CLUSTERS = [draftCluster];
    MOCK_PERSONAS = [];
    renderAt('/cluster/investment');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders the H1 for live cluster landing', () => {
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [];
    renderAt('/cluster/arrival');
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Прибытие на Пхукет' }),
    ).toBeInTheDocument();
  });

  it('renders services and jobs for live cluster landing', () => {
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [];
    renderAt('/cluster/arrival');
    expect(screen.getByText('Трансфер')).toBeInTheDocument();
    expect(screen.getByText('Заказать трансфер')).toBeInTheDocument();
  });

  it('renders the primary CTA href on live cluster landing', () => {
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [];
    renderAt('/cluster/arrival');
    const ctas = screen.getAllByRole('link', { name: 'Начать' });
    expect(ctas[0]).toHaveAttribute('href', '/start');
  });
});

describe('ClusterLandingPage — cross-link «По персонам»', () => {
  it('does NOT render the section when no related persona is live', () => {
    // relatedPersonas = ['P1','P9'], но обе draft → секция не рендерится
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [draftPersonaP9];
    renderAt('/cluster/arrival');
    expect(screen.queryByText('По персонам')).not.toBeInTheDocument();
  });

  it('renders only live related personas as links', () => {
    MOCK_CLUSTERS = [liveCluster];
    MOCK_PERSONAS = [livePersonaP1, draftPersonaP9];
    renderAt('/cluster/arrival');
    expect(screen.getByText('По персонам')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Туристы' });
    expect(link).toHaveAttribute('href', '/for/tourists');

    // P9 (draft) не должен попасть в cross-link
    expect(screen.queryByRole('link', { name: 'HNW' })).not.toBeInTheDocument();
  });

  it('does NOT include personas not in relatedPersonas, even if live', () => {
    const otherLive: PersonaLanding = { ...livePersonaP1, personaCode: 'P3', slug: 'eu-guests', h1: { ru: 'Гости', en: 'Guests' } };
    MOCK_CLUSTERS = [liveCluster]; // relatedPersonas: ['P1','P9']
    MOCK_PERSONAS = [livePersonaP1, otherLive];
    renderAt('/cluster/arrival');
    expect(screen.getByRole('link', { name: 'Туристы' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Гости' })).not.toBeInTheDocument();
  });
});
