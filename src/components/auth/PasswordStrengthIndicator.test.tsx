import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
afterEach(cleanup);
describe('password guidance language', () => {
  it.each([['en', 'Strong', 'Uppercase letter'], ['ru', 'Сильный', 'Заглавная буква'], ['th', 'แข็งแรง', 'ตัวอักษรภาษาอังกฤษพิมพ์ใหญ่']])('uses %s throughout', (language, strength, rule) => {
    state.language = language;
    render(<PasswordStrengthIndicator password="Synthetic123!" />);
    expect(screen.getByText(strength)).toBeInTheDocument();
    expect(screen.getByText(rule)).toBeInTheDocument();
    if (language === 'th') {
      expect(screen.queryByText('Strong')).not.toBeInTheDocument();
      expect(screen.queryByText('8+ characters')).not.toBeInTheDocument();
    }
  });
  it('shows no strength claim for an empty password', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
