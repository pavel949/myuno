// Social persistence is verified separately; these tests retain synthetic public catalogue boundaries.
vi.mock('@/hooks/useFeatureFlag', () => ({ useFeatureFlag: () => false }));
vi.mock('@/hooks/usePlatformSocialLinks', () => ({ usePlatformSocialLinks: () => ({ data: state.social }) }));
import React from 'react';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { APP_ROUTES } from '@/lib/config/routes';
import Landing from '../Landing';
const state = vi.hoisted(() => ({ language: 'en', user: null as null | { id: string }, isLoading: false, social: {} as Record<string,string> }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/components/nav/ConsumerHeader', () => ({ ConsumerHeader: () => <header>Existing public header</header> }));
vi.mock('@/components/seo/SEOHead', () => ({ SEOHead: () => null }));
vi.mock('@/components/legal/LegalEntityInfo', () => ({ LegalCopyright: () => <small>Existing legal footer</small> }));
vi.mock('@/components/concierge/ConciergeHelpSheet', () => ({ ConciergeHelpSheet: () => null }));
vi.mock('@/components/home/HomeSearchEntry', () => ({ HomeSearchEntry: () => <button>Unified home search</button>, HomePlanLinks: () => <nav>Search shortcuts</nav> }));
vi.mock('@/components/home/HomeDiscoveryPreview', () => ({
  HomeHousingPreview: () => <section>Published housing</section>,
  HomeNewbuildsPreview: () => <section>Published new developments</section>,
  HomeSalePreview: () => <section>Published sale homes</section>,
}));
vi.mock('@/components/home/HomePopulatedProjects', () => ({ HomePopulatedProjects: () => <section aria-label="Project gallery">Populated public projects</section> }));
vi.mock('@/components/property/RentalCommunities', () => ({ RentalCommunities: () => <section>Vacation rental communities</section> }));
vi.mock('@/components/home/HomeCatalogGalleries', () => ({ HomeLocationGallery: () => null, HomeExperienceGallery: () => <section>Published experiences</section>, HomeServiceGallery: () => <section>Service categories</section> }));
vi.mock('@/hooks/useProperties', () => ({ useProperties: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/components/property/PropertyListingCard', () => ({ PropertyListingCard: () => null }));
vi.mock('@/hooks/usePrefetch', () => ({ usePrefetchRoute: () => ({ prefetchRoute: vi.fn() }) }));
vi.mock('@/lib/prefetchRoute', () => ({ prefetchRoute: vi.fn() }));
vi.mock('@/components/layout/AllAppsDrawer', () => ({ AllAppsDrawer: () => null }));

// Execute the actual HomeRouter initializer from its route source rather than
// mirroring its auth selection or substituting authenticated Index/IndexV2.
// The full route registry is unrelated to this isolated anonymous composition.
const source = readFileSync(`${process.cwd()}/src/components/layout/AnimatedRoutes.tsx`, 'utf8');
const ast = ts.createSourceFile('AnimatedRoutes.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let initializer: ts.Expression | undefined;
let mountedAtHome = false;
function visit(node: ts.Node) {
 if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'HomeRouter') initializer = node.initializer;
 if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'Route') {
   const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
   const path = attributes.find(attribute => attribute.name.getText(ast) === 'path');
   const element = attributes.find(attribute => attribute.name.getText(ast) === 'element');
   if (path?.initializer?.getText(ast) === '{APP_ROUTES.HOME}' && element?.initializer?.getText(ast).includes('<HomeRouter />')) mountedAtHome = true;
 }
 ts.forEachChild(node, visit);
}
visit(ast);
if (!initializer) throw new Error('Canonical HomeRouter initializer missing');
const compiled = ts.transpileModule(`exports.HomeRouter = ${initializer.getText(ast)};`, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
const registry: { HomeRouter?: React.ComponentType } = {};
const authenticatedIndex = vi.fn(() => <p>Authenticated home</p>);
new Function('React', 'useAuth', 'LoadingState', 'Landing', 'Index', 'exports', compiled)(React, () => state, () => <p role="status">Checking session</p>, Landing, authenticatedIndex, registry);
const HomeRouter = registry.HomeRouter!;
const show = () => render(<MemoryRouter initialEntries={[APP_ROUTES.HOME]}><Routes><Route path={APP_ROUTES.HOME} element={<HomeRouter />} /></Routes></MemoryRouter>);
beforeEach(() => { state.language = 'en'; state.user = null; state.isLoading = false; state.social = {}; authenticatedIndex.mockClear(); });
afterEach(cleanup);
it.each([
 ['en', 'Main navigation', ['Explore', 'Requests', 'Services', 'Homes', 'Me']],
 ['ru', 'Основная навигация', ['Поиск', 'Заявки', 'Сервисы', 'Купить', 'Профиль']],
 ['th', 'เมนูหลัก', ['สำรวจ', 'คำขอ', 'บริการ', 'ซื้อบ้าน', 'ฉัน']],
] as const)('mounts the real anonymous landing and all five public tabs in %s', (language, name, labels) => {
 expect(mountedAtHome).toBe(true);
 state.language = language;
 show();
 expect(screen.getByTestId('cinematic-home')).toBeVisible();
 expect(screen.getByText('Existing public header')).toBeVisible();
 expect(screen.queryByRole('button', { name: 'Unified home search' })).toBeNull();
 expect(screen.queryByText('Search shortcuts')).toBeNull();
 expect(screen.getAllByRole('main')).toHaveLength(1);
 expect(screen.getByText('Published new developments')).toBeVisible();
 expect(screen.getByText('Published housing')).toBeVisible();
 expect(screen.queryByRole('heading', { name: 'Layantara Villas' })).toBeNull();
 const bar = screen.getByRole('navigation', { name });
 const links = within(bar).getAllByRole('link');
 expect(links.map(link => link.getAttribute('aria-label'))).toEqual(labels);
 expect(links.map(link => link.getAttribute('href'))).toEqual(['/', '/bookings', '/discover/services', '/property/buy', '/account']);
 expect(links[0]).toHaveAttribute('aria-current', 'page');
 expect(bar).toHaveClass('md:hidden', 'fixed', 'bottom-0');
 expect(bar).toHaveStyle({ paddingBottom: 'env(safe-area-inset-bottom, 0px)' });
 expect(authenticatedIndex).not.toHaveBeenCalled();
});
it('waits for auth resolution without mounting the anonymous landing prematurely', () => {
 state.isLoading = true;
 show();
 expect(screen.getByRole('status')).toHaveTextContent('Checking session');
 expect(screen.queryByTestId('cinematic-home')).toBeNull();
});
it('reserves the shared mobile bar height and safe area below the footer, with no desktop bar gap', () => {
 const css = readFileSync(`${process.cwd()}/src/styles/cinematic-home.css`, 'utf8');
 const tokens = readFileSync(`${process.cwd()}/src/styles/tokens.css`, 'utf8');
 expect(css).toContain('padding-bottom:calc(28px + var(--bottom-nav-h, 0px))');
 expect(tokens).toMatch(/--bottom-nav-h:\s*calc\(64px \+ 1px \+ env\(safe-area-inset-bottom, 0px\)\)/);
 expect(tokens).toMatch(/@media \(min-width: 768px\)[\s\S]*--bottom-nav-h:\s*0px/);
});

it('surfaces island services before secondary property galleries and keeps consumer out of partner block', () => {
 show();
 const main = screen.getByRole('main');
 expect(within(main).getByRole('link', { name: /Homes for sale.*10,000,000/ })).toHaveAttribute('href', '/property/search?mode=buy&maxPrice=10000000');
 expect(main.textContent!.indexOf('Published housing')).toBeLessThan(main.textContent!.indexOf('Published sale homes'));
 expect(main.textContent!.indexOf('Service categories')).toBeLessThan(main.textContent!.indexOf('Published new developments'));
 expect(main.textContent!.indexOf('Published experiences')).toBeLessThan(main.textContent!.indexOf('Published new developments'));
 const partners = screen.getByRole('region', { name: 'For owners and partners' });
 expect(within(partners).queryByText('I need a home or service')).toBeNull();
 expect(within(partners).getByRole('link', { name: /I own property/ })).toHaveAttribute('href', '/owner/onboarding');
 expect(within(partners).getByRole('link', { name: /I provide local services/ })).toHaveAttribute('href', '/become-partner?offer=services');
 expect(within(partners).getByRole('link', { name: /I organise experiences/ })).toHaveAttribute('href', '/become-partner?offer=experiences');
 expect(document.querySelector('.home-owner-prompt')).toBeNull();
});

it('shows configured social profiles in the anonymous homepage footer', () => {
 state.social = { youtube: 'https://youtube.com/@synthetic' };
 show();
 const panel = within(screen.getByRole('contentinfo')).getByRole('region', { name: 'Social networks and contact' });
 expect(within(panel).getByRole('heading', { name: 'Stay connected' })).toBeVisible();
 expect(within(panel).getByRole('link', { name: 'YouTube' })).toHaveAttribute('href', 'https://youtube.com/@synthetic');
 expect(within(panel).queryByRole('link', { name: 'Facebook' })).toBeNull();
});

vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ categories: [], lifeSituations: [], isFromDB: true, isLoading: false }) }));
