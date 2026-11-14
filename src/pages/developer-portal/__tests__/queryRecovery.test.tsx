import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ error: null as null | Error, profileError: null as null | Error, loading: false, retry: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic' }, isLoading: false }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/hooks/useDeveloperPortal', () => ({
  useDeveloperProfile: () => ({ data: fixture.profileError ? undefined : { id: 'synthetic', name_en: 'Synthetic developer' }, isLoading: false, error: fixture.profileError, refetch: fixture.retry, isFetching: false }),
  useDeveloperProjects: () => ({ data: fixture.error || fixture.loading ? undefined : [], isLoading: fixture.loading, error: fixture.error, refetch: fixture.retry, isFetching: false }),
}));
vi.mock('@/hooks/useNewbuildLeads', () => ({
  useDeveloperLeads: () => ({ data: fixture.error || fixture.loading ? undefined : [], isLoading: fixture.loading, error: fixture.error, refetch: fixture.retry, isFetching: false }),
  useUpdateLeadStatus: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/components/newbuilds/NewbuildsLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import Projects from '../DeveloperProjects';
import Leads from '../DeveloperLeads';
import Overview from '../DeveloperOverview';
import Portal from '@/components/newbuilds/DeveloperPortalLayout';
beforeEach(() => { fixture.error = null; fixture.profileError = null; fixture.loading = false; vi.clearAllMocks(); });
afterEach(cleanup);
function show(Page: React.ComponentType) { return render(<MemoryRouter><Page /></MemoryRouter>); }
it.each([Projects, Leads])('offers retry instead of a false empty result', Page => {
  fixture.error = new Error('private backend detail'); show(Page);
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
  expect(screen.queryByText(/У вас пока нет проектов|Лиды не найдены/)).toBeNull();
  expect(screen.queryByText('private backend detail')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' })); expect(fixture.retry).toHaveBeenCalledOnce();
});
it('keeps successful empty projects distinct from error', () => {
  show(Projects); expect(screen.getByText('У вас пока нет проектов')).toBeVisible(); expect(screen.queryByRole('alert')).toBeNull();
});
it('does not report zero KPIs after unresolved source reads', () => {
  fixture.error = new Error('offline'); show(Overview);
  expect(screen.getAllByText('—')).toHaveLength(3); expect(screen.getAllByRole('alert')).toHaveLength(2);
});
it('does not redirect a failed profile read to registration or mount its private outlet', () => {
  fixture.profileError = new Error('offline');
  render(<MemoryRouter initialEntries={['/developer-portal']}><Routes><Route path="/developer-portal" element={<Portal />}><Route index element={<p>Private outlet</p>} /></Route><Route path="*" element={<p>Redirected</p>} /></Routes></MemoryRouter>);
  expect(screen.getByRole('alert')).toBeVisible(); expect(screen.queryByText('Private outlet')).toBeNull(); expect(screen.queryByText('Redirected')).toBeNull();
});