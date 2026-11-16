import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import PersonaDirectoryPage from '../PersonaDirectoryPage';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import { isLivePersonaLanding } from '@/lib/landings/types';

const fixture = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => fixture }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/landings', () => ({ LandingContainer: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
afterEach(cleanup);

const published = PERSONA_LANDINGS.filter(isLivePersonaLanding);

describe.each(['en', 'ru'])('%s role directory', language => {
 it('derives its visible page count from the canonical published entries and lists each once', () => {
  fixture.language = language;
  const { container } = render(<HelmetProvider><MemoryRouter><PersonaDirectoryPage /></MemoryRouter></HelmetProvider>);
  const introduction = screen.getByRole('heading', { level: 1 }).parentElement!;
  expect(introduction).toHaveTextContent(`${published.length} ${language === 'ru' ? 'страниц' : 'pages'}`);
  for (const landing of published) {
   const links = container.querySelectorAll(`a[href="/for/${landing.slug}"]`);
   expect(links, landing.slug).toHaveLength(1);
   expect(links[0]).toHaveAccessibleName();
  }
 });

 it.each([
  ['cn-investors', 'Invest', 'Инвестировать'],
  ['mn-investors', 'Invest', 'Инвестировать'],
  ['relocator-family', 'Live & settle in', 'Жить и обустроиться'],
  ['relocator-solo', 'Live & settle in', 'Жить и обустроиться'],
  ['returnee', 'Live & settle in', 'Жить и обустроиться'],
  ['employee-expat', 'Live & settle in', 'Жить и обустроиться'],
  ['property-owner', 'Property owners', 'Собственники недвижимости'],
  ['long-stay', 'Guests & travellers', 'Гости и путешественники'],
 ])('places %s under its role or situation rather than a generic fallback', (slug, en, ru) => {
  fixture.language = language;
  const { container } = render(<HelmetProvider><MemoryRouter><PersonaDirectoryPage /></MemoryRouter></HelmetProvider>);
  const link = container.querySelector(`a[href="/for/${slug}"]`)!;
  expect(link).not.toBeNull();
  expect(link.closest('section')?.querySelector('h2')).toHaveTextContent(language === 'ru' ? ru : en);
 });
});

it.each(['ru', 'en'])('shows honest %s owner terms in the actual directory card', language => {
 fixture.language = language;
 const { container } = render(<HelmetProvider><MemoryRouter><PersonaDirectoryPage /></MemoryRouter></HelmetProvider>);
 const owner = container.querySelector('a[href="/for/property-owner"]')!;
 expect(owner).not.toHaveTextContent('$25');
 expect(owner).toHaveTextContent(language === 'ru' ? 'согласуются индивидуально' : 'agreed individually');
});
