import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ForLocalServices from '../ForLocalServices';
import ForDevelopers from '../ForDevelopers';
import ForManagementCompanies from '../ForManagementCompanies';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { APP_ROUTES } from '@/lib/config/routes';

const fixture = vi.hoisted(() => ({ language: 'en', navigate: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => fixture }));
vi.mock('react-router-dom', async () => ({ ...await vi.importActual<typeof import('react-router-dom')>('react-router-dom'), useNavigate: () => fixture.navigate }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
vi.mock('react-helmet-async', () => ({ Helmet: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/landings', () => ({
 LandingChrome: () => null,
 LandingContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 LandingSection: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

// DOM/class and navigation contract, not a rendered text-width assertion.
// At sm (640px), the CTA row must allow whole buttons to move to another line.
it.each(['ru', 'en'])('lets the %s provider CTA row wrap without losing any destination', language => {
 fixture.language = language;
 render(<ForLocalServices />);
 const heading = screen.getByRole('heading', { level: 1 });
 const hero = heading.parentElement!;
 const buttons = [...hero.querySelectorAll('button')];
 expect(buttons).toHaveLength(3);
 const row = buttons[0].parentElement!;
 expect(row).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:flex-wrap');
 expect(row).not.toHaveClass('sm:flex-nowrap', 'overflow-hidden');
 for (const [index, path] of [APP_ROUTES.VENDOR_JOIN, APP_ROUTES.FOR_BUSINESS, APP_ROUTES.BECOME_PARTNER].entries()) {
  expect(buttons[index]).toHaveAccessibleName();
  fireEvent.click(buttons[index]);
  expect(fixture.navigate).toHaveBeenLastCalledWith(path);
 }
});

it.each(['ru', 'en'])('allows the full %s developer CTA label to wrap and preserves its action', language => {
 fixture.language = language;
 render(<MemoryRouter><ForDevelopers /></MemoryRouter>);
 const label = language === 'ru' ? 'Представить компанию' : 'Introduce your company';
 const action = screen.getByRole('link', { name: label });
 expect(action).toHaveAttribute('href', APP_ROUTES.DEVELOPER_PORTAL_APPLY);
 expect(action).toHaveTextContent(label);
 expect(action.querySelector('button')).toBeNull();
 // Layout ownership moved into AudienceLanding; preserve wrapping and minimum
 // target geometry through its shared stylesheet rather than old button classes.
 const css = readFileSync('src/styles/premium-audience.css', 'utf8');
 expect(css).toContain('.audience-actions { display: flex; flex-wrap: wrap;');
 expect(css).toMatch(/\.audience-actions a[^}]+min-height: 2\.75rem/);
 expect(action).not.toHaveClass('whitespace-nowrap', 'h-12');

});

it.each([ForLocalServices, ForDevelopers, ForManagementCompanies])('keeps every marketing action inside its available width with flexible height', Page => {
 fixture.language = 'en';
 render(<MemoryRouter><Page /></MemoryRouter>);
 const actions = screen.getAllByRole(Page === ForDevelopers ? 'link' : 'button');
 for (const action of actions) {
  if (Page === ForDevelopers) {
   expect(action).toHaveAccessibleName();
   expect(action).not.toHaveClass('whitespace-nowrap', 'h-12');
   continue;
  }
  expect(action).toHaveClass('max-w-full', 'whitespace-normal', 'h-auto');
  expect(action).not.toHaveClass('whitespace-nowrap', 'h-12');
 }
});
