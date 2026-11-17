import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BottomBar } from '../BottomBar';

const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/hooks/usePrefetch', () => ({ usePrefetchRoute: () => ({ prefetchRoute: vi.fn() }) }));
vi.mock('@/lib/prefetchRoute', () => ({ prefetchRoute: vi.fn() }));
vi.mock('@/components/layout/AllAppsDrawer', () => ({ AllAppsDrawer: () => null }));
afterEach(cleanup);
beforeEach(() => { locale.language = 'en'; });

it.each([
 ['ru', 'Заявки'],
 ['en', 'Requests'],
 ['th', 'คำขอ'],
])('keeps the %s requests destination and accessible name', (language, name) => {
 locale.language = language;
 render(<MemoryRouter initialEntries={['/bookings']}><BottomBar role="guest" /></MemoryRouter>);
 const requests = screen.getByRole('link', { name });
 expect(requests).toHaveAttribute('href', '/me/requests');
 expect(requests).toHaveAttribute('aria-current', 'page');
 expect(requests.querySelector('span')).toHaveTextContent(name);
 expect(screen.getAllByRole('link')).toHaveLength(5);
});

it.each([
 ['/property/search', 'Search'],
 ['/property/example', 'Search'],
 ['/transport/transfer', 'Search'],
 ['/discover/services', 'Search'],
 ['/trip-planner', 'Search'],
 ['/bookings', 'Requests'],
 ['/me/requests', 'Requests'],
 ['/my-stay', 'Requests'],
 ['/favorites', 'Favorites'],
 ['/search', 'Search'],
 ['/profile', 'Profile'],
 ['/', 'Home'],
])('announces the same active tab it highlights on %s', (path, label) => {
 render(<MemoryRouter initialEntries={[path]}><BottomBar {...{ role: 'guest' as const }} /></MemoryRouter>);
 expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
 expect(screen.getAllByRole('link').filter(link => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
});

it('does not announce an unrelated active tab on business pages', () => {
 render(<MemoryRouter initialEntries={['/for-business']}><BottomBar {...{ role: 'guest' as const }} /></MemoryRouter>);
 expect(screen.getAllByRole('link').filter(link => link.hasAttribute('aria-current'))).toHaveLength(0);
});
