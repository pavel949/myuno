import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MarketplaceEntry } from './MarketplaceEntry';

const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
afterEach(cleanup);

describe('myUNO managed marketplace entries', () => {
  it.each([
    ['property', 'Недвижимость на Пхукете', 'Homes in Phuket', 'อสังหาริมทรัพย์ในภูเก็ต'],
    ['discovery', 'Начните с вашей задачи', 'Start with your goal', 'เริ่มจากเป้าหมายของคุณ'],
    ['live', 'Переезд и жизнь на Пхукете', 'Moving to and living in Phuket', 'ย้ายมาและใช้ชีวิตในภูเก็ต'],
    ['rent', 'Аренда на Пхукете', 'Rent in Phuket', 'เช่าที่พักในภูเก็ต'],
    ['buy', 'Купить недвижимость на Пхукете', 'Buy property in Phuket', 'ซื้ออสังหาริมทรัพย์ในภูเก็ต'],
    ['experiences', 'Впечатления на Пхукете', 'Experiences in Phuket', 'ประสบการณ์ในภูเก็ต'],
    ['services', 'Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต'],
  ] as const)('%s has one localized heading and identifies myUNO', (kind, ru, en, th) => {
    for (const [language, title] of [['ru', ru], ['en', en], ['th', th]]) {
      locale.language = language;
      const page = render(<MemoryRouter><MarketplaceEntry kind={kind} /></MemoryRouter>);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const entry = screen.getByRole('region', { name: title });
      expect(entry).toHaveAttribute('data-marketplace-entry', kind);
      expect(entry).toHaveTextContent('myUNO');
      expect(entry).not.toHaveTextContent(/confirmed booking|available today/i);
      page.unmount();
    }
  });

  it('keeps a native rental search jump instead of an unfiltered redirect', () => {
    locale.language = 'en';
    render(<MemoryRouter><MarketplaceEntry kind="rent" actions={[
      { href: '#rental-search', label: { en: 'Find a home', ru: 'Найти жильё', th: 'ค้นหาที่พัก' } },
    ]} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Find a home' })).toHaveAttribute('href', '#rental-search');
  });
});
