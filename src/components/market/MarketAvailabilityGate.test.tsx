import { readFileSync } from 'node:fs';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withMarketAvailability } from './MarketAvailabilityGate';

const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
afterEach(cleanup);

describe('unavailable public market', () => {
  it.each([
    ['en', 'Market is not available yet', 'Browse services', 'Go home'],
    ['ru', 'Маркет пока недоступен', 'Перейти к услугам', 'На главную'],
    ['th', 'ตลาดยังไม่เปิดให้บริการ', 'ดูบริการ', 'กลับหน้าหลัก'],
  ])('renders truthful %s copy and navigable alternatives without mounting commerce', (language, title, services, home) => {
    locale.language = language;
    const commerce = vi.fn(() => <button>Buy mock product ฿89</button>);
    const Page = withMarketAvailability(commerce);
    render(<MemoryRouter><Page /></MemoryRouter>);
    expect(commerce).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: services })).toHaveAttribute('href', '/services');
    expect(screen.getByRole('link', { name: home })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/mock product/)).not.toBeInTheDocument();
  });

  it.each(['MarketIndex', 'MarketCatalogPage', 'MarketCategoryPage', 'ProductDetailPage', 'VendorPage', 'StoreDetail', 'WishlistPage', 'MarketCheckout', 'MarketSuccess'])('gates the %s export before catalogue, payment or success hooks mount', name => {
    const source = readFileSync(`${process.cwd()}/src/pages/market/${name}.tsx`, 'utf8');
    expect(source).toContain(`const Available${name} = withMarketAvailability(${name});`);
    expect(source).not.toContain('<MarketComingSoonOverlay />');
  });
});
