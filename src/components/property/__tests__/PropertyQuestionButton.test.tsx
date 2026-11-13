import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { PropertyQuestionButton } from '../PropertyQuestionButton';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(cleanup);
it('opens the approved WhatsApp recipient with exact home and civil stay context without authentication', () => {
  render(<PropertyQuestionButton propertyId="home-123" title="Apartment" context={{ dateRange: { from: new Date(2027, 0, 10), to: new Date(2027, 0, 13) }, guests: 3 }} />);
  const url = new URL(screen.getByRole('link').getAttribute('href') ?? '');
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/66954243332');
  expect(url.searchParams.get('text')).toContain('https://myuno.app/property/home-123?mode=rent');
  expect(url.searchParams.get('text')).toContain('2027-01-10 → 2027-01-13');
  expect(url.searchParams.get('text')).toContain('Guests: 3');
});