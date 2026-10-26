import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ServicesIndex from './ServicesIndex';
import { CATEGORIES, LIFE_SITUATIONS } from '@/lib/catalog/taxonomy';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/lib/catalog/useCatalogFromDB', () => ({ useCatalogFromDB: () => ({ categories: CATEGORIES, lifeSituations: LIFE_SITUATIONS, isFromDB: true, isLoading: false, error: null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/hooks/useServiceMarketplace', () => ({ useMarketplaceServices: () => ({ data: [], isLoading: false, isError: false }) }));
vi.mock('@/components/services/MarketplaceServiceGrid', () => ({ MarketplaceServiceGrid: () => null }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: () => null }));
afterEach(cleanup);
describe('services catalogue UI locales', () => {
  it.each([
    ['en', 'Services in Phuket', 'Search services…', 'Request service', 'By category', 'By situation'],
    ['ru', 'Услуги на Пхукете', 'Поиск услуг…', 'Оставить заявку', 'По категориям', 'По ситуации'],
    ['th', 'บริการในภูเก็ต', 'ค้นหาบริการ…', 'ส่งคำขอบริการ', 'ตามหมวดหมู่', 'ตามสถานการณ์'],
  ])('renders %s actual controls and preserves English fallback for untranslated records', (language, title, search, action, categories, situations) => {
    locale.language = language;
    render(<MemoryRouter initialEntries={['/services?category=ac']}><ServicesIndex embedded /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: search })).toBeVisible();
    expect(screen.getByRole('tab', { name: categories })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: situations })).toBeVisible();
    expect(screen.getAllByText(action).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zz-unmatched' } });
    expect(screen.queryByText(action)).toBeNull();
  });
});
