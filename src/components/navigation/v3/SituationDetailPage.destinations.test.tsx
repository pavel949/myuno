import { render, screen } from '@testing-library/react';
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SituationDetailPage from './SituationDetailPage';
import { resolveCatalogServiceDestination } from '@/lib/catalog/serviceLookup';
import type { ReactNode } from 'react';
const fixture = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useLifeOS', () => ({
  useLifeSituations: () => ({ data: [{ id: 'synthetic-arrival', code: 'arrival', title_en: 'Arrival', title_ru: 'Приезд', is_active: true }] }),
  useResolveLifeOSContext: () => ({ data: fixture.items }),
}));
vi.mock('@/hooks/useUserPersonas', () => ({ useUserPersonas: () => ({ effectivePersonas: [] }) }));
vi.mock('@/hooks/useSituationServiceCounts', () => ({ useSituationServiceCounts: () => ({ data: {} }) }));
vi.mock('./useSituationTracking', () => ({ useSituationTracking: () => ({ containerRef: { current: null }, onSituationClick: vi.fn() }) }));
function lifeId(slug: string) {
  const h = createHash('md5').update(`service:${slug}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
it('renders genuine seeded LifeOS transfer and yacht links while unknown services remain unavailable', () => {
  fixture.items = ['transfer', 'yacht', 'unknown-service'].map(slug => ({ entity_type: 'service', entity_id: lifeId(slug), title: slug, title_localized: slug, price: null }));
  render(<MemoryRouter initialEntries={['/discover/arrival']}><Routes><Route path="/discover/:code" element={<SituationDetailPage />} /></Routes></MemoryRouter>);
  for (const slug of ['transfer', 'yacht']) {
    const destination = resolveCatalogServiceDestination(slug);
    expect(destination.status).toBe('resolved');
    if (destination.status === 'resolved') expect(screen.getByRole('link', { name: new RegExp(slug) })).toHaveAttribute('href', destination.href);
  }
  expect(screen.queryByRole('link', { name: /unknown-service/ })).not.toBeInTheDocument();
  expect(screen.getByText('This offering is not available to open yet.')).toBeVisible();
});
