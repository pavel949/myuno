import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminProperties from '../AdminProperties';
import AdminProjects from '../AdminProjects';

const mocks = vi.hoisted(() => ({
  language: 'en', loading: false, error: null as Error | null,
  properties: [] as Record<string, unknown>[], projects: [] as Record<string, unknown>[],
  retry: vi.fn(), write: vi.fn(() => { throw Error('Business writes forbidden'); }),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mocks.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'synthetic-admin' }, isLoading: false }) }));
vi.mock('@/hooks/useAdmin', () => ({ useAdminCheck: () => ({ isAdmin: true, isLoading: false }) }));
vi.mock('@/hooks/useAdminContent', () => ({ useAdminProperties: () => ({ properties: mocks.properties, isLoading: mocks.loading, error: mocks.error, refetch: mocks.retry, updateProperty: mocks.write, createProperty: mocks.write, deleteProperty: mocks.write }) }));
vi.mock('@/hooks/usePropertyProjects', () => ({ useAdminPropertyProjects: () => ({ data: mocks.projects, isLoading: mocks.loading, error: mocks.error, refetch: mocks.retry }), useCreatePropertyProject: () => ({ mutateAsync: mocks.write }), useUpdatePropertyProject: () => ({ mutateAsync: mocks.write }) }));
vi.mock('@/hooks/useAdminDevelopers', () => ({ useAdminDevelopers: () => ({ data: [] }) }));
vi.mock('@/hooks/useManagementCompanies', () => ({ useManagementCompanies: () => ({ data: [] }) }));
vi.mock('@/hooks/useCityCurrency', () => ({ useCityCurrency: () => ({ code: 'THB' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.write, functions: { invoke: mocks.write } } }));
vi.mock('@/components/admin/ProviderSelector', () => ({ ProviderSelector: () => null }));
vi.mock('@/components/admin/RealEstateDomainHealthPanel', () => ({ RealEstateDomainHealthPanel: () => null }));
vi.mock('@/components/admin/PropertyProjectBulkLinkPanel', () => ({ PropertyProjectBulkLinkPanel: () => null }));
vi.mock('@/components/admin/PropertyStayRulesPanel', () => ({ PropertyStayRulesPanel: () => null }));
vi.mock('@/components/property/PropertyCard', () => ({ PropertyCard: ({ property, onEdit }: { property: { title_en: string }; onEdit: () => void }) => <button onClick={onEdit}>{property.title_en}</button> }));
vi.mock('@/components/property/canonical-form', () => ({ CanonicalPropertyForm: () => <p>Synthetic editor</p> }));
vi.mock('@/components/admin/intake/AIIntakeDialog', () => ({ AIIntakeDialog: () => null }));
vi.mock('@/components/admin/projects/ProjectUnitsTab', () => ({ ProjectUnitsTab: () => null }));
vi.mock('@/components/upload/AirbnbStyleImageUpload', () => ({ AirbnbStyleImageUpload: () => null }));
vi.mock('@/components/forms/TranslatableInput', () => ({ TranslatableInput: () => null }));
vi.mock('@/components/forms/TranslatableTextarea', () => ({ TranslatableTextarea: () => null }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: () => {} }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: () => {}, isTypingKey: () => false }));
function RouteProbe() {
  const location = useLocation(), navigate = useNavigate();
  return <><div data-testid="route">{location.pathname}{location.search}</div><button onClick={() => navigate(-1)}>Back fixture</button></>;
}
function renderPage(page: 'properties' | 'projects', entries: string[]) {
  return render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={entries} initialIndex={entries.length - 1} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{page === 'properties' ? <AdminProperties /> : <AdminProjects />}<RouteProbe /></MemoryRouter></QueryClientProvider>);
}
const pendingProperty = { id: 'pending', title_en: 'Pending coastal home', approval_status: 'pending', is_active: true };
const approvedProperty = { id: 'approved', title_en: 'Approved coastal home', approval_status: 'approved', is_active: true };
const pendingProject = { id: 'pending', name_en: 'Pending coastal project', name_ru: 'Тестовый проект', is_approved: false, is_active: false, project_status: 'offplan' };
const approvedProject = { id: 'approved', name_en: 'Approved coastal project', name_ru: 'Одобренный проект', is_approved: true, is_active: true, project_status: 'completed', updated_at: '2020-01-01T00:00:00Z' };
beforeEach(() => { vi.clearAllMocks(); mocks.language = 'en'; mocks.loading = false; mocks.error = null; mocks.properties = [pendingProperty, approvedProperty]; mocks.projects = [pendingProject, approvedProject]; });
afterEach(() => { cleanup(); expect(mocks.write).not.toHaveBeenCalled(); });

describe('AdminProperties review views', () => {
  it('applies activity and approval together, preserves provider context and opens the existing editor', () => {
    renderPage('properties', ['/admin/properties?provider=synthetic-provider&status=pending&activity=active&q=coastal&source=fixture']);
    expect(screen.getByRole('button', { name: pendingProperty.title_en })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: approvedProperty.title_en })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Approved 1$/ }));
    expect(screen.getByTestId('route')).toHaveTextContent('provider=synthetic-provider&status=approved&activity=active&q=coastal&source=fixture');
    fireEvent.click(screen.getByRole('button', { name: approvedProperty.title_en }));
    expect(screen.getByRole('dialog', { name: 'Edit Property' })).toBeInTheDocument();
  });
  it('keeps the literal search word all in the input and URL', () => {
    renderPage('properties', ['/admin/properties?status=pending']);
    const search = screen.getByRole('textbox', { name: 'Search properties' });
    fireEvent.change(search, { target: { value: 'all' } });
    expect(search).toHaveValue('all');
    expect(screen.getByTestId('route')).toHaveTextContent('status=pending&q=all');
    expect(screen.getByText('No matching properties')).toBeInTheDocument();
  });
  it('restores URL filters on back navigation', () => {
    renderPage('properties', ['/admin/properties?status=approved', '/admin/properties?status=pending']);
    fireEvent.click(screen.getByRole('button', { name: 'Back fixture' }));
    expect(screen.getByRole('button', { name: /^Approved 1$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: pendingProperty.title_en })).not.toBeInTheDocument();
  });
  it('keeps unknown statuses visible only in all, explicitly labelled unknown', () => {
    mocks.properties = [{ id: 'unknown', title_en: 'Unknown property' }];
    renderPage('properties', ['/admin/properties']);
    expect(screen.getByText('Approval: unknown')).toBeInTheDocument();
    expect(screen.getByText('Activity: unknown')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Draft 0$/ }));
    expect(screen.getByText('No matching properties')).toBeInTheDocument();
    expect(screen.queryByText('Add properties')).not.toBeInTheDocument();
  });
});

describe('AdminProjects review views', () => {
  it('honors newbuilds pending links, composes stage/search, and opens the existing editor', () => {
    renderPage('projects', ['/admin/projects?filter=pending&stage=offplan&q=coastal&source=newbuilds']);
    expect(screen.getByText(pendingProject.name_en)).toBeInTheDocument();
    expect(screen.queryByText(approvedProject.name_en)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Construction stage')).toHaveTextContent('Off-Plan');
    fireEvent.click(screen.getByRole('button', { name: 'Review details' }));
    expect(screen.getByRole('dialog', { name: 'Edit Project' })).toBeInTheDocument();
  });
  it('honors the previously ignored stale console link', () => {
    renderPage('projects', ['/admin/projects?filter=stale']);
    expect(screen.getByText(approvedProject.name_en)).toBeInTheDocument();
    expect(screen.queryByText(pendingProject.name_en)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^No updates for 45 days 1$/ })).toHaveAttribute('aria-pressed', 'true');
  });
  it('does not call filtered absence an empty catalogue', () => {
    renderPage('projects', ['/admin/projects?filter=orphan']);
    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.queryByText('No projects yet. Create your first!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByText(pendingProject.name_en)).toBeInTheDocument();
  });
});

it.each(['properties', 'projects'] as const)('%s shows unknown counts during load and an actionable read error', page => {
  mocks.loading = true;
  const view = renderPage(page, [`/admin/${page}`]);
  expect(screen.getByRole('status')).toHaveTextContent(/Loading/);
  expect(screen.getByRole('button', { name: /^All —$/ })).toBeInTheDocument();
  view.unmount(); mocks.loading = false; mocks.error = new Error('Synthetic read failure');
  renderPage(page, [`/admin/${page}`]);
  expect(screen.getByRole('status')).toHaveTextContent('Count unavailable');
  expect(screen.getByRole('button', { name: /^All —$/ })).toBeInTheDocument();
  const alert = screen.getByRole('alert');
  fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
  expect(mocks.retry).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Showing 0/)).not.toBeInTheDocument();
});


it('returns from property review to the exact filtered moderation queue without saving', async () => {
  renderPage('properties', ['/admin/properties?edit=pending&return=%2Fadmin%2Foperations%3Ftab%3Dmoderation%26type%3Dproperty%26q%3Dcoastal']);
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close editor' }));
  expect(screen.getByTestId('route')).toHaveTextContent('/admin/operations?tab=moderation&q=coastal&type=property');
  expect(mocks.write).not.toHaveBeenCalled();
});

it('makes a missing reviewed property actionable without inventing an empty or saved result', () => {
  renderPage('properties', ['/admin/properties?edit=missing&return=%2Fadmin%2Foperations%3Ftab%3Dmoderation']);
  expect(screen.getByRole('alert')).toHaveTextContent('This property is unavailable in the loaded list');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Return to queue' }));
  expect(screen.getByTestId('route')).toHaveTextContent('/admin/operations?tab=moderation');
  expect(mocks.write).not.toHaveBeenCalled();
});

it.each(['properties', 'projects'] as const)('localizes the %s review controls and loading guidance in Thai', page => {
  mocks.language = 'th';
  renderPage(page, [`/admin/${page}`]);
  expect(screen.getByRole('button', { name: /^รออนุมัติ 1$/ })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('แสดง 2 จาก 2 รายการ');
  if (page === 'properties') expect(screen.getByRole('textbox', { name: 'ค้นหาที่พัก' })).toBeInTheDocument();
  else expect(screen.getByRole('combobox', { name: 'สถานะการก่อสร้าง' })).toHaveTextContent('ทุกสถานะ');
});
