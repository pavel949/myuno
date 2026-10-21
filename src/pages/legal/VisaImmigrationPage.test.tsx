import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import VisaImmigrationPage from './VisaImmigrationPage';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/hooks/useVisaServices', () => ({ useVisaServices: () => ({ services: [], isLoading: false }) }));
vi.mock('@/components/legal/VisaTracker', () => ({ VisaTracker: () => null }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
afterEach(cleanup);
it.each([
  ['en', 'Visas and stays'], ['ru', 'Визы и пребывание'], ['th', 'วีซ่าและการพำนัก'],
])('presents the %s reference header and retains the existing tabs', (language, label) => {
  state.language = language;
  render(<MemoryRouter><VisaImmigrationPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument();
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  expect(screen.queryByText(/Complete guide/)).not.toBeInTheDocument();
});
