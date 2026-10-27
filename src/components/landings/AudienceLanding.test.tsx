import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import ForOwners from '@/pages/ForOwners';
import ForDevelopers from '@/pages/ForDevelopers';
import AgentLanding from '@/pages/landings/AgentLandingPage';
import Partners from '@/pages/info/PartnersPage';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({children, usePageContainer}: {children: ReactNode; usePageContainer?: boolean}) => <main data-auto-frame={String(usePageContainer)}>{children}</main> }));
vi.mock('@/components/seo', () => ({ SEOHead: () => null }));
afterEach(cleanup);
const entries = [
 {path:'/for-owners', Page:ForOwners, primary:'#paths', secondary:'/my-property', next:'/mc/onboarding'},
 {path:'/for-developers', Page:ForDevelopers, primary:'/developer-portal/apply', secondary:'/developer-portal', next:'/developer-portal/projects'},
 {path:'/for/agent', Page:AgentLanding, primary:'/become-partner', secondary:'/partner/status', next:'/property/search'},
 {path:'/partners', Page:Partners, primary:'/vendor/onboarding', secondary:'/partner/status', next:'/for-developers'},
];
describe('public audience introductions', () => {
 it.each(entries)('preserves canonical next steps and avoids nonexistent agent routes on $path', ({path,Page,primary,secondary,next}) => {
  state.language='en';const {container}=render(<MemoryRouter initialEntries={[path]}><Page/></MemoryRouter>);
  expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);
  expect(container.querySelector('main')).toHaveAttribute('data-auto-frame','false');
  expect(container.querySelector('#paths')).toHaveAttribute('tabindex', '-1');
  expect(container.querySelector('.audience-primary')?.getAttribute('href')).toBe(primary);
  const links=screen.getAllByRole('link').map(a=>a.getAttribute('href'));expect(links).toContain(secondary);expect(links).toContain(next);
  expect(links.some(href=>href?.startsWith('/agent/'))).toBe(false);
  expect(container.textContent).not.toMatch(/500\+|50K\+|\$10,000|48 hours|70\s*\/\s*30|50\/50|\$199|\$399|\$25/);
 });
 it.each(['ru','en','th'])('renders real %s content without creating another header or role selector', language => {
  state.language=language;const {container}=render(<MemoryRouter><ForDevelopers/></MemoryRouter>);
  const heading=screen.getByRole('heading',{level:1});if(language==='th')expect(heading.textContent).toMatch(/[ก-๙]/);
  expect(container.querySelectorAll('header')).toHaveLength(1);expect(container.querySelectorAll('select')).toHaveLength(0);
 });
});
