import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
it('uses only the existing account menu for authenticated consumer navigation', () => {
 state.user = { id: 'synthetic' };
 const search = vi.fn();
 render(<MemoryRouter initialEntries={['/discover/services']}><ConsumerHeader onSearch={search} /></MemoryRouter>);
 expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
 expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
 const links = state.props.consumerNavigation as {to:string; active?:boolean}[];
 expect(links).toEqual(expect.arrayContaining([expect.objectContaining({to:'/discover/services',active:true}), expect.objectContaining({to:'/cart'}), expect.objectContaining({to:'/for-owners'})]));
 expect(state.props.consumerSearch).toBe(search);
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
 expect(within(menu).getByRole('link', {name:'Buy a home'})).toHaveAttribute('href','/property/search?mode=buy');
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
