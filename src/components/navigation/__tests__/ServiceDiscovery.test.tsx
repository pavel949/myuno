import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { ServiceDiscoveryContent } from '../ServiceDiscovery';
import { CATEGORIES } from '@/lib/catalog/taxonomy';
import { isKnownRoute } from '@/lib/nav/routeRegistry';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
vi.mock('@/hooks/useFeedbackSettings', () => ({ getFeedbackSettings: () => ({}) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => children }));
beforeEach(() => {
 Element.prototype.scrollIntoView = vi.fn();
 Element.prototype.hasPointerCapture = vi.fn(() => false);
 Element.prototype.setPointerCapture = vi.fn();
 Element.prototype.releasePointerCapture = vi.fn();
});
afterEach(cleanup);
function Location() { const l = useLocation(); const go = useNavigate(); return <><output aria-label="URL">{l.search}</output><button onClick={() => go(-1)}>Назад</button></>; }
function setup(path = '/discover/services') { render(<MemoryRouter initialEntries={[path]}><ServiceDiscoveryContent /><Location /></MemoryRouter>); }
describe('direct service discovery', () => {
 it('offers direct registered service links without requiring persona selection', () => {
   setup();
   expect(screen.getByRole('link', { name: 'Трансфер' })).toHaveAttribute('href', '/transport/airport-transfer');
   expect(screen.queryByRole('button', { name: /роль/i })).not.toBeInTheDocument();
   for (const link of screen.getAllByRole('link')) expect(isKnownRoute(link.getAttribute('href')!)).toBe(true);
   for (const c of CATEGORIES) for (const s of c.services.filter(s => s.status === 'soon' || s.status === 'pro')) expect(screen.queryByRole('link', { name: s.labelRu })).not.toBeInTheDocument();
 });
 it('restores search from the URL and preserves unrelated context on clear', () => {
   setup('/discover/services?q=трансфер&source=trip');
   expect(screen.getByRole('searchbox')).toHaveValue('трансфер');
   expect(screen.getByRole('link', { name: 'Трансфер' })).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));
   expect(screen.getByRole('searchbox')).toHaveValue('');
   expect(screen.getByLabelText('URL').textContent).toContain('source=trip');
 });
 it('keeps category selection in history and distinguishes no matches', () => {
   setup();
   fireEvent.keyDown(screen.getByRole('combobox', { name: 'Категория' }), { key: 'Enter' });
   fireEvent.click(screen.getByRole('option', { name: 'Транспортные услуги' }));
   expect(screen.getByLabelText('URL').textContent).toContain('category=cat-transport');
   fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
   expect(screen.getByRole('combobox', { name: 'Категория' })).toHaveTextContent('Все категории');
   fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zz-no-match-123' } });
   expect(screen.getByText('Ничего не нашлось')).toBeInTheDocument();
   fireEvent.click(screen.getByRole('button', { name: 'Сбросить поиск' }));
   expect(screen.getByRole('link', { name: 'Трансфер' })).toBeInTheDocument();
 });
});
