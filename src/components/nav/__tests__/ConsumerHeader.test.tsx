import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConsumerHeader } from '../ConsumerHeader';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
const locale = vi.hoisted(() => ({ language: 'ru' }));
const prefetch = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prefetchRoute', () => ({ prefetchRoute: prefetch }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => null }));
vi.mock('@/components/market/MiniCart', () => ({ MiniCart: () => null }));
vi.mock('@/components/layout/UserAvatarMenu', () => ({ UserAvatarMenu: () => null }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
afterEach(() => { cleanup(); locale.language = 'ru'; prefetch.mockClear(); });
it.each([
 ['/experiences', 'Впечатления', 'Впечатления'],
 ['/experiences/synthetic-tour', 'Впечатления', 'Впечатления'],
 ['/transport/transfer', 'Сервисы', 'Сервисы'],
 ['/property/search?mode=buy', 'Покупка', 'Купить жильё'],
 ['/property/search?mode=rent', 'Аренда', 'Жильё'],
])('identifies one destination in desktop and mobile menus for %s', (path, desktopLabel, mobileLabel) => {
 render(<MemoryRouter initialEntries={[path]}><ConsumerHeader /></MemoryRouter>);
 const desktop = screen.getByRole('navigation', { name: 'Основные разделы' });
 expect(desktop.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
 expect(within(desktop).getByRole('link', { name: desktopLabel })).toHaveAttribute('aria-current', 'page');
 fireEvent.click(screen.getByRole('button', { name: 'Открыть меню' }));
 const mobile = screen.getByRole('dialog');
 expect(mobile.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
 expect(within(mobile).getByRole('link', { name: mobileLabel })).toHaveAttribute('aria-current', 'page');
});
it('provides a named modal menu with direct destinations, sign-in and Escape handling', async () => {
 render(<MemoryRouter><ConsumerHeader /></MemoryRouter>);
 const trigger = screen.getByRole('button', { name: 'Открыть меню' });
 fireEvent.click(trigger);
 const dialog = screen.getByRole('dialog', { name: 'myUNO' });
 expect(within(dialog).getByRole('link', { name: 'Сервисы' })).toHaveAttribute('href', '/discover/services');
 expect(within(dialog).getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/auth');
 expect(within(dialog).getByRole('button', { name: 'Закрыть меню' })).toBeInTheDocument();
 fireEvent.keyDown(dialog, { key: 'Escape' });
 await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('preserves the current page, filters and anchor in both sign-in links', () => {
 const from = '/property/search?mode=rent&area=rawai#results';
 render(<MemoryRouter initialEntries={[from]}><ConsumerHeader /></MemoryRouter>);
 expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', `/auth?redirect=${encodeURIComponent(from)}`);
 fireEvent.click(screen.getByRole('button', { name: 'Открыть меню' }));
 const dialog = screen.getByRole('dialog', { name: 'myUNO' });
 expect(within(dialog).getByRole('link', { name: 'Войти' })).toHaveAttribute('href', `/auth?redirect=${encodeURIComponent(from)}`);
 expect(within(dialog).getByRole('link', { name: 'Жильё' })).toHaveAttribute('aria-current', 'page');
 expect(within(dialog).getByRole('link', { name: 'Сервисы' })).not.toHaveAttribute('aria-current');
});

it.each([
 ['en', 'Open menu', 'Services', 'Sign in'],
 ['th', 'เปิดเมนู', 'บริการ', 'เข้าสู่ระบบ'],
])('keeps the active mobile destination and return link localized in %s', (language, menu, services, signIn) => {
 locale.language = language;
 render(<MemoryRouter initialEntries={['/transport/transfer']}><ConsumerHeader /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: menu }));
 const dialog = screen.getByRole('dialog', { name: 'myUNO' });
 expect(within(dialog).getByRole('link', { name: services })).toHaveAttribute('aria-current', 'page');
 expect(within(dialog).getByRole('link', { name: signIn })).toHaveAttribute('href', '/auth?redirect=%2Ftransport%2Ftransfer');
});

it('warms only the destination indicated by pointer or keyboard intent', () => {
 render(<MemoryRouter><ConsumerHeader /></MemoryRouter>);
 const nav = screen.getByRole('navigation', { name: 'Основные разделы' });
 expect(prefetch).not.toHaveBeenCalled();
 fireEvent.pointerEnter(within(nav).getByRole('link', { name: 'Покупка' }));
 expect(prefetch.mock.calls).toEqual([['/property/buy']]);
 fireEvent.focus(within(nav).getByRole('link', { name: 'Сервисы' }));
 expect(prefetch.mock.calls).toEqual([['/property/buy'], ['/discover/services']]);
});
