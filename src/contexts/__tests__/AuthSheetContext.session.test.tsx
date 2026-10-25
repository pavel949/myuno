import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { AuthSheetProvider, useAuthSheet } from '../AuthSheetContext';
const fixture = vi.hoisted(() => ({ auth: { user: null, session: null, isLoading: false } as any, getUser: vi.fn(), success: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => fixture.auth }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: fixture.getUser } } }));
vi.mock('@/components/auth/AuthSheet', () => ({ AuthSheet: ({ open, onSuccess }: any) => open ? <button onClick={() => onSuccess('actor-a')}>Authenticate</button> : null }));
function Consumer() { const auth = useAuthSheet(); return <><button onClick={() => auth.openAuthSheet({ onSuccess: fixture.success })}>Inquiry</button><button onClick={auth.closeAuthSheet}>Close</button></>; }
const View = () => <AuthSheetProvider><Consumer /></AuthSheetProvider>;
afterEach(() => { cleanup(); vi.clearAllMocks(); fixture.auth = { user: null, session: null, isLoading: false }; });
describe('AuthSheet consumer session boundary', () => {
  it('rejects a verified actor different from the completed signin actor', async () => {
    fixture.getUser.mockResolvedValue({ data: { user: { id: 'actor-b' } }, error: null });
    const view = render(<View />); fireEvent.click(screen.getByText('Inquiry')); fireEvent.click(screen.getByText('Authenticate'));
    await act(async () => {});
    fixture.auth = { user: { id: 'actor-b' }, session: { user: { id: 'actor-b' } }, isLoading: false }; view.rerender(<View />);
    await act(async () => {}); expect(fixture.success).not.toHaveBeenCalled();
  });
  it('does not revive an old continuation after logout and same-account login', async () => {
    let finish: any; fixture.getUser.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    fixture.auth = { user: { id: 'actor-a' }, session: { user: { id: 'actor-a' } }, isLoading: false };
    const view = render(<View />); fireEvent.click(screen.getByText('Inquiry'));
    fixture.auth = { user: null, session: null, isLoading: false }; view.rerender(<View />);
    fixture.auth = { user: { id: 'actor-a' }, session: { user: { id: 'actor-a' } }, isLoading: false }; view.rerender(<View />);
    await act(async () => finish({ data: { user: { id: 'actor-a' } }, error: null })); expect(fixture.success).not.toHaveBeenCalled();
  });
  it('never continues an inquiry from an unauthenticated successful response', async () => {
    fixture.getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(<View />); fireEvent.click(screen.getByText('Inquiry')); fireEvent.click(screen.getByText('Authenticate'));
    await waitFor(() => expect(fixture.getUser).toHaveBeenCalled()); expect(fixture.success).not.toHaveBeenCalled();
  });
  it('waits for the same actor session and consumes continuation once', async () => {
    fixture.getUser.mockResolvedValue({ data: { user: { id: 'actor-a' } }, error: null });
    const view = render(<View />); fireEvent.click(screen.getByText('Inquiry')); fireEvent.click(screen.getByText('Authenticate'));
    await act(async () => {}); expect(fixture.success).not.toHaveBeenCalled();
    fixture.auth = { user: { id: 'actor-a' }, session: { user: { id: 'actor-a' } }, isLoading: false }; view.rerender(<View />);
    await waitFor(() => expect(fixture.success).toHaveBeenCalledTimes(1)); view.rerender(<View />); expect(fixture.success).toHaveBeenCalledTimes(1);
  });
  it('invalidates a pending continuation when another actor appears', async () => {
    fixture.getUser.mockResolvedValue({ data: { user: { id: 'actor-a' } }, error: null });
    const view = render(<View />); fireEvent.click(screen.getByText('Inquiry')); fireEvent.click(screen.getByText('Authenticate')); await act(async () => {});
    fixture.auth = { user: { id: 'actor-b' }, session: { user: { id: 'actor-b' } }, isLoading: false }; view.rerender(<View />);
    await act(async () => {}); expect(fixture.success).not.toHaveBeenCalled();
  });
  it('closing while server verification is pending prevents continuation', async () => {
    let finish: any; fixture.getUser.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<View />); fireEvent.click(screen.getByText('Inquiry')); fireEvent.click(screen.getByText('Authenticate')); fireEvent.click(screen.getByText('Close'));
    await act(async () => { finish({ data: { user: { id: 'actor-a' } }, error: null }); }); expect(fixture.success).not.toHaveBeenCalled();
  });
});
