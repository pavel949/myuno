import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminLayout } from '../AdminLayout';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' } }) }));
vi.mock('@/hooks/useUserContext', () => ({ useUserContext: () => ({ activeRole: 'admin' }) }));
vi.mock('@/hooks/useOwnerType', () => ({ useOwnerType: () => ({ isMCPortal: false }) }));
vi.mock('@/hooks/useUserTracking', () => ({ useUserTracking: () => {} }));
vi.mock('@/hooks/usePlatformAnalytics', () => ({ usePlatformAnalytics: () => {} }));
vi.mock('@/hooks/useGlobalSearch', () => ({ useGlobalSearch: () => ({ results: [], isLoading: false, aiAnswer: null, aiLoading: false }) }));
vi.mock('@/components/nav/SideRail', () => ({ SideRail: () => null }));
vi.mock('@/components/nav/BottomBar', () => ({ BottomBar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/layout/UserAvatarMenu', () => ({ UserAvatarMenu: () => <button>Account fixture</button> }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/market/MiniCart', () => ({ MiniCart: () => null }));
vi.mock('@/components/nav/ConsumerHeader', () => ({ ConsumerHeader: () => null }));
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);

it.each(['ctrlKey', 'metaKey'] as const)('AdminLayout exclusively opens one command dialog with %s+K and restores focus on Escape', async modifier => {
  render(<MemoryRouter initialEntries={['/admin']}><AdminLayout><label htmlFor="fixture-queue-search">Queue search<input id="fixture-queue-search" aria-label="Queue search" /></label></AdminLayout></MemoryRouter>);
  const origin = screen.getByRole('textbox', {name: 'Queue search'});
  origin.focus();
  fireEvent.keyDown(origin, {key: 'k', [modifier]: true});
  const dialog = await screen.findByRole('dialog', {name: 'Command Menu'});
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.queryByRole('dialog', {name: 'Search'})).not.toBeInTheDocument();
  await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  fireEvent.keyDown(document.activeElement!, {key: 'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(origin).toHaveFocus());
});

it('keeps the global search header action and never stacks the command palette over it', async () => {
  render(<MemoryRouter initialEntries={['/admin']}><AdminLayout><div>Today fixture</div></AdminLayout></MemoryRouter>);
  const opener = screen.getByRole('button', {name: /^Search$/});
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole('dialog', {name: 'Search'});
  fireEvent.keyDown(dialog, {key: 'k', ctrlKey: true});
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(screen.queryByRole('dialog', {name: 'Command Menu'})).not.toBeInTheDocument();
  fireEvent.keyDown(dialog, {key: 'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(opener).toHaveFocus());
});
