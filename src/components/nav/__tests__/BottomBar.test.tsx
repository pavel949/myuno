import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BottomBar } from '../BottomBar';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/usePrefetch', () => ({ usePrefetchRoute: () => ({ prefetchRoute: vi.fn() }) }));
vi.mock('@/lib/prefetchRoute', () => ({ prefetchRoute: vi.fn() }));
vi.mock('@/components/layout/AllAppsDrawer', () => ({ AllAppsDrawer: () => null }));
afterEach(cleanup);

it.each([
 ['/property/search', 'Homes'],
 ['/property/example', 'Homes'],
 ['/transport/transfer', 'Services'],
 ['/discover/services', 'Services'],
 ['/trip-planner', 'Your trip'],
 ['/profile', 'Me'],
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
