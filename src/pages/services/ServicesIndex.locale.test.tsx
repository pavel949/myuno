import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ServicesIndex from './ServicesIndex';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/hooks/usePersonaFilter', () => ({ usePersonaFilter: () => ({ applyFilter: (rows: unknown[]) => rows }) }));
vi.mock('@/components/services/MarketplaceServiceGrid', () => ({ MarketplaceServiceGrid: () => null }));
vi.mock('@/components/miniapp/MiniAppLayout', () => ({ MiniAppLayout: () => null }));
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function mount() { render(<MemoryRouter initialEntries={['/services']}><ServicesIndex embedded /><Location /></MemoryRouter>); }
afterEach(cleanup);
describe('services catalogue UI locales', () => {
  it.each([
    ['en', 'Services in Phuket', 'Search services…', 'Request service'],
    ['ru', 'Услуги на Пхукете', 'Поиск услуг…', 'Оставить заявку'],
    ['th', 'บริการในภูเก็ต', 'ค้นหาบริการ…', 'ส่งคำขอบริการ'],
  ])('renders %s page and actual request-card controls', (language, title, search, action) => {
    locale.language = language; mount();
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: search })).toBeVisible();
    expect(screen.getAllByText(action).length).toBeGreaterThan(0);
  });
  it('localizes observed Thai labels without translating service records or changing filters', () => {
    locale.language = 'th'; mount();
    for (const label of ['บริการและคำขอของฉัน', 'คำขอบริการสำหรับบ้าน', 'หมวดหมู่คำขอ', 'ทุกหมวดหมู่', 'ไม่พบบริการที่ต้องการ?', 'อธิบายสิ่งที่ต้องการ', 'เลือกบริการ', 'ระบุสถานที่และเวลา', 'รอการยืนยัน']) {
      expect(screen.getByText(label)).toBeVisible();
    }
    expect(screen.getByText('AC Cleaning')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'เครื่องปรับอากาศ' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('เครื่องปรับอากาศ');
    expect(screen.getByTestId('location')).toHaveTextContent('category=ac');
    expect(screen.getByText('AC Cleaning')).toBeVisible();
    expect(screen.queryByText('Services in Phuket')).toBeNull();
  });
});
