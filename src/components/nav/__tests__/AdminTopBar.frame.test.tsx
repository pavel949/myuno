import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from '../TopBar';
import { ECOSYSTEM_HEADER_INNER } from '@/design-system/ecosystemLayout';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
vi.mock('@/hooks/useScrollBehavior', () => ({ useScrolled: () => false }));
vi.mock('@/hooks/useGlobalSearch', () => ({ useGlobalSearch: () => ({ results: [], isLoading: false, aiAnswer: null, aiLoading: false }) }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/layout/UserAvatarMenu', () => ({ UserAvatarMenu: () => <button>Fixture avatar</button> }));
vi.mock('@/components/market/MiniCart', () => ({ MiniCart: () => null }));
vi.mock('@/components/nav/ConsumerHeader', () => ({ ConsumerHeader: () => <div data-testid="consumer-header-boundary" /> }));
vi.mock('@/components/nav/Breadcrumbs', () => ({ Breadcrumbs: () => <span>Fixture crumbs</span> }));
vi.mock('@/components/ui/sidebar', () => ({ SidebarTrigger: () => <button>Fixture sidebar trigger</button> }));
afterEach(cleanup);

it('uses the available admin work area and its PageShell gutter without widening other workspaces', () => {
  const admin = render(<MemoryRouter initialEntries={['/admin/properties']}><TopBar role="admin" /></MemoryRouter>);
  const adminFrames = admin.container.querySelectorAll('header > div > div, header > div:first-child');
  const primary = admin.container.querySelector('header > div:first-child')!;
  expect(primary).toHaveClass('max-w-none', 'px-[var(--page-padding-x)]');
  expect(primary).not.toHaveClass('max-w-[1280px]');
  expect([...adminFrames].some(node => node.classList.contains('max-w-none'))).toBe(true);
  admin.unmount();
  const owner = render(<MemoryRouter initialEntries={['/mc']}><TopBar role="owner" /></MemoryRouter>);
  const ownerFrame = owner.container.querySelector('header > div:first-child')!;
  for (const token of ECOSYSTEM_HEADER_INNER.split(/\s+/)) expect(ownerFrame).toHaveClass(token);
  expect(ownerFrame).not.toHaveClass('max-w-none');
});

it('returns keyboard focus to the actual search opener after Escape', async () => {
  render(<MemoryRouter initialEntries={['/admin']}><TopBar role="admin" /></MemoryRouter>);
  const opener = screen.getByRole('button', { name: /^Search$/ });
  // JSDOM click does not perform the browser's native focus-on-click step.
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole('dialog', { name: 'Search' });
  await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(opener).toHaveFocus());
});
