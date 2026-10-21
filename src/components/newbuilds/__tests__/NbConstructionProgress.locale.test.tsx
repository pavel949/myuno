import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NbConstructionProgress } from '../NbConstructionProgress';
import { projectFeatureLabel, projectCompletionLabel } from '@/lib/offplan/presentation';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
afterEach(cleanup);
describe('public project labels', () => {
  it.each([['en', 'Completion:'], ['ru', 'Сдача:'], ['th', 'กำหนดแล้วเสร็จ:']])('localizes completion in %s', (language, label) => {
    locale.language = language;
    render(<NbConstructionProgress progress={100} completionDate="2024-10-01" />);
    expect(screen.getByText(new RegExp(label))).toHaveTextContent('2024');
    if (language !== 'ru') expect(screen.queryByText(/Сдача/)).toBeNull();
  });
  it('preserves the stored civil month and invalid source text', () => {
    expect(projectCompletionLabel('2024-10-01', 'en')).toBe('Oct 2024');
    expect(projectCompletionLabel('date to be confirmed', 'en')).toBe('date to be confirmed');
  });
  it('uses canonical amenity translations with English fallback for Thai', () => {
    expect(projectFeatureLabel('gym', 'en')).not.toBe('gym');
    expect(projectFeatureLabel('gym', 'ru')).not.toBe(projectFeatureLabel('gym', 'en'));
    expect(projectFeatureLabel('gym', 'th')).toBe(projectFeatureLabel('gym', 'en'));
  });
  it.each([['11_villas', '11 villas'], ['nyse_listed', 'nyse listed'], ['2452+_sqm', '2452+ sqm'], ['anantara', 'anantara']])('humanizes %s without changing source facts', (raw, label) => {
    expect(projectFeatureLabel(raw, 'en')).toBe(label);
  });
});
