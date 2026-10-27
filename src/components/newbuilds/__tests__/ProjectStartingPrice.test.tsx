import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectStartingPrice } from '../ProjectStartingPrice';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
afterEach(cleanup);
describe('project price labels', () => {
  it.each([['en', 'From', 'Price requires confirmation'], ['ru', 'от', 'Цена требует уточнения'], ['th', 'เริ่มต้น', 'ต้องยืนยันราคา']])('shows editable THB price and warning in %s', (language, from, warning) => {
    state.language = language;
    render(<ProjectStartingPrice price={8_000_000} />);
    expect(screen.getByText(new RegExp(from))).toHaveTextContent('THB');
    expect(screen.getByText(warning)).toBeVisible();
    expect(screen.queryByText(/USD|EUR|RUB/)).toBeNull();
  });
  it('keeps missing prices unknown', () => {
    state.language = 'en';
    render(<ProjectStartingPrice price={0} />);
    expect(screen.getByText('Price to be confirmed')).toBeVisible();
    expect(screen.queryByText(/THB/)).toBeNull();
  });
});
