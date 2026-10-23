import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationSettings } from '../NotificationSettings';
import { OrgProfileEditor } from '../OrgProfileEditor';
import { FeatureFlagManager } from '../FeatureFlagManager';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { Json } from '@/integrations/supabase/types';
type Row = { key: string; value: Json };
type Reply = { data: Row[] | null; error: Error | null };
const state = vi.hoisted(() => ({
  user: { id: 'admin-a' } as { id: string } | null,
  rolesError: false, retryRoles: vi.fn(),
  store: new Map<string, Json>(), readError: false, writeError: false, zeroAck: false, badReadback: false, failedReadback: false,
  writes: [] as { actor: string | null; rows: Row[] }[], reads: [] as { actor: string | null; keys: string[] }[],
  readOverride: null as null | ((actor: string | null, keys: string[]) => Reply | Promise<Reply>),
  writeOverride: null as null | ((rows: Row[]) => Reply | Promise<Reply>), success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useUserRoles', () => ({ useUserRoles: () => ({ roles: [{ role: 'admin' }], isLoading: false, error: state.rolesError ? new Error('Synthetic role read failure') : null, refetch: async () => { state.retryRoles(); return { error: state.rolesError ? new Error('Synthetic role read failure') : null }; } }) }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: (table: string) => {
  if (table !== 'system_settings') throw new Error('Unexpected fixture table');
  const actor = state.user?.id ?? null; let keys: string[] = []; let rows: Row[] | null = null;
  const chain = {
    select: () => chain, in: (_field: string, values: string[]) => { keys = values; return chain; },
    like: (_field: string, prefix: string) => { keys = [...state.store.keys()].filter(key => key.startsWith(prefix.slice(0, -1))); return chain; },
    upsert: (values: Row[], options: { onConflict: string }) => { if (options.onConflict !== 'key') throw new Error('Expected existing unique key'); rows = values; return chain; },
    then: (yes: (reply: Reply) => unknown, no: (error: unknown) => unknown) => {
      let reply: Reply | Promise<Reply>;
      if (rows) {
        state.writes.push({ actor, rows });
        if (state.writeOverride) reply = state.writeOverride(rows);
        else if (state.writeError) reply = { data: null, error: new Error('Synthetic write failure') };
        else if (state.zeroAck) reply = { data: [], error: null };
        else { rows.forEach(row => state.store.set(row.key, row.value)); reply = { data: rows.map(row => ({ key: row.key, value: row.value })), error: null }; }
      } else {
        state.reads.push({ actor, keys });
        if (state.readOverride) reply = state.readOverride(actor, keys);
        else if (state.readError || (state.failedReadback && state.writes.length)) reply = { data: null, error: new Error('Synthetic read failure') };
        else reply = { data: keys.filter(key => state.store.has(key)).map(key => ({ key, value: state.badReadback && state.writes.length ? 'mismatched-persisted-value' : state.store.get(key)! })), error: null };
      }
      return Promise.resolve(reply).then(yes, no);
    },
  }; return chain;
} } }));
const clients: QueryClient[] = [];
function show(node: React.ReactNode) { const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity }, mutations: { retry: false } } }); clients.push(client); const view = render(<QueryClientProvider client={client}>{node}</QueryClientProvider>); return { ...view, client, redraw: (next: React.ReactNode) => view.rerender(<QueryClientProvider client={client}>{next}</QueryClientProvider>) }; }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
beforeEach(() => { vi.clearAllMocks(); state.rolesError = false; state.user = { id: 'admin-a' }; state.store = new Map(); state.readError = false; state.writeError = false; state.zeroAck = false; state.badReadback = false; state.failedReadback = false; state.writes = []; state.reads = []; state.readOverride = null; state.writeOverride = null; });
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); clients.length = 0; });
const contacts = () => { state.store.set('admin_emails', JSON.stringify(['ops@example.invalid'])); state.store.set('admin_whatsapp', '66900000000'); };
async function notificationForm() { show(<NotificationSettings />); return screen.findByRole('button', { name: 'Save' }); }
const org = () => { state.store.set('org_country', 'TH'); state.store.set('org_locality', 'Verified synthetic locality'); state.store.set('org_email', 'office@example.invalid'); };
function RuntimePhone() { const flags = useFeatureFlags(); return <output data-testid="phone-runtime">{String(flags.isEnabled('AUTH_PHONE'))}</output>; }

describe('notification settings use persisted global state', () => {
  it('shows read failure and retry without substituting hardcoded contacts or a save form', async () => {
    state.readError = true; show(<NotificationSettings />); expect(await screen.findByRole('alert')).toHaveTextContent('unavailable'); expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument(); expect(screen.queryByDisplayValue(/pavel@/)).not.toBeInTheDocument();
    contacts(); state.readError = false; fireEvent.click(screen.getByRole('button', { name: 'Reload settings' })); expect(await screen.findByLabelText('Email addresses (comma-separated)')).toHaveValue('ops@example.invalid');
  });
  it('saves both contacts in one request and acknowledges only exact persisted readback', async () => {
    contacts(); const save = await notificationForm(); fireEvent.change(screen.getByLabelText('Email addresses (comma-separated)'), { target: { value: 'new@example.invalid' } }); fireEvent.click(save);
    await waitFor(() => expect(state.success).toHaveBeenCalledWith('Settings saved and verified')); expect(state.writes).toHaveLength(1); expect(state.writes[0].rows.map(row => row.key)).toEqual(['admin_emails', 'admin_whatsapp']); expect(state.reads).toHaveLength(2); expect(screen.getByLabelText('Email addresses (comma-separated)')).toHaveValue('new@example.invalid');
  });
  it.each(['zero', 'read-failed', 'read-mismatch'])('does not report %s persistence as success and requires reload', async kind => {
    contacts(); const save = await notificationForm(); state.zeroAck = kind === 'zero'; state.failedReadback = kind === 'read-failed'; state.badReadback = kind === 'read-mismatch'; fireEvent.click(save);
    expect(await screen.findByRole('alert')).toHaveTextContent('Save not confirmed'); expect(state.success).not.toHaveBeenCalled(); expect(save).toBeDisabled();
  });
  it('binds reads and visible form state to the current actor, ignoring a late previous read', async () => {
    const pending = deferred<Reply>(); state.readOverride = actor => actor === 'admin-a' ? pending.promise : { data: [{ key: 'admin_emails', value: '["b@example.invalid"]' }], error: null };
    const view = show(<NotificationSettings />); await waitFor(() => expect(state.reads).toHaveLength(1)); state.user = { id: 'admin-b' }; view.redraw(<NotificationSettings />); expect(await screen.findByLabelText('Email addresses (comma-separated)')).toHaveValue('b@example.invalid');
    await act(async () => pending.resolve({ data: [{ key: 'admin_emails', value: '["a@example.invalid"]' }], error: null })); expect(screen.getByLabelText('Email addresses (comma-separated)')).toHaveValue('b@example.invalid'); expect(state.writes).toHaveLength(0);
  });
  it('does not acknowledge a prior actor save after an account switch', async () => {
    contacts(); const pending = deferred<Reply>(); const view = show(<NotificationSettings />); const save = await screen.findByRole('button', { name: 'Save' }); state.writeOverride = () => pending.promise; fireEvent.click(save); await waitFor(() => expect(state.writes).toHaveLength(1));
    state.user = { id: 'admin-b' }; view.redraw(<NotificationSettings />); await screen.findByLabelText('Email addresses (comma-separated)'); await act(async () => pending.resolve({ data: state.writes[0].rows, error: null })); expect(state.success).not.toHaveBeenCalled(); expect(state.reads.filter(read => read.actor === 'admin-a')).toHaveLength(1);
  });
});

describe('organization settings never replace failed reads with editable defaults', () => {
  it('blocks save after load failure and allows editing only after a successful retry', async () => {
    state.readError = true; show(<OrgProfileEditor />); expect(await screen.findByRole('alert')).toHaveTextContent('unavailable'); expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument(); expect(screen.queryByDisplayValue('Phuket')).not.toBeInTheDocument();
    state.readError = false; org(); fireEvent.click(screen.getByRole('button', { name: 'Reload settings' })); expect(await screen.findByLabelText('Country (ISO-2)')).toHaveValue('TH'); expect(state.writes).toHaveLength(0);
  });
  it('requires row acknowledgement and persisted readback for all organization fields', async () => {
    org(); show(<OrgProfileEditor />); const save = await screen.findByRole('button', { name: 'Save' }); fireEvent.click(save); await waitFor(() => expect(state.success).toHaveBeenCalledWith('Organization profile saved')); expect(state.writes).toHaveLength(1); expect(state.writes[0].rows).toHaveLength(11); expect(state.reads).toHaveLength(2);
  });
  it('rejects a zero-row acknowledgement and blocks subsequent save until reload', async () => {
    org(); show(<OrgProfileEditor />); const save = await screen.findByRole('button', { name: 'Save' }); state.zeroAck = true; fireEvent.click(save); expect(await screen.findByRole('alert')).toHaveTextContent('Save not confirmed'); expect(save).toBeDisabled(); expect(state.success).not.toHaveBeenCalled();
  });
});

describe('feature flag requested state is not runtime activation', () => {
  it('retries canonical roles as well as settings after a role-read failure', async () => {
    state.rolesError = true; const view = show(<FeatureFlagManager />);
    expect(await screen.findByRole('alert')).toHaveTextContent('unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Reload settings' }));
    await waitFor(() => expect(state.retryRoles).toHaveBeenCalledOnce());
    state.rolesError = false; view.redraw(<FeatureFlagManager />);
    expect(await screen.findByRole('switch', { name: 'Requested state: auth_phone' })).toBeInTheDocument();
  });
  it('keeps the existing hardcoded phone gate while exposing requested and effective states accessibly', async () => {
    state.store.set('feature_flag:auth_phone', '{"enabled":true,"rolloutPct":25}'); show(<><FeatureFlagManager /><RuntimePhone /></>);
    const control = await screen.findByRole('switch', { name: 'Requested state: auth_phone' }); expect(control).toHaveAttribute('aria-checked', 'true'); expect(control.closest('.p-3')).toHaveTextContent('Effective for your account: Off'); expect(screen.getByTestId('phone-runtime')).toHaveTextContent('false');
  });
  it('shows a retryable read error, not hardcoded switches, and fails runtime closed', async () => {
    state.readError = true; show(<><FeatureFlagManager /><RuntimePhone /></>); expect(await screen.findByRole('alert')).toHaveTextContent('unavailable'); expect(screen.queryByRole('switch')).not.toBeInTheDocument(); expect(screen.getByTestId('phone-runtime')).toHaveTextContent('false');
  });
  it('keeps a zero-row toggle unconfirmed and blocks additional toggles until reload', async () => {
    state.store.set('feature_flag:auth_phone', '{"enabled":false}'); show(<FeatureFlagManager />); const control = await screen.findByRole('switch', { name: 'Requested state: auth_phone' }); state.zeroAck = true; fireEvent.click(control); expect(await screen.findByRole('alert')).toHaveTextContent('Save not confirmed'); expect(state.success).not.toHaveBeenCalled(); expect(control).toBeDisabled();
  });
  it('preserves rollout metadata and invalidates both existing flag-reader caches after verified save', async () => {
    state.store.set('feature_flag:auth_phone', '{"enabled":false,"rolloutPct":25}'); const view = show(<FeatureFlagManager />); view.client.setQueryData(['feature-flags'], { auth_phone: false });
    const control = await screen.findByRole('switch', { name: 'Requested state: auth_phone' }); fireEvent.click(control); await waitFor(() => expect(state.success).toHaveBeenCalledWith('Flag setting saved and verified'));
    expect(JSON.parse(String(state.writes[0].rows[0].value))).toEqual({ enabled: true, rolloutPct: 25 }); expect(view.client.getQueryState(['feature-flags'])?.isInvalidated).toBe(true); expect(control.closest('.p-3')).toHaveTextContent('Effective for your account: Off');
  });
  it('treats malformed stored flag configuration as an error rather than a truthy default', async () => {
    state.store.set('feature_flag:auth_phone', '{"enabled":"false"}'); show(<FeatureFlagManager />); expect(await screen.findByRole('alert')).toHaveTextContent('unavailable'); expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
