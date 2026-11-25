import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useCreateServiceOrder } from '@/hooks/useServiceMarketplace';
import { clearAdminCache } from '@/hooks/useIsAdmin';
import { APP_ROUTES } from '@/lib/config/routes';
import AdminInbox from './AdminInbox';

type ServiceRow = Record<string, string | null>;
type Read = { table: string; projection: string; filters: Record<string, string>; list?: [number, number]; expression?: string };
const db = vi.hoisted(() => ({
  actor: 'fixture-admin',
  admin: true,
  rows: [] as ServiceRow[],
  reads: [] as Read[],
  inserts: [] as { table: string; row: ServiceRow }[],
  denyRead: false,
  wrongRow: null as ServiceRow | null,
  rpc: vi.fn(),
  users: new Map<string, { id: string }>(),
}));
const target = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const stay = '33333333-3333-4333-8333-333333333333';
const path = APP_ROUTES.ADMIN_INBOX;
const inboxHref = (id: string) => `${path}?source=service_orders&request=${id}`;
const saved = (id: string, name = 'Synthetic service'): ServiceRow => ({
  id, service_type: 'marketplace', service_name: name, order_number: 'SO-001024',
  scheduled_at: '2027-03-11T01:00:00Z', status: 'pending', created_at: '2026-11-24T00:00:00Z',
  guest_name: 'Synthetic customer', guest_phone: '+66000000000', notes: 'Synthetic booking instruction',
  payment_status: 'paid', provider_id: 'internal-provider',
});

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => {
  if (!db.users.has(db.actor)) db.users.set(db.actor, { id: db.actor });
  return { user: db.users.get(db.actor) };
} }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: (...args: unknown[]) => db.rpc(...args),
  from(table: string) {
    const read: Read = { table, projection: '', filters: {} };
    let inserted: ServiceRow | null = null;
    const q = {
      select(projection: string) { read.projection = projection; return q; },
      eq(field: string, value: string) { read.filters[field] = value; return q; },
      order() { return q; },
      or(expression: string) { read.expression = expression; return q; },
      insert(row: ServiceRow) { db.inserts.push({ table, row }); inserted = row; return q; },
      async single() {
        if (table !== 'service_orders' || !inserted) throw new Error('Unexpected synthetic insert');
        db.rows.push({ ...inserted, ...saved(target), notes: inserted.notes });
        return { data: { id: target }, error: null };
      },
      async range(first: number, last: number) {
        db.reads.push({ ...read, list: [first, last] });
        if (db.denyRead) return { data: null, count: null, error: new Error('Hidden backend detail') };
        const rows = visible();
        return { data: rows.slice(first, last + 1).map(project), count: rows.length, error: null };
      },
      async maybeSingle() {
        db.reads.push(read);
        if (db.denyRead) return { data: null, error: new Error('Hidden backend detail') };
        const row = db.wrongRow ?? visible()[0];
        return { data: row ? project(row) : null, error: null };
      },
    };
    function visible() {
      return table === 'service_orders' ? db.rows.filter(row => Object.entries(read.filters).every(([field, value]) => row[field] === value)) : [];
    }
    function project(row: ServiceRow) {
      return Object.fromEntries(read.projection.split(',').map(field => field.trim()).map(field => [field, row[field]]));
    }
    return q;
  },
} }));

const clients: QueryClient[] = [];
function mount(url: string, element = <AdminInbox />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const tree = () => <QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[url]}><Routes><Route path={path} element={element} /></Routes></MemoryRouter>
  </QueryClientProvider>;
  const view = render(tree());
  return { ...view, rerenderActor: () => view.rerender(tree()) };
}
function SyntheticGuestIntake() {
  const submit = useCreateServiceOrder();
  return <button onClick={() => submit.mutate({
    serviceId: 'catalog-service', providerId: 'catalog-provider', scheduledAt: new Date('2027-03-11T01:00:00Z'),
    guestId: db.actor, guestName: 'Guest', guestPhone: '', notes: 'Received only by the operator display',
  })}>Submit fixture request</button>;
}
beforeEach(() => {
  clearAdminCache();
  db.actor = 'fixture-admin'; db.admin = true; db.rows = []; db.reads = []; db.inserts = [];
  db.denyRead = false; db.wrongRow = null;
  db.rpc.mockReset().mockImplementation(async (fn: string, params: { _user_id: string; _role: string }) => {
    if (fn !== 'has_role' || params._role !== 'admin') throw new Error('Unexpected RPC');
    return { data: db.admin && params._user_id === db.actor, error: null };
  });
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

it('hands the one canonical guest request to the real protected Inbox source and opens exact row', async () => {
  db.actor = 'fixture-guest';
  const guest = mount(path, <SyntheticGuestIntake />);
  fireEvent.click(screen.getByRole('button', { name: 'Submit fixture request' }));
  await waitFor(() => expect(db.rows).toHaveLength(1));
  guest.unmount();
  db.rows.push({ ...saved(stay, 'Stay-only order'), service_type: 'housekeeping' });
  db.actor = 'fixture-admin';
  mount(path);
  fireEvent.click(screen.getByRole('button', { name: 'Services' }));
  const link = await screen.findByRole('link', { name: /Synthetic service/ });
  const handoff = new URL(link.getAttribute('href')!, 'http://localhost');
  expect(handoff.pathname).toBe(path);
  expect(handoff.searchParams.get('source')).toBe('service_orders');
  expect(handoff.searchParams.get('request')).toBe(target);
  expect(screen.queryByText('Stay-only order')).toBeNull();
  expect(screen.queryByText('+66000000000')).toBeNull();
  fireEvent.click(link);
  const dialog = await screen.findByRole('dialog', { name: 'Service request' });
  expect(await within(dialog).findByText('Received only by the operator display')).toBeVisible();
  expect(within(dialog).getByText('+66000000000')).toBeVisible();
  expect(within(dialog).getByText(/08:00.*Phuket time/i)).toBeVisible();
  expect(within(dialog).queryByText(/paid|internal-provider/i)).toBeNull();
  expect(within(dialog).queryByRole('button', { name: /start working|close request/i })).toBeNull();
  const list = db.reads.find(read => read.table === 'service_orders' && read.list);
  expect(list).toMatchObject({ filters: { service_type: 'marketplace' }, list: [0, 49] });
  expect(list?.expression).toContain('status.in.(pending)');
  expect(list?.projection).not.toMatch(/guest|notes|payment/);
  expect(db.reads.filter(read => read.filters.id).map(read => read.filters)).toEqual([{ id: target, service_type: 'marketplace' }]);
  expect(db.inserts.map(call => call.table)).toEqual(['service_orders']);
});

it('opens the requested service on a direct URL even beyond the list cut, never a neighboring record', async () => {
  db.rows = Array.from({ length: 52 }, (_, i) => saved(`44444444-4444-4444-8444-${String(i).padStart(12, '0')}`, 'Other request'));
  db.rows.push(saved(target, 'Outside the first queue page'));
  mount(inboxHref(target));
  const dialog = await screen.findByRole('dialog', { name: 'Service request' });
  expect(await within(dialog).findByText('Outside the first queue page')).toBeVisible();
  expect(within(dialog).queryByText('Other request')).toBeNull();
  expect(db.reads.find(read => read.filters.id === target)).toMatchObject({ table: 'service_orders', filters: { id: target, service_type: 'marketplace' } });
  expect(db.inserts).toHaveLength(0);
});

it('rejects another service type and refuses an unexpected returned identity', async () => {
  db.rows = [{ ...saved(target), service_type: 'housekeeping' }];
  const mounted = mount(inboxHref(target));
  expect(await screen.findByText('Request not found or unavailable.')).toBeVisible();
  expect(screen.queryByText('Synthetic customer')).toBeNull();
  mounted.unmount();
  db.wrongRow = saved(other);
  mount(inboxHref(target));
  expect(await screen.findByText('Could not load request.')).toBeVisible();
  expect(screen.queryByText('Synthetic customer')).toBeNull();
  expect(db.inserts).toHaveLength(0);
});

it('fails closed for a different actor on the same URL, even after an admin cache was populated', async () => {
  db.rows = [saved(target)];
  const view = mount(inboxHref(target));
  expect(await screen.findByText('Synthetic booking instruction')).toBeVisible();
  const readsBefore = db.reads.length;
  db.actor = 'fixture-provider'; db.admin = false;
  view.rerenderActor();
  expect(screen.queryByText('Synthetic booking instruction')).toBeNull();
  expect(await screen.findByText('Request access is not authorized.')).toBeVisible();
  expect(db.reads).toHaveLength(readsBefore);
  expect(db.inserts).toHaveLength(0);
});
