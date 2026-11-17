import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import ArriveSurfaceLandingPage from '../ArriveSurfaceLandingPage';
import LiveSurfaceLandingPage from '../LiveSurfaceLandingPage';
import ManageSurfaceLandingPage from '../ManageSurfaceLandingPage';
import InvestSurfaceLandingPage from '../InvestSurfaceLandingPage';
import LegalSurfaceLandingPage from '../LegalSurfaceLandingPage';
import BuildSurfaceLandingPage from '../BuildSurfaceLandingPage';
import { buildSurfaceSeo } from '@/lib/landings/surfaceLandingSeo';

const fixture = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => fixture }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
// Keep actual pages, copy and router behavior; isolate only application chrome.
vi.mock('@/components/miniapp/LandingLayout', () => ({
 LandingLayout: ({ title, heroCta, children }: { title: string; heroCta: { label: string; onClick: () => void }; children: ReactNode }) =>
  <main><h1>{title}</h1><button onClick={heroCta.onClick}>{heroCta.label}</button>{children}</main>,
}));
afterEach(cleanup);

function CurrentRoute() {
 const location = useLocation();
 return <output data-testid="current-route">{location.pathname + location.search}</output>;
}

describe.each(['en', 'ru'] as const)('%s scenario landing journeys', language => {
 it('labels the arrival action for the area guide it actually opens', () => {
  fixture.language = language;
  render(<MemoryRouter initialEntries={['/for/arrive']}><ArriveSurfaceLandingPage /><CurrentRoute /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: language === 'ru' ? 'Посмотреть районы' : 'Explore the area guide' }));
  expect(screen.getByTestId('current-route')).toHaveTextContent('/guide/areas');
 });

 it.each([
  ['live', LiveSurfaceLandingPage],
  ['manage', ManageSurfaceLandingPage],
  ['invest', InvestSurfaceLandingPage],
  ['arrive', ArriveSurfaceLandingPage],
  ['legal', LegalSurfaceLandingPage],
  ['build', BuildSurfaceLandingPage],
 ] as const)('keeps the %s introduction separate from a quoted price or promised return', (_name, Page) => {
  fixture.language = language;
  const { container } = render(<MemoryRouter><Page /></MemoryRouter>);
  expect(screen.getByText(language === 'ru' ? 'Индивидуальные условия' : 'Individual terms')).toBeVisible();
  expect(container.textContent).not.toMatch(/[$฿]\s*\d|(?:6[–-]9|10[–-]15|3[–-]5)%/);
  expect(container.textContent).not.toContain(language === 'ru' ? 'WorldCheck для российских паспортов' : 'WorldCheck applied for Russian passport holders');
 });

 it('links the Live introduction to the everyday services section', () => {
  fixture.language = language;
  render(<MemoryRouter><LiveSurfaceLandingPage /></MemoryRouter>);
  expect(screen.getByRole('link', { name: language === 'ru' ? 'Услуги для жизни на Пхукете' : 'Services for everyday life in Phuket' }))
   .toHaveAttribute('href', '/live');
 });

 it('does not repeat a fixed investment yield in metadata or structured data', () => {
  const seo = buildSurfaceSeo('invest', language);
  expect(JSON.stringify(seo)).not.toMatch(/6[–-]9%|\$2M/);
  expect(seo.description).toContain(language === 'ru' ? 'риски' : 'risks');
 });
});
