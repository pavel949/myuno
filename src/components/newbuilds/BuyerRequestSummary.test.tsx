import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BuyerRequestSummary } from './BuyerRequestSummary';

const { request, steps, scope } = vi.hoisted(() => ({
  request: vi.fn(), steps: vi.fn(), scope: { actor: 'admin-a', language: 'en' },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: scope.actor ? { id: scope.actor } : null }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: scope.language }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => {
    steps('from', table);
    const chain = {
      select: (projection: string) => { steps('select', projection); return chain; },
      eq: (key: string, value: string) => { steps('eq', key, value); return chain; },
      abortSignal: () => chain,
      maybeSingle: () => request(table),
    };
    return chain;
  } },
}));

const projectId = '00000000-0000-4000-8000-000000000001';
const unitId = '00000000-0000-4000-8000-000000000002';
const propertyId = '00000000-0000-4000-8000-000000000003';
const wrongId = '00000000-0000-4000-8000-000000000004';
const metadata = { request_only: true, project_id: projectId, unit_id: unitId, property_id: propertyId, intent: 'reserve_request', project_name: 'Misleading title', unit_number: 'MISLEADING-UNIT' };
const project = { id: projectId, name_en: 'Verified project', name_ru: 'Проверенный проект' };
const unit = { id: unitId, project_id: projectId, unit_code: '020701', property_id: propertyId, properties: { id: propertyId, project_id: projectId, unit_number: '020701' } };
function prepare(unitResult: unknown = unit, projectResult: unknown = project) {
  request.mockImplementation(async table => ({ data: table === 'project_units' ? unitResult : projectResult, error: null }));
}
function mount(data: Record<string, unknown> = metadata, detailOpen = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const app = () => <QueryClientProvider client={client}><MemoryRouter><BuyerRequestSummary metadata={data} detailOpen={detailOpen} /></MemoryRouter></QueryClientProvider>;
  const view = render(app());
  return { rerender: () => view.rerender(app()) };
}
beforeEach(() => {
  scope.actor = 'admin-a';
  scope.language = 'en';
  request.mockReset();
  steps.mockClear();
});
describe('operator newbuild request context', () => {
  it('reads exact project and verified physical match, not labels in request metadata', async () => {
    prepare();
    mount();
    expect(await screen.findByRole('link', { name: 'Verified project' })).toHaveAttribute('href', `/property/offplan/${projectId}`);
    expect(await screen.findByText('020701')).toBeVisible();
    expect(screen.getByText(/Request only. Reservation and payment are not confirmed/)).toBeVisible();
    expect(screen.queryByText(/Misleading title|MISLEADING-UNIT/)).toBeNull();
    expect(steps.mock.calls.filter(call => call[0] === 'eq')).toEqual([
      ['eq', 'id', projectId], ['eq', 'id', unitId], ['eq', 'project_id', projectId],
      ['eq', 'property_id', propertyId], ['eq', 'properties.project_id', projectId],
    ]);
  });
  it.each([
    { ...unit, id: wrongId },
    { ...unit, project_id: wrongId },
    { ...unit, property_id: wrongId },
    { ...unit, properties: { ...unit.properties, id: wrongId } },
    { ...unit, properties: { ...unit.properties, project_id: wrongId } },
    { ...unit, properties: null },
    { ...unit, properties: { ...unit.properties, unit_number: '20701' } },
  ])('does not claim a unit number for an unverifiable row: %j', async unitResult => {
    prepare(unitResult);
    mount();
    await waitFor(() => expect(request).toHaveBeenCalledWith('project_units'));
    expect(await screen.findByText(/Some details could not be verified/)).toBeVisible();
    expect(screen.getByText(new RegExp(unitId))).toBeVisible();
    expect(screen.queryByText(/^020701$/)).toBeNull();
  });
  it('does not query a unit when the project is not accessible or its UUID is wrong', async () => {
    prepare(unit, { ...project, id: wrongId });
    mount();
    expect(await screen.findByText(/Some details could not be verified/)).toBeVisible();
    expect(request.mock.calls).toEqual([['property_projects']]);
  });
  it('does not query a unit from malformed or missing references', async () => {
    prepare();
    mount({ ...metadata, unit_id: 'invalid' });
    expect(await screen.findByRole('link', { name: 'Verified project' })).toBeVisible();
    expect(request.mock.calls).toEqual([['property_projects']]);
  });
  it.each(['signed-out', 'closed', 'bad-project'])('never queries catalogue when %s', reason => {
    prepare();
    if (reason === 'signed-out') scope.actor = '';
    mount(reason === 'bad-project' ? { ...metadata, project_id: '../invalid' } : metadata, reason !== 'closed');
    expect(steps).not.toHaveBeenCalled();
    if (reason === 'bad-project') expect(screen.queryByRole('link')).toBeNull();
  });
  it('partitions prior labels by operator and fails closed after identity changes', async () => {
    prepare();
    const view = mount();
    expect(await screen.findByText('020701')).toBeVisible();
    request.mockResolvedValue({ data: null, error: new Error('private diagnostic') });
    scope.actor = 'admin-b';
    view.rerender();
    expect(screen.queryByText('020701')).toBeNull();
    expect(await screen.findByText(/Some details could not be verified/)).toBeVisible();
    expect(screen.queryByText(/private diagnostic/)).toBeNull();
  });
});
