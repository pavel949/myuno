import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { YachtPolicies } from './YachtPolicies';
import { YachtBookingQuickSelect } from './YachtBookingQuickSelect';
import type { Yacht } from '@/hooks/useYachts';
import { VERTICAL_CONTEXT_CONFIG } from '@/lib/vertical/contextConfig';
import { readFileSync } from 'node:fs';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div>{children}</div> : null }));
afterEach(cleanup);

describe.each(['en', 'ru'])('Yacht request truth (%s)', (language) => {
  it('does not turn an absent cancellation policy into free cancellation', () => {
    state.language = language;
    render(<YachtPolicies />);
    expect(screen.queryByText(/48h|48ч/)).toBeNull();
    expect(screen.getAllByText(language === 'ru' ? 'Уточняйте' : 'Contact operator')).toHaveLength(1);
  });
  it('preserves explicit cancellation and insurance facts', () => {
    state.language = language;
    render(<YachtPolicies cancellationPolicy="moderate" insuranceIncluded="yes" />);
    expect(screen.getByText(/48h|48ч/)).toBeInTheDocument();
    expect(screen.getByText(language === 'ru' ? 'Страховка включена' : 'Insurance included')).toBeInTheDocument();
  });
  it('does not promise operator verification or insurance from opening the request selector', () => {
    state.language = language;
    render(<MemoryRouter><YachtBookingQuickSelect yacht={{ id: 'test', name_en: 'Test', name_ru: 'Тест', price_full_day: 1000, currency: 'THB', capacity: 4 } as Yacht} /></MemoryRouter>);
    fireEvent.click(screen.getByText(language === 'ru' ? 'Выбрать дату' : 'Choose Date'));
    expect(screen.queryByText(/Verified operator|Проверенный оператор|Protected by myUNO|Защищено myUNO/)).toBeNull();
    expect(screen.getByText(language === 'ru' ? /Выбор даты не подтверждает бронирование/ : /Selecting a date does not confirm a booking/)).toBeInTheDocument();
  });
});

it('static planning guidance cannot masquerade as a current marine forecast or guaranteed availability', () => {
  expect(VERTICAL_CONTEXT_CONFIG.yacht?.bodyEn).not.toMatch(/Beaufort|calm seas/);
  expect(VERTICAL_CONTEXT_CONFIG.yacht?.titleEn).not.toMatch(/This Week/);
  expect(VERTICAL_CONTEXT_CONFIG.experience?.bodyEn).not.toMatch(/all tours running/);
});
it('flower surfaces do not promise unconditional freshness or same-day delivery', () => {
  for (const file of ['FlowersIndex', 'BouquetDetail']) {
    const source = readFileSync(`src/pages/flowers/${file}.tsx`, 'utf8');
    expect(source).not.toMatch(/5-day freshness|Свежесть 5 дней|Гарантия свежести 5 дней|доставим сегодня|1-3 hours|1-3 часа/);
  }
});
