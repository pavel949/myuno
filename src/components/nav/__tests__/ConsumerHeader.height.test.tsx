import { readFileSync } from 'node:fs';
import { act, cleanup, render, fireEvent, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConsumerHeader } from '../ConsumerHeader';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => <button>Preferences</button> }));
vi.mock('@/components/layout/UserAvatarMenu', () => ({ UserAvatarMenu: () => <button>Account</button> }));
vi.mock('@/components/market/MiniCart', () => ({ MiniCart: () => <button>Cart</button> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

// ResizeObserver supplies geometry; JSDOM does not lay out text. Exercise the
// real header's propagation and cleanup rather than pretending to measure fonts.
it.each([320, 360, 390])('updates shared sticky offsets when header height changes at %ipx', width => {
 let height = 72;
 let resized: () => void = () => {};
 const disconnect = vi.fn();
 const observe = vi.fn();
 vi.stubGlobal('ResizeObserver', class {
  constructor(callback: () => void) { resized = callback; }
  observe = observe;
  disconnect = disconnect;
 });
 vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
  height, width, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0, toJSON: () => ({}),
 }));
 const view = render(<MemoryRouter><div data-canvas="consumer" style={{ '--consumer-header-height': '72px' } as React.CSSProperties}>
  <ConsumerHeader /><div data-testid="sticky" style={{ position: 'sticky', top: 'var(--consumer-header-height,0px)' }} />
 </div></MemoryRouter>);
 const canvas = view.container.querySelector<HTMLElement>('[data-canvas]')!;
 expect(observe).toHaveBeenCalledWith(view.container.querySelector('header'));
 expect(canvas.style.getPropertyValue('--consumer-header-height')).toBe('72px');
 height = 112.25;
 act(() => resized());
 expect(canvas.style.getPropertyValue('--consumer-header-height')).toBe('113px');
 height = 80;
 act(() => window.dispatchEvent(new Event('resize')));
 expect(canvas.style.getPropertyValue('--consumer-header-height')).toBe('80px');
 view.unmount();
 expect(disconnect).toHaveBeenCalledOnce();
 expect(canvas.style.getPropertyValue('--consumer-header-height')).toBe('72px');
});

it('keeps property search and account tabs on the same shared height variable', () => {
 for (const path of ['src/pages/property/PropertyIndex.tsx', 'src/components/layout/MeShellLayout.tsx']) {
  expect(readFileSync(path, 'utf8')).toContain('sticky top-[var(--consumer-header-height,0px)]');
 }
});

it.each([false, true])('scopes canonical portal gutters only to non-overlay menu (overlay=%s)', overlay => {
 render(<MemoryRouter><ConsumerHeader overlay={overlay} /></MemoryRouter>);
 fireEvent.click(screen.getByRole('button', { name: /^Open menu$/ }));
 const menu = screen.getByRole('dialog');
 if (overlay) expect(menu).not.toHaveClass('consumer-header-menu');
 else expect(menu).toHaveClass('consumer-header-menu');
});

it.each([
 ['/discover/services', 'var(--layout-width-catalogue)'], ['/property/search', 'var(--layout-width-catalogue)'], ['/for-business', 'var(--layout-width-workspace)'],
 ['/become-partner', ''], ['/property/one', 'var(--layout-width-catalogue)'], ['/area/bang-tao', 'var(--layout-width-catalogue)'], ['/support', ''],
])('aligns header to the explicit page frame at %s while keeping form frames bounded', (route, expected) => {
 const view = render(<MemoryRouter initialEntries={[route]}><ConsumerHeader /></MemoryRouter>);
 expect((view.container.querySelector('.consumer-header-inner') as HTMLElement).style.maxWidth).toBe(expected);
});

it('retains the homepage overlay width regardless of route frame', () => {
 const view = render(<MemoryRouter initialEntries={['/property/search']}><ConsumerHeader overlay /></MemoryRouter>);
 const inner = view.container.querySelector('.consumer-header-inner') as HTMLElement;
 expect(inner.style.maxWidth).toBe('');
 expect(inner).toHaveAttribute('data-public-frame', 'overlay');
});
