/**
 * Tests for PersonaLandingPage routing logic (M6 · Track B.4).
 *
 * Контракт B.4:
 *  - Неизвестный slug → 404.
 *  - Известный, но `draft` → 404 (контент придёт в B.7, до тех пор скрыт).
 *  - Известный + `live` → рендер страницы (h1 видимый).
 *
 * Тестируем через MemoryRouter, чтобы покрыть оба пути без сети.
 * Live-кейс собираем in-test (PERSONA_LANDINGS на B.4 пока все draft —
 * это ожидаемо), чтобы проверить позитивную ветку рендера.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import type { PersonaLanding } from '@/lib/landings/types';

// Минимальные моки контекстов / heavy components, чтобы изолировать роут.
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

// Управляемый список лендингов для конкретного теста.
let MOCK_LANDINGS: PersonaLanding[] = [];
vi.mock('@/content/landings/personaLandings', () => ({
  get PERSONA_LANDINGS() {
    return MOCK_LANDINGS;
  },
  LIVE_PERSONA_SLUGS: [],
}));

import PersonaLandingPage from '../PersonaLandingPage';

const renderAt = (path: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/for/:persona" element={<PersonaLandingPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

const liveLanding: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: { ru: 'Привет, турист', en: 'Hello tourist' },
  subtitle: { ru: 'Подзаголовок', en: 'Subtitle' },
  pains: [{ ru: 'боль 1', en: 'pain 1' }],
  services: [
    { slug: 'sim', label: { ru: 'SIM', en: 'SIM' }, href: '/sim' },
  ],
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

const draftLanding: PersonaLanding = {
  personaCode: 'P9',
  slug: 'hnw',
  status: 'draft',
  h1: { ru: 'HNW', en: 'HNW' },
  subtitle: { ru: 'sub', en: 'sub' },
  pains: [],
  services: [],
  faq: [],
  primaryCta: { label: { ru: 'На главную', en: 'Go home' }, href: '/' },
};

describe('PersonaLandingPage — B.4 routing', () => {
  it('renders 404 for unknown slug', () => {
    MOCK_LANDINGS = [liveLanding];
    renderAt('/for/random-unknown');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders 404 for draft landing (contract: hidden until B.7 content)', () => {
    MOCK_LANDINGS = [draftLanding];
    renderAt('/for/hnw');
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  it('renders the page H1 for live landing', () => {
    MOCK_LANDINGS = [liveLanding];
    renderAt('/for/tourists');
    expect(screen.queryByTestId('not-found')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Привет, турист' }),
    ).toBeInTheDocument();
  });

  it('renders services and FAQ for live landing', () => {
    MOCK_LANDINGS = [liveLanding];
    renderAt('/for/tourists');
    expect(screen.getByText('SIM')).toBeInTheDocument();
    expect(screen.getByText('боль 1')).toBeInTheDocument();
  });

  it('renders the primary CTA href on live landing', () => {
    MOCK_LANDINGS = [liveLanding];
    renderAt('/for/tourists');
    const ctas = screen.getAllByRole('link', { name: 'Начать' });
    expect(ctas.length).toBeGreaterThanOrEqual(1);
    expect(ctas[0].getAttribute('href')).toMatch(/^\/start(\?|$)/);
  });
});
