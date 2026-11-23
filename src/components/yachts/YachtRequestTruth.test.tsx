import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { YachtPolicies } from './YachtPolicies';
import { YachtBookingQuickSelect } from './YachtBookingQuickSelect';
import type { Yacht } from '@/hooks/useYachts';
import { VERTICAL_CONTEXT_CONFIG } from '@/lib/vertical/contextConfig';
import { readFileSync } from 'node:fs';

const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/contexts/CartContext', () => ({ useCart: () => ({ addItem: vi.fn(), items: [] }) }));
vi.mock('@/components/ui/responsive-modal', () => ({ ResponsiveModal: ({ open, children, footer }: { open: boolean; children: React.ReactNode; footer: React.ReactNode }) => open ? <div>{children}{footer}</div> : null }));
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
it.each([
  ['en', 'Preferred time in Phuket', 'The selected time needs myUNO confirmation.'],
  ['ru', 'Желаемое время по Пхукету', 'Выбранное время требует подтверждения myUNO.'],
  ['th', 'เวลาที่ต้องการในภูเก็ต', 'ทีม myUNO ต้องยืนยันเวลาที่เลือก'],
])('labels unverified departure times as preferences in %s', (language, timeTitle, hint) => {
  state.language = language;
  render(<MemoryRouter><YachtBookingQuickSelect yacht={{ id: 'test', name_en: 'Test', name_ru: 'Тест', price_full_day: 1000, currency: 'THB', capacity: 4 } as Yacht} /></MemoryRouter>);
  fireEvent.click(screen.getByText(language === 'ru' ? 'Выбрать дату' : 'Choose Date'));
  fireEvent.click(screen.getByText(language === 'ru' ? 'Завтра' : 'Tomorrow'));
  expect(screen.getByText(timeTitle)).toBeVisible();
  expect(screen.getByText(hint)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  expect(screen.getByRole('button', { name: '09:00' })).toHaveAttribute('aria-pressed', 'true');
});
it('does not offer fabricated hours for instant booking without a schedule', () => {
  state.language = 'en';
  render(<MemoryRouter><YachtBookingQuickSelect yacht={{ id: 'test', name_en: 'Test', price_full_day: 1000, booking_flow: 'instant', currency: 'THB', capacity: 4 } as Yacht} /></MemoryRouter>);
  fireEvent.click(screen.getByText('Choose Date'));
  fireEvent.click(screen.getByText('Tomorrow'));
  expect(screen.getByText('This yacht has no configured schedule yet.')).toBeVisible();
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
});
it('flower surfaces do not promise unconditional freshness or same-day delivery', () => {
  for (const file of ['FlowersIndex', 'BouquetDetail']) {
    const source = readFileSync(`src/pages/flowers/${file}.tsx`, 'utf8');
    expect(source).not.toMatch(/5-day freshness|Свежесть 5 дней|Гарантия свежести 5 дней|доставим сегодня|1-3 hours|1-3 часа/);
  }
});

it('one selector keeps the exact charter request after the layout change', () => {
  function BookingTarget() {
    const location = useLocation();
    return <output aria-label="booking target">{JSON.stringify({ path: location.pathname + location.search, state: location.state })}</output>;
  }
  state.language = 'en';
  render(
    <MemoryRouter initialEntries={['/yachts/test']}>
      <Routes>
        <Route path="/yachts/:id" element={<YachtBookingQuickSelect yacht={{ id: 'test', name_en: 'Test', price_full_day: 1000, currency: 'THB', capacity: 4 } as Yacht} />} />
        <Route path="/yachts/:id/booking" element={<BookingTarget />} />
      </Routes>
    </MemoryRouter>,
  );
  const trigger = screen.getByRole('button', { name: 'Choose Date' });
  fireEvent.click(trigger);
  expect(screen.getByRole('button', { name: 'Send Request' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }));
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));
  const target = JSON.parse(screen.getByLabelText('booking target').textContent || '{}');
  expect(target).toEqual({
    path: '/yachts/test/booking?type=full_day',
    state: { bookNowData: { date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), time: '09:00', guests: 2, charterType: 'full_day' } },
  });
});
