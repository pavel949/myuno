import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import PropertyHub from '../PropertyHub';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useUserPersonas', () => ({ useUserPersonas: () => ({ personas: [] }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children, usePageContainer }: { children: ReactNode; usePageContainer?: boolean }) =>
  <main data-testid="layout-boundary" data-automatic-container={String(usePageContainer)}>{children}</main> }));
afterEach(cleanup);

describe('property catalogue frame ownership', () => {
  it.each(['/property/search', '/property/search/'])('lets only %s own its wide frame and canonical gutters', path => {
    render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/property" element={<PropertyHub />}><Route path="search" element={<p>Actual search route boundary</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByTestId('layout-boundary')).toHaveAttribute('data-automatic-container', 'false');
    expect(screen.getByText('Actual search route boundary')).toBeInTheDocument();
  });
  it('preserves the existing automatic frame for unrelated consultation/forms', () => {
    render(<MemoryRouter initialEntries={['/property/consultation']}><Routes><Route path="/property" element={<PropertyHub />}><Route path="consultation" element={<p>Consultation route boundary</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByTestId('layout-boundary')).toHaveAttribute('data-automatic-container', 'true');
  });
});
