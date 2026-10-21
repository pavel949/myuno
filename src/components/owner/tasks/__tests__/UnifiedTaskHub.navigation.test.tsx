import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UnifiedTaskHub } from '../UnifiedTaskHub';
import type { UnifiedTask } from '../TaskDetailSheet';
import type { CrmTask } from '@/hooks/useCrmTasks';
import type { OperationalTask } from '@/hooks/useOperationalTasks';
import type { UnifiedProperty } from '@/hooks/useMyProperties';

const state = vi.hoisted(() => ({
  company: 'company-a' as string | undefined,
  actor: 'actor-a' as string | undefined,
  language: 'en',
  crm: [] as CrmTask[],
  ops: [] as OperationalTask[],
  properties: [] as UnifiedProperty[],
  crmLoading: false, opsLoading: false, propertiesLoading: false, companyLoading: false,
  crmError: null as Error | null, opsError: null as Error | null,
  propertiesError: null as Error | null, companyError: null as Error | null,
  write: vi.fn(), refetch: vi.fn(), seenDetails: vi.fn(),
}));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.actor ? { id: state.actor } : null }) }));
vi.mock('@/hooks/useAgentDeals', () => ({
  useMyCompanyId: () => ({ data: state.company ? { company_id: state.company } : null, isLoading: state.companyLoading, error: state.companyError, refetch: state.refetch }),
  useCompanyMembers: () => ({ data: [] }),
}));
vi.mock('@/hooks/useCrmTasks', () => ({
  useCrmTasks: () => ({ data: state.crm, isLoading: state.crmLoading, error: state.crmError, refetch: state.refetch }),
  useCreateCrmTask: () => ({ mutateAsync: state.write }),
  useUpdateCrmTask: () => ({ mutate: state.write }),
  useDeleteCrmTask: () => ({ mutate: state.write }),
}));
vi.mock('@/hooks/useOperationalTasks', () => ({
  useOperationalTasks: () => ({ tasks: state.ops, isLoading: state.opsLoading, error: state.opsError, refetch: state.refetch }),
}));
vi.mock('@/hooks/useMyProperties', () => ({
  useMyProperties: () => ({ activeProperties: state.properties, isLoading: state.propertiesLoading, error: state.propertiesError, refetch: state.refetch }),
}));
vi.mock('@/hooks/useTaskNotifications', () => ({ useTaskNotifications: () => ({ notifyAssignment: vi.fn() }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { throw new Error('Unexpected database access in navigation test'); } } }));
vi.mock('../TaskSummaryKPIs', () => ({ TaskSummaryKPIs: () => null }));
vi.mock('../TaskDetailSheet', () => ({
  TaskDetailSheet: ({ task, onOpenChange }: { task: UnifiedTask; onOpenChange: (open: boolean) => void }) => {
    // Stateful editor double catches reuse of draft state across same-ID sources.
    const [draft] = useState(task.title);
    state.seenDetails({ source: task.source, id: task.id, title: task.title });
    return <section role="dialog" aria-label="Task Details">
      <p data-testid="detail-source">{task.source}</p>
      <input aria-label="Detail title" value={draft} readOnly />
      <button onClick={() => onOpenChange(false)}>Close detail</button>
    </section>;
  },
}));

const property = (id = 'property-a') => ({ property_id: id, title: id, is_active: true } as UnifiedProperty);
const crm = (overrides: Partial<CrmTask> = {}): CrmTask => ({
  id: 'shared-id', company_id: 'company-a', property_id: null, title: 'CRM follow-up',
  description: 'Business context', task_type: 'follow_up', priority: 'medium', status: 'pending',
  due_date: '2026-10-19T10:00:00+07:00', assigned_to: 'actor-a',
  ...overrides,
} as CrmTask);
const ops = (overrides: Partial<OperationalTask> = {}): OperationalTask => ({
  id: 'shared-id', property_id: 'property-a', title: 'Operational cleaning', notes: 'Operational context',
  task_type: 'cleaning', priority: 'normal', status: 'pending',
  scheduled_date: '2026-10-19', assigned_to: 'actor-a', ...overrides,
} as OperationalTask);
function LocationProbe() {
  const l = useLocation();
  const navigate = useNavigate();
  return <>
    <output data-testid="url">{l.pathname + l.search + l.hash}</output>
    <button onClick={() => navigate(-1)}>History back</button>
    <button onClick={() => navigate(1)}>History forward</button>
    <button onClick={() => navigate('/mc/tasks?source=crm&id=shared-id&company=company-a')}>Open CRM</button>
    <button onClick={() => navigate('/mc/tasks?source=ops&id=shared-id&company=company-a')}>Open Ops</button>
    <button onClick={() => navigate('/mc/tasks?action=create&keep=yes')}>Create again</button>
  </>;
}
function mount(url: string, previous?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = () => <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={previous ? [previous, url] : [url]} initialIndex={previous ? 1 : 0}>
      <Routes>
        <Route path="/mc/tasks" element={<UnifiedTaskHub />} />
        <Route path="/mc/today" element={<p>Today page</p>} />
        <Route path="/mc" element={<p>Previous page</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  </QueryClientProvider>;
  const result = render(tree());
  return { rerender: () => result.rerender(tree()) };
}
function urlParams() { return new URL(screen.getByTestId('url').textContent!, 'https://unit.invalid').searchParams; }
function expectUnavailable() {
  expect(screen.getByText('This task is unavailable in the current company or property scope.')).toBeVisible();
  expect(screen.queryByLabelText('Detail title')).not.toBeInTheDocument();
}
afterEach(cleanup);
beforeEach(() => {
  state.company = 'company-a'; state.actor = 'actor-a'; state.language = 'en';
  state.crm = [crm()]; state.ops = [ops()]; state.properties = [property()];
  state.crmLoading = false; state.opsLoading = false; state.propertiesLoading = false; state.companyLoading = false;
  state.crmError = null; state.opsError = null; state.propertiesError = null; state.companyError = null;
  vi.clearAllMocks();
});

it('uses exact source plus ID and remounts the editor across same-ID CRM and ops records', () => {
  mount('/mc/tasks?source=ops&id=shared-id&company=company-a');
  expect(screen.getByLabelText('Detail title')).toHaveValue('Operational cleaning');
  expect(screen.getByTestId('detail-source')).toHaveTextContent('ops');
  fireEvent.click(screen.getByText('Open CRM'));
  expect(screen.getByLabelText('Detail title')).toHaveValue('CRM follow-up');
  expect(screen.getByTestId('detail-source')).toHaveTextContent('crm');
  fireEvent.click(screen.getByText('History back'));
  expect(screen.getByLabelText('Detail title')).toHaveValue('Operational cleaning');
  expect(state.write).not.toHaveBeenCalled();
});

it.each(['?id=shared-id', '?source=unknown&id=shared-id', '?source=ops', '?source=crm&id=', '?source=OPS&id=shared-id'])('does not infer a source for invalid selection %s', query => {
  mount(`/mc/tasks${query}`);
  expectUnavailable();
  expect(state.seenDetails).not.toHaveBeenCalled();
});

it.each(['crm', 'ops'])('does not fall back to the other source when the %s record is missing', source => {
  if (source === 'crm') state.crm = []; else state.ops = [];
  mount(`/mc/tasks?source=${source}&id=shared-id`);
  expectUnavailable();
});

it('rejects an incoming link from another company even when stale ops arrays still match activeProperties', () => {
  state.company = 'company-b';
  mount('/mc/tasks?source=ops&id=shared-id&company=company-a');
  expectUnavailable();
});

it.each(['crm', 'ops'])('invalidates an open %s detail synchronously on company switch with unchanged cached arrays', source => {
  const view = mount(`/mc/tasks?source=${source}&id=shared-id`);
  expect(screen.getByLabelText('Detail title')).toBeVisible();
  state.seenDetails.mockClear();
  state.company = 'company-b';
  view.rerender();
  expectUnavailable();
  expect(state.seenDetails).not.toHaveBeenCalled();
  state.company = 'company-a';
  view.rerender();
  expectUnavailable();
});

it('does not expose CRM data that belongs to another company, even for a matching ID', () => {
  state.crm = [crm({ company_id: 'company-b' })];
  mount('/mc/tasks?source=crm&id=shared-id');
  expectUnavailable();
  expect(screen.queryByText('CRM follow-up')).not.toBeInTheDocument();
});

it.each(['crm', 'ops'])('requires a property-linked %s record to belong to activeProperties', source => {
  state.crm = [crm({ property_id: 'property-outside' })];
  state.ops = [ops({ property_id: 'property-outside' })];
  mount(`/mc/tasks?source=${source}&id=shared-id`);
  expectUnavailable();
});

it.each(['actor', 'properties'])('removes open detail immediately on %s scope change', change => {
  const view = mount('/mc/tasks?source=ops&id=shared-id');
  state.seenDetails.mockClear();
  if (change === 'actor') state.actor = 'actor-b'; else state.properties = [property('property-b')];
  view.rerender();
  expectUnavailable();
  expect(state.seenDetails).not.toHaveBeenCalled();
});

it('waits for initial company and property scope before resolving a valid company-qualified link', () => {
  state.company = undefined; state.companyLoading = true; state.propertiesLoading = true;
  const view = mount('/mc/tasks?source=ops&id=shared-id&company=company-a');
  expect(screen.getByText('Loading task…')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
  state.company = 'company-a'; state.companyLoading = false; state.propertiesLoading = false;
  view.rerender();
  expect(screen.getByLabelText('Detail title')).toHaveValue('Operational cleaning');
});

it.each(['crm', 'ops', 'properties'])('gates stale detail while the %s reader is loading', reader => {
  if (reader === 'crm') state.crmLoading = true;
  else if (reader === 'ops') state.opsLoading = true;
  else state.propertiesLoading = true;
  mount(`/mc/tasks?source=${reader === 'crm' ? 'crm' : 'ops'}&id=shared-id`);
  expect(screen.getByText('Loading task…')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
});

it.each(['crm', 'ops', 'properties'])('gates stale detail on %s error and exposes a retry', reader => {
  if (reader === 'crm') state.crmError = new Error('synthetic failure');
  else if (reader === 'ops') state.opsError = new Error('synthetic failure');
  else state.propertiesError = new Error('synthetic failure');
  mount(`/mc/tasks?source=${reader === 'crm' ? 'crm' : 'ops'}&id=shared-id`);
  expect(screen.getByText('Could not load this task. Please try again.')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retry' }));
  expect(state.refetch).toHaveBeenCalled();
  expect(state.write).not.toHaveBeenCalled();
});

it('keeps task filters, assignee, other params and hash through open, close, Back and Forward', () => {
  state.ops = [ops({ status: 'completed' }), ops({ id: 'pending-ops', title: 'Pending cleaning' }), ops({ id: 'other-assignee', title: 'Other cleaner', status: 'completed', assigned_to: 'actor-b' })];
  mount('/mc/tasks?tab=operations&status=completed&assignee=actor-a&keep=yes#hub');
  expect(screen.queryByText('CRM follow-up')).not.toBeInTheDocument();
  expect(screen.queryByText('Pending cleaning')).not.toBeInTheDocument();
  expect(screen.queryByText('Other cleaner')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Operational cleaning'));
  expect(urlParams().get('source')).toBe('ops');
  expect(urlParams().get('id')).toBe('shared-id');
  fireEvent.click(screen.getByText('History back'));
  expect(screen.queryByLabelText('Detail title')).not.toBeInTheDocument();
  expect(urlParams().get('status')).toBe('completed');
  fireEvent.click(screen.getByText('History forward'));
  expect(screen.getByLabelText('Detail title')).toBeVisible();
  fireEvent.click(screen.getByText('Close detail'));
  expect(urlParams().has('id')).toBe(false);
  expect(urlParams().has('source')).toBe(false);
  for (const [key, value] of [['tab', 'operations'], ['status', 'completed'], ['assignee', 'actor-a'], ['keep', 'yes']]) expect(urlParams().get(key)).toBe(value);
  expect(screen.getByTestId('url').textContent).toMatch(/#hub$/);
  fireEvent.click(screen.getByText('History back'));
  expect(screen.getByLabelText('Detail title')).toBeVisible();
  fireEvent.click(screen.getByText('History forward'));
  expect(screen.queryByLabelText('Detail title')).not.toBeInTheDocument();
});

it('persists tab and status choices in URL history while preserving unrelated parameters', () => {
  mount('/mc/tasks?assignee=actor-a&keep=yes');
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Operations' }), { button: 0, ctrlKey: false });
  expect(urlParams().get('tab')).toBe('operations');
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(urlParams().get('status')).toBe('completed');
  expect(urlParams().get('assignee')).toBe('actor-a');
  expect(urlParams().get('keep')).toBe('yes');
  fireEvent.click(screen.getByText('History back'));
  expect(urlParams().has('status')).toBe(false);
  expect(screen.getByText('Operational cleaning')).toBeVisible();
});

it('retains the exact validated Today return context after closing detail', () => {
  const returnTo = '/mc/today?property=property-a&status=open#maintenance';
  mount(`/mc/tasks?source=ops&id=shared-id&returnTo=${encodeURIComponent(returnTo)}&keep=yes`);
  fireEvent.click(screen.getByText('Close detail'));
  const link = screen.getByRole('link', { name: 'Back to Today' });
  expect(link).toHaveAttribute('href', returnTo);
  fireEvent.click(link);
  expect(screen.getByTestId('url')).toHaveTextContent(returnTo);
  expect(screen.getByText('Today page')).toBeVisible();
});

it.each(['https://evil.invalid/mc/today', '//evil.invalid/mc/today', '/mc/tasks', '/mc/today/../settings', '/mc/today\\evil', '/mc/today%2Fevil', 'javascript:alert(1)'])('rejects unsafe or unrelated returnTo %s', returnTo => {
  mount(`/mc/tasks?returnTo=${encodeURIComponent(returnTo)}`);
  expect(screen.queryByRole('link', { name: 'Back to Today' })).not.toBeInTheDocument();
});

it.each([['en', 'This task is unavailable in the current company or property scope.'], ['ru', 'Эта задача недоступна в текущей компании или выбранных объектах.'], ['th', 'งานนี้ไม่พร้อมใช้งานในบริษัทหรือขอบเขตอสังหาริมทรัพย์ปัจจุบัน']])('localizes unavailable detail in %s', (language, message) => {
  state.language = language;
  mount('/mc/tasks?source=ops&id=missing');
  expect(screen.getByText(message)).toBeVisible();
});

it('consumes create intent once, retains filter context, and does not replay after Back/Forward', async () => {
  mount('/mc/tasks?action=create&tab=operations&status=completed&assignee=actor-a&keep=yes', '/mc');
  expect(await screen.findByPlaceholderText('Task title...')).toBeVisible();
  await waitFor(() => expect(urlParams().has('action')).toBe(false));
  expect(urlParams().get('tab')).toBe('operations');
  expect(urlParams().get('status')).toBe('completed');
  expect(urlParams().get('assignee')).toBe('actor-a');
  expect(urlParams().get('keep')).toBe('yes');
  expect(state.write).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByText('History back'));
  expect(screen.getByText('Previous page')).toBeVisible();
  fireEvent.click(screen.getByText('History forward'));
  expect(screen.queryByPlaceholderText('Task title...')).not.toBeInTheDocument();
  expect(state.write).not.toHaveBeenCalled();
});

it('keeps create intent pending until company context resolves', () => {
  state.company = undefined;
  const view = mount('/mc/tasks?action=create&keep=yes');
  expect(screen.queryByPlaceholderText('Task title...')).not.toBeInTheDocument();
  expect(urlParams().get('action')).toBe('create');
  state.company = 'company-a'; view.rerender();
  expect(screen.getByPlaceholderText('Task title...')).toBeVisible();
  expect(urlParams().has('action')).toBe(false);
  expect(state.write).not.toHaveBeenCalled();
});

it('resolves a linked authorized task independently of list tab, status and assignee filters', () => {
  state.ops = [ops({ status: 'completed', assigned_to: 'actor-b' })];
  mount('/mc/tasks?source=ops&id=shared-id&tab=business&status=active&assignee=actor-a');
  expect(screen.getByLabelText('Detail title')).toHaveValue('Operational cleaning');
  expect(screen.getByTestId('detail-source')).toHaveTextContent('ops');
});

it('never keeps a task snapshot after the selected record leaves the loaded result', () => {
  const view = mount('/mc/tasks?source=ops&id=shared-id');
  expect(screen.getByLabelText('Detail title')).toBeVisible();
  state.seenDetails.mockClear();
  state.ops = [];
  view.rerender();
  expectUnavailable();
  expect(state.seenDetails).not.toHaveBeenCalled();
});

it('hides a previously open detail while property context reloads and rejects a changed scope afterward', () => {
  const view = mount('/mc/tasks?source=ops&id=shared-id');
  state.propertiesLoading = true;
  state.seenDetails.mockClear();
  view.rerender();
  expect(screen.getByText('Loading task…')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
  state.propertiesLoading = false;
  state.properties = [property(), property('another-authorized-property')];
  view.rerender();
  expectUnavailable();
});

it('waits for unresolved company context before resolving an explicitly company-tagged link', () => {
  state.company = undefined; state.companyLoading = true;
  const view = mount('/mc/tasks?source=ops&id=shared-id&company=company-a');
  expect(screen.getByText('Loading task…')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
  state.company = 'company-a'; state.companyLoading = false;
  view.rerender();
  expect(screen.getByLabelText('Detail title')).toHaveValue('Operational cleaning');
});

it('retries failed company context without guessing a task from cached rows', () => {
  state.company = undefined; state.companyError = new Error('company unavailable');
  mount('/mc/tasks?source=ops&id=shared-id&company=company-a');
  expect(screen.getByText('Could not load this task. Please try again.')).toBeVisible();
  expect(state.seenDetails).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByText('Retry'));
  expect(state.refetch).toHaveBeenCalledTimes(3);
});
