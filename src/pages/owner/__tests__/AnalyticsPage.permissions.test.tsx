import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import OwnerModulesPage from '../OwnerModulesPage';
import { mcRoutes } from '@/components/layout/routes/mcRoutes';
import { APP_ROUTES } from '@/lib/config/routes';
import { PERMISSION_PRESETS } from '@/lib/permissionPresets';
import type { TeamMemberPermissionRow } from '@/lib/untypedTables';

const state = vi.hoisted(() => ({
  language: 'en',
  companyId: 'company-a',
  role: 'manager',
  readPermissions: vi.fn(),
  overviewImport: vi.fn(),
  budgetImport: vi.fn(),
  overviewFetch: vi.fn(),
  budgetFetch: vi.fn(),
  reportsFetch: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'member-a' } }) }));
vi.mock('@/hooks/useActiveCompany', () => ({ useActiveCompany: () => ({ activeCompany: { company_id: state.companyId, role: state.role } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/lib/untypedTables', () => ({
  typedFrom: () => ({ select: () => ({ eq: () => ({ eq: () => state.readPermissions() }) }) }),
}));
// Each lazy child owns a synthetic query, so accidental mounts are observable
// as fetches without importing real financial queries or contacting a backend.
vi.mock('@/pages/owner/OwnerRevenueDashboard', () => {
  state.overviewImport();
  return { default: function OverviewFixture() {
    useQuery({ queryKey: ['fixture-revenue'], queryFn: state.overviewFetch });
    return <div>Revenue fixture</div>;
  } };
});
vi.mock('@/pages/owner/BudgetPage', () => {
  state.budgetImport();
  return { default: function BudgetFixture() {
    useQuery({ queryKey: ['fixture-budget'], queryFn: state.budgetFetch });
    return <div>Budget fixture</div>;
  } };
});
vi.mock('@/pages/owner/ReportsPage', () => ({ default: function ReportsFixture() {
  useQuery({ queryKey: ['fixture-reports'], queryFn: state.reportsFetch });
  return <div>Reports fixture</div>;
} }));
vi.mock('@/pages/owner/OwnerDashboard', () => ({ default: () => <div>MC home fixture</div> }));

const manager = PERMISSION_PRESETS.find(preset => preset.key === 'manager')!;
function permissions(financeView = false, financeEdit = false, reportsView = true): TeamMemberPermissionRow[] {
  return Object.entries(manager.modules).map(([module, permission]) => ({
    ...permission,
    id: module,
    user_id: 'member-a',
    company_id: state.companyId,
    module,
    granted_by: null,
    updated_at: '2026-10-19T00:00:00Z',
    ...(module === 'finance' ? { can_view: financeView, can_edit: financeEdit } : {}),
    ...(module === 'reports' ? { can_view: reportsView } : {}),
  }));
}
function makeClient(rows?: TeamMemberPermissionRow[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  if (rows) client.setQueryData(['team-permissions', 'member-a', state.companyId], rows);
  return client;
}
function renderPage(client: QueryClient) {
  return render(<QueryClientProvider client={client}><MemoryRouter><AnalyticsPage /></MemoryRouter></QueryClientProvider>);
}
function expectNoFinanceFetches() {
  expect(state.overviewFetch).not.toHaveBeenCalled();
  expect(state.budgetFetch).not.toHaveBeenCalled();
  expect(screen.queryByText('Revenue fixture')).toBeNull();
  expect(screen.queryByText('Budget fixture')).toBeNull();
}
beforeEach(() => {
  state.language = 'en';
  state.companyId = 'company-a';
  state.role = 'manager';
  vi.clearAllMocks();
  state.readPermissions.mockResolvedValue({ data: permissions(), error: null });
  state.overviewFetch.mockResolvedValue([]);
  state.budgetFetch.mockResolvedValue([]);
  state.reportsFetch.mockResolvedValue([]);
});
afterEach(cleanup);

describe('Analytics uses existing module permissions before mounting children', () => {
  it.each(['en', 'ru'])('lets the manager preset open Reports without loading or fetching finance in %s', async language => {
    state.language = language;
    expect(manager.modules.reports.can_view).toBe(true);
    expect(manager.modules.finance.can_view).toBe(false);
    renderPage(makeClient(permissions()));
    await screen.findByText('Reports fixture');
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: language === 'ru' ? 'Отчёты' : 'Reports' })).toHaveAttribute('aria-selected', 'true');
    expectNoFinanceFetches();
    expect(state.overviewImport).not.toHaveBeenCalled();
    expect(state.budgetImport).not.toHaveBeenCalled();
  });

  it('keeps every child unmounted while permissions load, then resolves to Reports', async () => {
    let resolve!: (result: { data: TeamMemberPermissionRow[]; error: null }) => void;
    state.readPermissions.mockReturnValue(new Promise(result => { resolve = result; }));
    renderPage(makeClient());
    expect(screen.queryByRole('tab')).toBeNull();
    expect(state.reportsFetch).not.toHaveBeenCalled();
    expectNoFinanceFetches();
    await act(async () => { resolve({ data: permissions(), error: null }); });
    await screen.findByText('Reports fixture');
    expectNoFinanceFetches();
  });

  it('fails closed after a permission read error', async () => {
    state.readPermissions.mockResolvedValue({ data: null, error: new Error('Permission read unavailable') });
    renderPage(makeClient());
    await screen.findByText('Analytics access unavailable');
    expect(state.reportsFetch).not.toHaveBeenCalled();
    expectNoFinanceFetches();
  });

  it('denies direct entry without reports permission even when finance is granted', () => {
    renderPage(makeClient(permissions(true, true, false)));
    expect(screen.getByText('Analytics access unavailable')).toBeTruthy();
    expect(state.reportsFetch).not.toHaveBeenCalled();
    expectNoFinanceFetches();
  });

  it('allows revenue viewing without exposing the editable budget to finance view-only members', async () => {
    renderPage(makeClient(permissions(true, false)));
    await screen.findByText('Revenue fixture');
    await waitFor(() => expect(state.overviewFetch).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('tab', { name: 'Budget' })).toBeNull();
    expect(state.budgetFetch).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Reports' }), { button: 0, ctrlKey: false });
    await screen.findByText('Reports fixture');
  });

  it('unmounts a selected budget immediately when finance permission is revoked', async () => {
    const client = makeClient(permissions(true, true));
    renderPage(client);
    await screen.findByText('Revenue fixture');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Budget' }), { button: 0, ctrlKey: false });
    await screen.findByText('Budget fixture');
    await waitFor(() => expect(state.budgetFetch).toHaveBeenCalledTimes(1));
    await act(async () => { client.setQueryData(['team-permissions', 'member-a', state.companyId], permissions()); });
    await screen.findByText('Reports fixture');
    expect(screen.queryByRole('tab', { name: 'Budget' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Overview' })).toBeNull();
    expect(screen.queryByText('Budget fixture')).toBeNull();
    expect(state.budgetFetch).toHaveBeenCalledTimes(1);
  });

  it('blocks old finance children on a company switch while new permissions are pending', async () => {
    const client = makeClient(permissions(true, true));
    const view = renderPage(client);
    await screen.findByText('Revenue fixture');
    state.companyId = 'company-b';
    state.readPermissions.mockReturnValue(new Promise(() => {}));
    view.rerender(<QueryClientProvider client={client}><MemoryRouter><AnalyticsPage /></MemoryRouter></QueryClientProvider>);
    expect(screen.queryByText('Revenue fixture')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(state.budgetFetch).not.toHaveBeenCalled();
  });

  it('routes the visible manager module tile to the actual MC analytics page without finance fetches', async () => {
    render(<QueryClientProvider client={makeClient(permissions())}><MemoryRouter initialEntries={['/mc/modules']}>
      <Routes><Route path="/mc">{mcRoutes}</Route></Routes>
    </MemoryRouter></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Analytics' }));
    await screen.findByRole('heading', { name: 'Analytics & Reports' });
    await screen.findByText('Reports fixture');
    expect(APP_ROUTES.MC_ANALYTICS).toBe('/mc/analytics');
    expectNoFinanceFetches();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByText('MC home fixture');
  });

  it('hides the module tile without reports permission', () => {
    render(<QueryClientProvider client={makeClient(permissions(false, false, false))}><MemoryRouter><OwnerModulesPage /></MemoryRouter></QueryClientProvider>);
    expect(screen.queryByRole('button', { name: 'Analytics' })).toBeNull();
  });
});
