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
  it.each(['/property/search', '/property/search/', '/property/offplan', '/property/offplan/project', '/property/complex/project'])('lets only %s own its wide frame and canonical gutters', path => {
    render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/property" element={<PropertyHub />}><Route path="*" element={<p>Actual search route boundary</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByTestId('layout-boundary')).toHaveAttribute('data-automatic-container', 'false');
    expect(screen.getByText('Actual search route boundary')).toBeInTheDocument();
  });
  it('preserves the existing automatic frame for unrelated consultation/forms', () => {
    render(<MemoryRouter initialEntries={['/property/consultation']}><Routes><Route path="/property" element={<PropertyHub />}><Route path="consultation" element={<p>Consultation route boundary</p>} /></Route></Routes></MemoryRouter>);
    expect(screen.getByTestId('layout-boundary')).toHaveAttribute('data-automatic-container', 'true');
  });
});

it('keeps resale context selected and does not show unrelated tabs on its UUID detail', () => {
  const view = render(<MemoryRouter initialEntries={['/property/resale']}><Routes><Route path="/property" element={<PropertyHub />}><Route path="*" element={<p>Resale route boundary</p>} /></Route></Routes></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Resale', pressed: true })).toBeVisible();
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  view.unmount();
  render(<MemoryRouter initialEntries={['/property/resale/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']}><Routes><Route path="/property" element={<PropertyHub />}><Route path="*" element={<p>Resale detail boundary</p>} /></Route></Routes></MemoryRouter>);
  expect(screen.queryByRole('group', { name: 'Property sections' })).not.toBeInTheDocument();
});

it.each([['/property/commercial','Commercial'],['/property/land','Land'],['/property/hotels','Hotels']])('keeps the current public section visible for an anonymous visitor on %s', (path,label) => {
 render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/property" element={<PropertyHub />}><Route path="*" element={<p>Public section</p>} /></Route></Routes></MemoryRouter>);
 expect(screen.getByRole('button',{name:new RegExp(label),pressed:true})).toBeVisible(); expect(screen.getAllByRole('button',{pressed:true})).toHaveLength(1);
});
it('hides unrelated menu tabs on a hotel UUID detail', () => {
 render(<MemoryRouter initialEntries={['/property/hotels/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']}><Routes><Route path="/property" element={<PropertyHub />}><Route path="*" element={<p>Hotel detail</p>} /></Route></Routes></MemoryRouter>);
 expect(screen.queryByRole('group',{name:'Property sections'})).toBeNull();
});
