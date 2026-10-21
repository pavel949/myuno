import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AREA_LANDINGS } from '@/content/landings/areaLandings';
import type { PersonaLanding } from '@/lib/landings/types';
import PersonaAreaLandingPage from '../PersonaAreaLandingPage';
import LandingSeoHead from '@/components/seo/LandingSeoHead';
const state = vi.hoisted(() => ({ persona: null as unknown as PersonaLanding, area: null as unknown }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/components/landings', () => ({ LandingContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/landings/LandingLeadForm', () => ({ LandingLeadForm: () => null }));
vi.mock('@/content/landings/personaAreaOverrides', () => ({ findPersonaAreaOverride: () => null }));
vi.mock('@/content/landings/personaAreaLandings', () => ({ findPersonaAreaLanding: () => ({ persona: state.persona, area: state.area }) }));
vi.mock('react-helmet-async', () => ({ Helmet: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
afterEach(cleanup);
beforeEach(() => {
 state.area = AREA_LANDINGS[0];
 state.persona = {
  personaCode: 'P1', slug: 'tourists', status: 'live', h1: { ru: 'Test', en: 'Test' }, subtitle: { ru: 'Test', en: 'Test' }, pains: [], faq: [],
  services: [
   { slug: 'verified', label: { ru: 'Verified', en: 'Verified service' }, href: '/property/search?mode=rent&returnTo=%2Fme#results', oneLiner: { ru: 'Safe', en: 'Verified description' } },
   { slug: 'unavailable', label: { ru: 'Unavailable', en: 'Unavailable service' }, href: '/property/mortgage', availability: 'unavailable', oneLiner: { ru: 'Claim', en: 'Unverified fulfilment claim' } },
   { slug: 'entity', label: { ru: 'Entity', en: 'Unverified entity' }, href: '/knowledge/pillars/unknown', availability: 'entity-unverified', oneLiner: { ru: 'Claim', en: 'Unverified entity claim' } },
  ], primaryCta: { label: { ru: 'Start', en: 'Start unavailable' }, href: '/property/urgent?source=test#anchor', availability: 'unavailable' },
  seo: { metaTitle: { ru: 'Test', en: 'Test' }, metaDescription: { ru: 'Test', en: 'Test' }, ogImage: '/test.png', canonicalPath: '/for/tourists', hreflangAlternates: [] },
 };
});
function mount() { return render(<MemoryRouter initialEntries={['/for/tourists/in/rawai']}><Routes><Route path="/for/:persona/in/:area" element={<PersonaAreaLandingPage />} /></Routes></MemoryRouter>); }
describe('persona area reviewed link containment', () => {
 it('contains every unavailable service and repeated primary CTA while retaining verified context', () => {
  const { container } = mount();
  expect(screen.getAllByRole('link', { name: /Start unavailable/ })).toHaveLength(2);
  for (const link of screen.getAllByRole('link', { name: /Start unavailable|Unavailable service|Unverified entity/ })) {
   expect(link).toHaveAttribute('aria-disabled', 'true'); expect(link).not.toHaveAttribute('href');
  }
  expect(container.querySelectorAll('a[href*="mortgage"],a[href*="urgent"],a[href*="pillars/unknown"]')).toHaveLength(0);
  expect(screen.queryByText('Unverified fulfilment claim')).toBeNull(); expect(screen.queryByText('Unverified entity claim')).toBeNull();
  const href = screen.getByRole('link', { name: /Verified service/ }).getAttribute('href')!;
  const url = new URL(href, 'https://www.myuno.app');
  expect(url.searchParams.get('area')).toBe(AREA_LANDINGS[0].area.slug); expect(url.searchParams.get('persona')).toBe('tourists');
  expect(url.searchParams.get('mode')).toBe('rent'); expect(url.searchParams.get('returnTo')).toBe('/me'); expect(url.hash).toBe('#results');
 });
 it('preserves primary CTA query and hash in both hero and sticky positions', () => {
  state.persona.primaryCta = { label: { ru: 'Go', en: 'Verified start' }, href: '/property/search?persona=existing&returnTo=%2Fme#calendar' };
  mount();
  for (const link of screen.getAllByRole('link', { name: /Verified start/ })) {
   const url = new URL(link.getAttribute('href')!, 'https://www.myuno.app');
   expect(url.searchParams.get('area')).toBe(AREA_LANDINGS[0].area.slug); expect(url.searchParams.get('persona')).toBe('existing'); expect(url.searchParams.get('returnTo')).toBe('/me'); expect(url.hash).toBe('#calendar');
  }
 });
 it('excludes reviewed service URLs and descriptions from structured-data offers', () => {
  const { container } = render(<LandingSeoHead landing={state.persona} type="persona" language="en" origin="https://www.myuno.app" />);
  const schemas = [...container.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent!));
  const service = schemas.find(schema => schema['@type'] === 'Service');
  expect(service.hasOfferCatalog.itemListElement).toHaveLength(1);
  expect(service.hasOfferCatalog.itemListElement[0].name).toBe('Verified service');
  expect(JSON.stringify(service)).not.toMatch(/mortgage|pillars\/unknown|Unverified fulfilment claim|Unverified entity claim/);
 });
});
