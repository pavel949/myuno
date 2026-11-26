import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ConsumerHeader } from '../ConsumerHeader';
const state = vi.hoisted(() => ({ user: null as null | { id: string }, props: {} as Record<string, unknown> }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: ({ showCurrency = true }: {showCurrency?: boolean}) => <div data-testid="preferences" data-currency={showCurrency} /> }));
vi.mock('@/components/market/MiniCart', () => ({ MiniCart: () => null }));
vi.mock('@/components/layout/UserAvatarMenu', () => ({ UserAvatarMenu: (props: Record<string, unknown>) => { state.props = props; return <button>Account menu</button>; } }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
afterEach(() => { cleanup(); state.user = null; state.props = {}; });
it('keeps the public task navigation distinct from the signed-in account controls', () => {
 state.user = { id: 'synthetic' };
 const search = vi.fn();
 render(<MemoryRouter initialEntries={['/discover/services']}><ConsumerHeader onSearch={search} /></MemoryRouter>);
 expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
 expect(state.props).toEqual({ consumerHeader: true });
 fireEvent.click(screen.getByRole('button', {name:'Open menu'}));
 const menu = screen.getByRole('dialog', {name:'myUNO'});
 expect(within(menu).getByRole('link', { name: 'Cart' })).toHaveAttribute('href','/cart');
 expect(within(menu).getByRole('link', { name: 'Requests and bookings' })).toHaveAttribute('href','/bookings');
 expect(menu.querySelector('a[href="/discover/services"]')).toHaveAttribute('aria-current','page');
 expect(within(menu).queryByRole('link',{name:'Sign in'})).not.toBeInTheDocument();
 expect(within(menu).queryByRole('button',{name:'Account menu'})).not.toBeInTheDocument();
 fireEvent.click(within(menu).getByRole('button', {name:'Search myUNO'}));
 expect(search).toHaveBeenCalledTimes(1);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('keeps guest preferences, cart, owner path and exact sign-in return inside the Sheet', () => {
 render(<MemoryRouter initialEntries={['/bookings?tab=services#orders']}><ConsumerHeader overlay /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', {name:'Open menu'}));
 const menu = screen.getByRole('dialog', {name:'myUNO'});
 expect(within(menu).getByTestId('preferences')).toHaveAttribute('data-currency','true');
 expect(within(menu).getByRole('link',{name:'Cart'})).toHaveAttribute('href','/cart');
 expect(within(menu).getByRole('link',{name:'For owners'})).toHaveAttribute('href','/for-owners');
 expect(within(menu).getByRole('link',{name:'Sign in'})).toHaveAttribute('href','/auth?redirect=%2Fbookings%3Ftab%3Dservices%23orders');
});

it('puts tasks before preferences and groups partner paths without dropping them', () => {
 render(<MemoryRouter><ConsumerHeader onSearch={vi.fn()} /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
 const menu = screen.getByRole('dialog', {name:'myUNO'});
 expect(within(menu).getByRole('link', {name:'For a holiday'})).toHaveAttribute('href','/property/search?mode=rent&tenancy=short');
 expect(within(menu).getByRole('link', {name:'For a longer stay'})).toHaveAttribute('href','/property/search?mode=rent&tenancy=long');
 expect(within(menu).getByRole('link', {name:'For a few months'})).toHaveAttribute('href','/property/search?mode=rent&tenancy=medium');
 expect(within(menu).getByRole('link', {name:'Buy a home'})).toHaveAttribute('href','/property/buy');
 const nav = within(menu).getByRole('navigation');
 expect(nav.compareDocumentPosition(within(menu).getByTestId('preferences')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 const partners = menu.querySelector('details')!;
 expect(partners).not.toHaveAttribute('open');
 expect(partners.querySelectorAll('a')).toHaveLength(5);
 expect(within(menu).queryByText('Main destinations')).not.toBeInTheDocument();
});
it('closes the sheet before invoking the existing search', () => {
 const search=vi.fn();
 render(<MemoryRouter><ConsumerHeader onSearch={search} /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', {name:'Open menu'}));
 fireEvent.click(screen.getByRole('button', {name:'Search myUNO'}));
 expect(search).toHaveBeenCalledTimes(1);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('closes the task menu on Escape even when focus is in the partner disclosure', async () => {
 render(<MemoryRouter><ConsumerHeader /></MemoryRouter>);
 const trigger = screen.getByRole('button', { name: 'Open menu' });
 fireEvent.click(trigger);
 const menu = screen.getByRole('dialog', { name: 'myUNO' });
 const details = menu.querySelector<HTMLDetailsElement>('details')!;
 details.open = true;
 const owner = within(details).getByRole('link', {name:'For owners'});
 owner.focus();
 fireEvent.keyDown(owner, {key:'Escape'});
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 5000 });
});
it('shows a labelled trigger for shared search with its keyboard shortcuts', () => {
 const search = vi.fn();
 render(<MemoryRouter><ConsumerHeader onSearch={search} /></MemoryRouter>);
 const button = screen.getByRole('button', { name: /^Search$/ });
 expect(button).toHaveAttribute('aria-haspopup', 'dialog');
 expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K');
 fireEvent.click(button);
 expect(search).toHaveBeenCalledOnce();
});
