import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from '../AuthContext';
import { AuthSheetProvider, useAuthSheet } from '../AuthSheetContext';
const f = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), success: vi.fn(), callback: null as null | ((event: string, session: Session | null) => void) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: f.getSession, getUser: f.getUser, onAuthStateChange: (callback: typeof f.callback) => { f.callback = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } } } }));
vi.mock('@/hooks/useIsAdmin', () => ({ clearAdminCache: vi.fn() }));
vi.mock('@/lib/segmentation/anonSession', () => ({ readAnonSessionId: () => null, clearAnonSessionId: vi.fn() }));
vi.mock('@/components/auth/AuthSheet', () => ({ AuthSheet: ({ open, onSuccess }: any) => open ? <button onClick={() => onSuccess('synthetic-actor')}>Authenticate</button> : null }));
const actorSession = { user: { id: 'synthetic-actor' }, access_token: 'synthetic-session-token' } as Session;
function Consumer() { const auth = useAuthSheet(); return <button onClick={() => auth.openAuthSheet({ onSuccess: f.success })}>Continue inquiry</button>; }
function mount() { return render(<QueryClientProvider client={new QueryClient()}><AuthProvider><AuthSheetProvider><Consumer /></AuthSheetProvider></AuthProvider></QueryClientProvider>); }
function pendingUser() { let finish!: (value: unknown) => void; f.getUser.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })); return () => finish({ error: null, data: { user: actorSession.user } }); }
beforeEach(() => { vi.clearAllMocks(); f.callback = null; f.getSession.mockResolvedValue({ data: { session: actorSession } }); f.getUser.mockResolvedValue({ error: null, data: { user: actorSession.user } }); });
afterEach(cleanup);
it('batched real SIGNED_OUT then SIGNED_IN of the identical actor/session invalidates the old intent', async () => {
 const finish = pendingUser(); mount(); await act(async () => {}); fireEvent.click(screen.getByText('Continue inquiry'));
 await waitFor(() => expect(f.getUser).toHaveBeenCalledTimes(1));
 act(() => { f.callback!('SIGNED_OUT', null); f.callback!('SIGNED_IN', actorSession); });
 await act(async () => finish()); expect(f.success).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Continue inquiry')); await waitFor(() => expect(f.success).toHaveBeenCalledTimes(1));
});
it('same-actor TOKEN_REFRESHED preserves an in-flight intent', async () => {
 const finish = pendingUser(); mount(); await act(async () => {}); fireEvent.click(screen.getByText('Continue inquiry'));
 await waitFor(() => expect(f.getUser).toHaveBeenCalledTimes(1));
 act(() => f.callback!('TOKEN_REFRESHED', { ...actorSession, access_token: 'synthetic-refreshed-token' }));
 await act(async () => finish()); await waitFor(() => expect(f.success).toHaveBeenCalledTimes(1));
});
it('initial anonymous-to-authenticated SIGNED_IN preserves the originating signin intent', async () => {
 f.getSession.mockResolvedValue({ data: { session: null } }); const finish = pendingUser(); mount(); await act(async () => {});
 fireEvent.click(screen.getByText('Continue inquiry')); fireEvent.click(screen.getByText('Authenticate'));
 act(() => f.callback!('SIGNED_IN', actorSession)); await act(async () => finish());
 await waitFor(() => expect(f.success).toHaveBeenCalledTimes(1));
});
it('batched actor A to B to A invalidates the old intent even with an identical final session', async () => {
 const finish = pendingUser(); mount(); await act(async () => {}); fireEvent.click(screen.getByText('Continue inquiry'));
 act(() => { f.callback!('SIGNED_IN', { user: { id: 'synthetic-other' } } as Session); f.callback!('SIGNED_IN', actorSession); });
 await act(async () => finish()); expect(f.success).not.toHaveBeenCalled();
});
