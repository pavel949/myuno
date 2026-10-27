import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { NbROICalculator } from '../NbROICalculator';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'ru' }) }));
afterEach(cleanup);
it('does not invent a project price, rent, operating cost or return', () => {
  render(<NbROICalculator />);
  for (const input of screen.getAllByRole('spinbutton')) expect(input).toHaveValue(null);
  expect(screen.queryByText('Gross yield')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Копировать результаты' })).toBeNull();
});
it('prefills only the canonical price and requires explicit scenario assumptions, including zeros', () => {
  render(<NbROICalculator defaultPrice={8_000_000} defaultRoi={9} defaultCamFee={120} />);
  expect(screen.getByLabelText('Цена покупки (฿)')).toHaveValue(8_000_000);
  expect(screen.getByLabelText('CAM fee/мес (฿)')).toHaveValue(null);
  const assumptions = [['Мебель и отделка (฿)', '0'], ['Аренда за ночь (฿)', '3000'], ['Заполняемость (%)', '70'], ['Рост цены в год (%)', '0'], ['CAM fee/мес (฿)', '0'], ['УК аренды (%)', '0'], ['Налог (%)', '0']];
  for (const [label, value] of assumptions.slice(0, -1)) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  expect(screen.queryByText('Gross yield')).toBeNull();
  fireEvent.change(screen.getByLabelText('Налог (%)'), { target: { value: '0' } });
  expect(screen.getByText('Gross yield')).toBeVisible();
  expect(screen.getByLabelText('Налог (%)')).toHaveValue(0);
});
